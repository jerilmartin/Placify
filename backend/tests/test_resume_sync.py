"""Regression checks for resume-to-profile synchronization."""

import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from app.routers import resumes


class FakeTable:
    def __init__(self, client, name):
        self.client = client
        self.name = name
        self.pending_update = None

    def select(self, *_args):
        return self

    def eq(self, *_args):
        return self

    def limit(self, *_args):
        return self

    def update(self, values):
        self.pending_update = values
        return self

    def execute(self):
        if self.name == "student_profiles":
            if self.pending_update is not None:
                self.client.updated = self.pending_update
            return SimpleNamespace(data=[self.client.profile])
        if self.name == "resumes":
            return SimpleNamespace(data=[self.client.resume])
        raise AssertionError("Unexpected table: " + self.name)


class FakeClient:
    def __init__(self, profile, extracted):
        self.profile = profile
        self.resume = {
            "id": "saved-resume",
            "student_id": profile["id"],
            "extracted_data": extracted,
        }
        self.updated = None

    def table(self, name):
        return FakeTable(self, name)


class ResumeSyncTests(unittest.TestCase):
    def setUp(self):
        self.profile = {
            "id": "student-profile",
            "full_name": "Alex Chen",
            "email": "alex@example.com",
            "course": "B.Tech CSE",
            "university": "Christ University",
            "cgpa": None,
            "graduation_year": None,
            "profile_completion": 20,
        }
        self.user = SimpleNamespace(id="account-id", email="alex@example.com")

    def run_sync(self, client):
        with patch.object(resumes, "get_supabase", return_value=client):
            return asyncio.run(
                resumes.sync_resume_to_profile("saved-resume", current_user=self.user)
            )

    def test_education_fields_sync_even_when_course_already_exists(self):
        client = FakeClient(self.profile, {
            "education": [{"degree": "B.Tech CSE", "institution": "Christ University", "cgpa": 8.6, "year": 2027}]
        })
        result = self.run_sync(client)
        self.assertEqual(client.updated["cgpa"], 8.6)
        self.assertEqual(client.updated["graduation_year"], 2027)
        self.assertNotIn("course", client.updated)
        self.assertIn("cgpa", result["synced_fields"])

    def test_empty_extraction_is_not_reported_as_up_to_date(self):
        client = FakeClient(self.profile, {"_ai_parsed": False})
        with self.assertRaises(HTTPException) as error:
            self.run_sync(client)
        self.assertEqual(error.exception.status_code, 422)
        self.assertIsNone(client.updated)

    def test_matching_profile_is_not_overwritten(self):
        client = FakeClient(self.profile, {"name": "Alex Chen"})
        result = self.run_sync(client)
        self.assertEqual(result["synced_fields"], [])
        self.assertIn("No new fields", result["message"])
        self.assertIsNone(client.updated)


if __name__ == "__main__":
    unittest.main()
