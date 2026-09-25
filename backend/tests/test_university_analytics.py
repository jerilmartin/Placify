"""Analytics must use tenant-scoped applications, not stale drive counters."""

import asyncio
import unittest
from datetime import date, timedelta
from types import SimpleNamespace
from unittest.mock import patch

from app.routers import universities


class FakeQuery:
    def __init__(self, rows):
        self.rows = rows
        self.filters = []
        self.slice = None

    def select(self, *_args):
        return self

    def eq(self, field, value):
        self.filters.append((field, lambda current: current == value))
        return self

    def in_(self, field, values):
        self.filters.append((field, lambda current: current in values))
        return self

    def order(self, *_args):
        return self

    def limit(self, *_args):
        return self

    def range(self, start, end):
        self.slice = (start, end + 1)
        return self

    def execute(self):
        rows = [row.copy() for row in self.rows]
        for field, predicate in self.filters:
            rows = [row for row in rows if predicate(row.get(field))]
        if self.slice:
            rows = rows[self.slice[0]:self.slice[1]]
        return SimpleNamespace(data=rows)


class FakeClient:
    def __init__(self, rows):
        self.rows = rows

    def table(self, name):
        return FakeQuery(self.rows[name])


class UniversityAnalyticsTests(unittest.TestCase):
    def test_counts_real_apps_and_excludes_foreign_students(self):
        future = (date.today() + timedelta(days=10)).isoformat()
        past = (date.today() - timedelta(days=10)).isoformat()
        client = FakeClient({
            "university_profiles": [{"id": "uni-1", "user_id": "uni-user", "name": "Example University"}],
            "placement_drives": [
                {"id": "drive-1", "university_id": "uni-1", "status": "upcoming", "registration_deadline": future, "package_lpa": 10, "total_registered": 75, "total_selected": 30},
                {"id": "drive-2", "university_id": "uni-1", "status": "active", "registration_deadline": past, "package_lpa": 20, "total_registered": 50, "total_selected": 20},
            ],
            "student_profiles": [
                {"id": "student-1", "university_id": "uni-1", "course": "CSE"},
                {"id": "student-2", "university_id": "uni-1", "course": "IT"},
                {"id": "foreign-student", "university_id": "uni-2", "course": "CSE"},
            ],
            "drive_applications": [
                {"id": "app-1", "drive_id": "drive-1", "student_id": "student-1", "status": "selected"},
                {"id": "app-2", "drive_id": "drive-1", "student_id": "student-2", "status": "registered"},
                {"id": "app-3", "drive_id": "drive-2", "student_id": "student-1", "status": "registered"},
                {"id": "app-4", "drive_id": "drive-1", "student_id": "foreign-student", "status": "selected"},
            ],
        })
        with patch.object(universities, "get_supabase", return_value=client):
            result = asyncio.run(universities.university_analytics(SimpleNamespace(id="uni-user")))

        self.assertEqual(result["total_drives"], 2)
        self.assertEqual(result["active_drives"], 1)
        self.assertEqual(result["total_students"], 2)
        self.assertEqual(result["total_registered"], 2)
        self.assertEqual(result["total_placed"], 1)
        self.assertEqual(len(result["applications"]), 3)
        self.assertEqual(result["drives"][0]["total_registered"], 2)
        self.assertEqual(result["drives"][0]["total_selected"], 1)


if __name__ == "__main__":
    unittest.main()
