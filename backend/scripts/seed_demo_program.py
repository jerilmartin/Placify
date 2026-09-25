"""Idempotently add fictional Placify demo students and placement activity.

Run from backend with: python scripts/seed_demo_program.py
Requires configured Supabase service-role credentials. Never resets existing users.
New credentials are written only to ignored backend/.demo-credentials.json.
"""

import json
import secrets
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.database import get_supabase  # noqa: E402


ROOT = Path(__file__).resolve().parents[1]
CREDENTIALS = ROOT / ".demo-credentials.json"
MARKER = "[Placify demo data]"
STUDENTS = [
    ("Aanya Rao", "Computer Science", 2027, 8.7, ["Python", "React", "SQL", "Git"], "Student attendance insights", "Developed a dashboard for attendance trends using React and PostgreSQL."),
    ("Dev Menon", "Information Technology", 2027, 8.2, ["Java", "Spring Boot", "PostgreSQL", "Docker"], "Campus event API", "Built a REST API for event registration with tests and containerized deployment."),
    ("Mira Shah", "Computer Science", 2026, 9.1, ["Python", "Pandas", "SQL", "Power BI"], "Library demand forecast", "Analyzed borrowing trends and built a dashboard for resource planning."),
    ("Rohan Iyer", "Electronics", 2027, 7.8, ["Python", "C++", "IoT", "SQL"], "Lab sensor monitor", "Created a sensor monitoring prototype with alerts and historical charts."),
    ("Tara Nair", "Information Technology", 2026, 8.5, ["TypeScript", "Next.js", "Node.js", "Figma"], "Student help desk", "Designed and shipped a support ticketing prototype for student clubs."),
    ("Kabir Sethi", "Computer Science", 2027, 7.6, ["JavaScript", "React", "Node.js", "MongoDB"], "Peer learning portal", "Built a peer tutoring portal with searchable sessions and registration."),
    ("Nisha Thomas", "Computer Science", 2026, 8.9, ["Python", "FastAPI", "Docker", "AWS"], "Placement tracker", "Built a secure application tracker with API tests and deployment notes."),
    ("Aditya Bose", "Information Technology", 2027, 7.4, ["Java", "SQL", "Git", "Linux"], "Inventory workflow", "Built a simple inventory workflow with role-based views and audit events."),
]


def load_credentials():
    return json.loads(CREDENTIALS.read_text(encoding="utf-8")) if CREDENTIALS.exists() else {"accounts": []}


def save_credentials(data):
    CREDENTIALS.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def existing_user(supabase, email):
    page = 1
    while True:
        users = supabase.auth.admin.list_users(page=page, per_page=100)
        for user in users:
            if (user.email or "").lower() == email.lower():
                return user
        if len(users) < 100:
            return None
        page += 1


def ensure_students(supabase, university):
    credentials = load_credentials()
    profiles = []
    for index, (name, branch, year, cgpa, skills, project, description) in enumerate(STUDENTS, 1):
        email = f"student{index:02d}@demo.placify.example"
        profile_result = supabase.table("student_profiles").select("id,user_id").eq("email", email).limit(1).execute()
        if profile_result.data:
            profiles.append(profile_result.data[0])
            continue
        user = existing_user(supabase, email)
        if not user:
            password = secrets.token_urlsafe(18)
            user = supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": name, "role": "student", "university": university["name"], "demo": True},
                "app_metadata": {"role": "student"},
            }).user
            credentials["accounts"].append({"name": name, "email": email, "password": password, "role": "student"})
            save_credentials(credentials)
        result = supabase.table("student_profiles").insert({
            "user_id": str(user.id), "student_id": f"DEMO-26-{index:03d}",
            "full_name": name, "email": email, "university": university["name"], "university_id": university["id"],
            "course": f"B.Tech {branch}", "graduation_year": year, "cgpa": cgpa, "active_backlogs": 0,
            "skills": skills, "location": "Bengaluru", "bio": f"Fictional demo student interested in {branch} placements.",
            "projects": [{"name": project, "description": description, "tech_stack": skills[:3]}],
            "work_experience": [], "profile_completion": 80,
        }).execute()
        profiles.append(result.data[0])
        print(f"Created demo student {index}/8")
    return profiles


def ensure_record(supabase, table, filters, payload):
    query = supabase.table(table).select("*")
    for key, value in filters.items():
        query = query.eq(key, value)
    existing = query.limit(1).execute().data
    return existing[0] if existing else supabase.table(table).insert(payload).execute().data[0]


