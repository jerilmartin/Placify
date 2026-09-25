"""Course equivalence and persistence regressions for job eligibility."""

import asyncio
import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import patch

from app.models.student import StudentProfileUpdate
from app.routers import jobs, students, universities
from app.services.eligibility_service import is_eligible_for_drive, matches_branch


class FakeQuery:
    def __init__(self, rows):
        self.rows = rows
        self.filters = []
        self.pending_update = None
        self.pending_insert = None

    def select(self, *_args):
        return self

    def eq(self, field, value):
        self.filters.append(lambda row: row.get(field) == value)
        return self

    def is_(self, field, value):
        self.filters.append(lambda row: row.get(field) is None if value == "null" else row.get(field) == value)
        return self

    def ilike(self, field, value):
        self.filters.append(lambda row: (row.get(field) or "").casefold() == value.casefold())
        return self

    def limit(self, *_args):
        return self

    def update(self, data):
        self.pending_update = data
        return self

    def insert(self, data):
        self.pending_insert = data
        return self

    def execute(self):
        if self.pending_insert is not None:
            self.rows.append(self.pending_insert.copy())
            return SimpleNamespace(data=[self.pending_insert.copy()])
        selected = [row for row in self.rows if all(check(row) for check in self.filters)]
        if self.pending_update is not None:
            for row in selected:
                row.update(self.pending_update)
        return SimpleNamespace(data=[row.copy() for row in selected])


class FakeClient:
    def __init__(self, tables):
        self.tables = tables

    def table(self, name):
        return FakeQuery(self.tables[name])


class EligibilityTests(unittest.TestCase):
    def test_degree_variants_match_the_allowed_discipline(self):
        for course in ("B.S. Computer Science", "B.Tech CSE", "B.E. Computer Science & Engineering", "M.S. Comp Sci"):
            with self.subTest(course=course):
                self.assertTrue(matches_branch(course, "Computer Science"))
                self.assertTrue(matches_branch(course, "Computer Science & Engineering"))
        self.assertTrue(matches_branch("B.S. Information Technology", "IT"))
        self.assertFalse(matches_branch("B.S. Computer Science", "IT"))
        self.assertFalse(matches_branch("B.Tech Civil Engineering", "IT"))
        self.assertFalse(matches_branch("", "Computer Science"))

    def test_new_cgpa_immediately_changes_eligibility(self):
        profile = {"course": "B.S. Computer Science", "cgpa": 4, "active_backlogs": 0, "graduation_year": 2026}
        criteria = {"min_cgpa": 8, "max_backlogs": 0, "graduation_year": 2026, "eligible_branches": ["Computer Science", "IT"]}
        self.assertFalse(is_eligible_for_drive(profile, criteria))
        profile["cgpa"] = 8
        self.assertTrue(is_eligible_for_drive(profile, criteria))

    def test_university_list_applies_rules_to_linked_and_legacy_students(self):
        client = FakeClient({
            "university_profiles": [{"id": "uni-1", "user_id": "uni-user", "name": "Example University"}],
            "placement_drives": [{"id": "00000000-0000-0000-0000-000000000001", "university_id": "uni-1", "eligibility": {
                "min_cgpa": 8, "max_backlogs": 0, "graduation_year": 2026, "eligible_branches": ["Computer Science"]}}],
            "student_profiles": [
                {"id": "eligible", "university_id": "uni-1", "course": "B.S. Computer Science", "cgpa": 8, "active_backlogs": None, "graduation_year": 2026},
                {"id": "low-gpa", "university_id": "uni-1", "course": "B.S. Computer Science", "cgpa": 4, "active_backlogs": 0, "graduation_year": 2026},
                {"id": "legacy", "university_id": None, "university": "Example University", "course": "B.Tech CSE", "cgpa": 9, "active_backlogs": 0, "graduation_year": 2026},
                {"id": "foreign", "university_id": "uni-2", "university": "Example University", "course": "B.Tech CSE", "cgpa": 9, "active_backlogs": 0, "graduation_year": 2026},
            ],
        })
        with patch.object(universities, "get_supabase", return_value=client):
            result = asyncio.run(universities.get_eligible_students(uuid.UUID("00000000-0000-0000-0000-000000000001"), SimpleNamespace(id="uni-user")))
        self.assertEqual({row["id"] for row in result["students"]}, {"eligible", "legacy"})

    def test_profile_update_returns_stored_cgpa(self):
        client = FakeClient({
            "student_profiles": [{"id": "student-1", "user_id": "student-user", "full_name": "Example Student", "cgpa": 4, "course": "B.S. Computer Science"}],
        })
        with patch.object(students, "get_supabase", return_value=client):
            result = asyncio.run(students.update_profile(StudentProfileUpdate(cgpa=8), SimpleNamespace(id="student-user")))
        self.assertEqual(result["cgpa"], 8)
        self.assertEqual(client.tables["student_profiles"][0]["cgpa"], 8)

    def test_drive_registration_uses_newly_saved_cgpa(self):
        drive_id = uuid.UUID("00000000-0000-0000-0000-000000000002")
        client = FakeClient({
            "student_profiles": [{"id": "student-1", "user_id": "student-user", "university_id": "uni-1",
                                  "course": "B.S. Computer Science", "cgpa": 4, "active_backlogs": 0}],
            "placement_drives": [{"id": str(drive_id), "university_id": "uni-1", "status": "active",
                                  "eligibility": {"min_cgpa": 8, "eligible_branches": ["Computer Science"]}}],
            "drive_applications": [],
        })
        with patch.object(jobs, "get_supabase", return_value=client):
            with self.assertRaisesRegex(Exception, "eligibility criteria"):
                asyncio.run(jobs.apply_to_drive(drive_id, SimpleNamespace(id="student-user")))
            client.tables["student_profiles"][0]["cgpa"] = 8
            result = asyncio.run(jobs.apply_to_drive(drive_id, SimpleNamespace(id="student-user")))
        self.assertEqual(result["status"], "registered")
        self.assertEqual(len(client.tables["drive_applications"]), 1)


if __name__ == "__main__":
    unittest.main()