def main():
    supabase = get_supabase()
    university_rows = supabase.table("university_profiles").select("id,name").eq("name", "Christ University").limit(1).execute().data
    recruiter_rows = supabase.table("recruiter_profiles").select("id,user_id,company_name,verified").eq("company_name", "TechCorp Solutions").eq("verified", True).limit(1).execute().data
    if not university_rows or not recruiter_rows:
        raise RuntimeError("Expected Christ University and verified TechCorp Solutions recruiter; no data changed")
    university, recruiter = university_rows[0], recruiter_rows[0]
    students = ensure_students(supabase, university)
    today = date.today()
    jobs = []
    for title, skills, branches, min_cgpa, package in [
        ("Demo · Junior Software Engineer", ["Python", "React", "SQL"], ["Computer Science", "Information Technology"], 7.0, 9.0),
        ("Demo · Data Analyst", ["Python", "SQL", "Power BI"], ["Computer Science", "Information Technology", "Electronics"], 7.5, 7.5),
        ("Demo · Backend Engineering Intern", ["Java", "Spring Boot", "PostgreSQL"], ["Computer Science", "Information Technology"], 7.0, 4.8),
    ]:
        job = ensure_record(supabase, "jobs", {"title": title, "recruiter_id": recruiter["user_id"]}, {
            "title": title, "company": recruiter["company_name"], "recruiter_id": recruiter["user_id"],
            "university_id": university["id"], "status": "active", "location": "Bengaluru · Hybrid",
            "description": f"{MARKER} Practice opening for the Christ University demo cohort. Work with a small engineering team, document decisions, review code, and ship tested features.",
            "requirements": "Course projects, clear communication, and evidence of practical problem solving.",
            "skills_required": skills, "eligible_branches": branches, "min_cgpa": min_cgpa,
            "job_type": "internship" if "Intern" in title else "full_time", "experience_level": "entry",
            "salary_range": f"₹{package} LPA", "package_lpa": package, "no_of_openings": 3,
            "deadline": (today + timedelta(days=35)).isoformat(),
        })
        jobs.append(job)

    drives = []
    for title, role, skills, branches, min_cgpa, package, offset in [
        ("Demo · TechCorp Engineering Drive", "Associate Software Engineer", ["Python", "React", "SQL"], ["Computer Science", "Information Technology"], 7.0, 9.0, 42),
        ("Demo · TechCorp Analytics Drive", "Graduate Data Analyst", ["Python", "SQL", "Power BI"], ["Computer Science", "Information Technology", "Electronics"], 7.5, 7.5, 49),
    ]:
        deadline = today + timedelta(days=offset - 7)
        drive = ensure_record(supabase, "placement_drives", {"title": title, "university_id": university["id"]}, {
            "title": title, "role": role, "company_name": recruiter["company_name"], "university_id": university["id"],
            "description": f"{MARKER} Campus recruitment exercise with a screening round, technical interview, and final discussion.",
            "eligibility": {"min_cgpa": min_cgpa, "max_backlogs": 0, "eligible_branches": branches, "graduation_years": [2026, 2027], "required_skills": skills},
            "drive_date": (today + timedelta(days=offset)).isoformat(), "registration_deadline": deadline.isoformat(),
            "package_lpa": package, "location": "Bengaluru · Hybrid", "status": "upcoming",
        })
        ensure_record(supabase, "drive_requests", {"placement_drive_id": drive["id"]}, {
            "recruiter_id": recruiter["id"], "university_id": university["id"], "company_name": recruiter["company_name"],
            "title": title, "role": role, "description": drive["description"], "eligibility": drive["eligibility"],
            "drive_date": drive["drive_date"], "registration_deadline": drive["registration_deadline"],
            "package_lpa": package, "location": drive["location"], "status": "approved", "placement_drive_id": drive["id"],
        })
        drives.append(drive)

    job_statuses = ["submitted", "reviewed", "shortlisted", "interviewed", "submitted", "reviewed", "offered", "submitted"]
    drive_statuses = ["registered", "eligible", "shortlisted", "registered", "eligible", "interviewed", "registered", "eligible"]
    for index, student in enumerate(students):
        job_application = ensure_record(supabase, "applications", {"student_id": student["id"], "job_id": jobs[index % len(jobs)]["id"]}, {
            "student_id": student["id"], "job_id": jobs[index % len(jobs)]["id"], "status": job_statuses[index],
            "cover_letter": f"{MARKER} Interested in applying practical project experience to this role.",
        })
        if index == 6 and job_application["status"] == "shortlisted":
            supabase.table("applications").update({"status": "offered"}).eq("id", job_application["id"]).execute()
        if index % 2 == 0:
            ensure_record(supabase, "applications", {"student_id": student["id"], "job_id": jobs[(index + 1) % len(jobs)]["id"]}, {
                "student_id": student["id"], "job_id": jobs[(index + 1) % len(jobs)]["id"], "status": "submitted",
            })
        drive = drives[index % len(drives)]
        ensure_record(supabase, "drive_applications", {"student_id": student["id"], "drive_id": drive["id"]}, {
            "student_id": student["id"], "drive_id": drive["id"], "status": drive_statuses[index],
        })
    for drive in drives:
        count = len(supabase.table("drive_applications").select("id").eq("drive_id", drive["id"]).execute().data)
        supabase.table("placement_drives").update({"total_registered": count}).eq("id", drive["id"]).execute()
    print(f"Demo program ready: {len(students)} students, {len(jobs)} jobs, {len(drives)} drives, direct and drive applications.")
    print(f"New account credentials saved privately to {CREDENTIALS}")


if __name__ == "__main__":
    main()
