# Placify: Campus Placement Management System

Placify is a multi-tenant campus placement and recruitment ecosystem developed to streamline the university recruitment lifecycle. The system provides dedicated, role-isolated portals for Students, Recruiters, University Placement Officers, and Mentors, backed by automated eligibility verification, structured ATS resume evaluation, semantic candidate matching, and cohort-level recruitment analytics.

---

## System Architecture and Tech Stack

### Frontend Architecture
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom architectural design tokens (warm parchment `#F7F4EF` canvas, deep navy `#0A192F` navigation surfaces, rich burgundy `#800020` primary actions, and muted gold `#D4AF37` active indicators)
- **Typography**: Editorial serif headings (`Newsreader`, `Playfair Display`) paired with clean sans-serif interface elements (`Plus Jakarta Sans`)
- **State & Data Visualization**: React Context, Framer Motion, Recharts data visualization suite, Lucide Icons, Sonner notification manager

### Backend Architecture
- **Framework**: FastAPI (Python 3.11) with asynchronous request pipelines
- **Validation**: Pydantic schemas with strict type constraints
- **Server**: Uvicorn ASGI production server

### Database, Storage, and Security
- **Engine**: Supabase (PostgreSQL 15)
- **Security & Multi-Tenancy**: PostgreSQL Row Level Security (RLS) policies enforcing cohort isolation across student and university records
- **Storage**: Supabase Storage buckets for student resume PDFs and recruiter company logos
- **Realtime**: PostgreSQL triggers and Supabase Realtime publication for application status changes and placement drive announcements

### Intelligence and Evaluation Services
- **Generative AI**: Google Gemini API for structured resume parsing, ATS readiness scoring, context-aware cover letter synthesis, and mock technical interview evaluation
- **Machine Learning**: Scikit-learn, Sentence Transformers, and FAISS indexing for candidate-job semantic affinity scoring

---

## Core System Modules

1. **Student Portal**
   - Active placement drive discovery with automated eligibility status based on CGPA and branch requirements
   - Single-click drive application with status timeline tracking
   - PDF resume upload, extraction, and ATS compatibility scoring
   - AI-assisted mock technical interviews with structured rubric evaluations
   - Career guidance assistant and 1:1 alumni mentorship scheduling

2. **Recruiter Portal**
   - Campus drive request creation with customizable branch filters and eligibility criteria
   - Candidate discovery directory with semantic search and attribute filtering
   - Application roster review and multi-stage candidate evaluation (Aptitude, Technical, HR, Offered, Rejected)
   - Company profile and institutional collaboration management

3. **University Placement Cell Portal**
   - Review, approve, reject, or request revisions for incoming recruiter drive proposals
   - Cohort student directory with verification status and academic performance metrics
   - Drive-wise and department-wise placement statistics and CTC distribution charts
   - CSV export capabilities for institutional reporting and accreditation audits

4. **Mentor Portal**
   - Mentorship session scheduling and calendar coordination
   - Student resume critique and performance feedback logging

5. **Super Admin Module**
   - University tenant provisioning and verification controls
   - Cross-tenant audit logging and access monitoring

---

## Repository Structure

```
Placify/
├── frontend/                  # Next.js 16 web application
│   ├── app/                   # App Router pages and layouts
│   │   ├── admin/             # Super Admin portal
│   │   ├── mentor/            # Mentor portal
│   │   ├── recruiter/         # Recruiter portal
│   │   ├── student/           # Student portal
│   │   ├── university/        # University placement cell portal
│   │   ├── login/             # Authentication interface
│   │   └── register/          # Role-based onboarding
│   ├── components/            # Reusable UI primitives and layout components
│   ├── contexts/              # Authentication and application state providers
│   └── lib/                   # API client bindings, types, and utility helpers
│
├── backend/                   # FastAPI backend services
│   ├── app/
│   │   ├── routers/           # Domain API route handlers
│   │   ├── services/          # Business logic and Gemini integrations
│   │   └── models/            # Pydantic data schemas
│   ├── ml/                    # Machine learning and semantic matching modules
│   ├── Dockerfile
│   └── requirements.txt
│
├── supabase/
│   └── migrations/
│       └── combined_schema.sql # Consolidated PostgreSQL schema and RLS policies
│
├── docker-compose.yml         # Container orchestration configuration
└── README.md                  # Project documentation
```

---

## Installation and Setup

### Prerequisites
- Node.js (v20.0.0 or higher)
- Python (v3.11 or higher)
- Supabase account and project
- Google Gemini API key

---

### 1. Database Setup (Supabase)

1. Navigate to the SQL Editor in your Supabase project dashboard.
2. Execute the consolidated schema migration file:
   ```
   supabase/migrations/combined_schema.sql
   ```
   This script provisions all required tables, Row Level Security policies, automated notification triggers, and tenant isolation functions in a single transaction.
3. Verify that the following storage buckets are present (create if not automatically provisioned):
   - `resumes` (Private, for uploaded candidate resume documents)
   - `company-logos` (Public, for verified recruiter branding assets)

---

### 2. Environment Configuration

Copy the example environment file at the repository root to create your local configurations:

```bash
cp .env.example .env
```

#### Frontend Configuration (`frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Backend Configuration (`backend/.env`):
```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
GEMINI_API_KEY=<your-google-gemini-api-key>
GEMINI_MODEL_FLASH=gemini-3.5-flash
GEMINI_MODEL_FALLBACK=gemini-3.5-flash-lite
PORT=8000
```

Gemini quotas are per project and vary by model. Placify retries quota-limited generation on the configured Flash-Lite fallback; if both models are exhausted, AI-only actions return a clear error instead of sample content. Check your limits in [Google AI Studio](https://ai.google.dev/gemini-api/docs/rate-limits).

---

### 3. Backend Service Setup

From the repository root:

```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive OpenAPI documentation is accessible at:
```
http://localhost:8000/docs
```

---

### 4. Frontend Application Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend portal will be active at:
```
http://localhost:3000
```

---

## Containerized Deployment (Docker)

To run the complete Placify stack via Docker Compose:

```bash
docker-compose up --build
```

This starts:
- The FastAPI service at `http://localhost:8000`
- The Next.js frontend at `http://localhost:3000`

---

## Verification and Quality Assurance

- **Type Checking and Production Build**:
  ```bash
  cd frontend
  npm run build
  ```
- **Backend Service Health Check**:
  ```bash
  curl http://localhost:8000/health
  ```
- **Interactive API Documentation**:
  ```
  http://localhost:8000/docs
  ```

### Fictional demo placement program

With the backend Supabase service-role environment configured, run `python scripts/seed_demo_program.py` from `backend/`. The idempotent script adds eight fictional Christ University student accounts, three current direct jobs, two upcoming drives, and linked applications for the existing verified TechCorp Solutions recruiter. It does not change existing student accounts. New account passwords are generated individually and saved only to the git-ignored `backend/.demo-credentials.json`; never commit or share that file. All seeded listings are marked as demo data and are not actual hiring opportunities.

### Recruiter interview scheduling

For an existing Supabase project, run `supabase/migrations/interview_appointments.sql` once in the Supabase SQL Editor before using Recruiter → Interviews. The service-role API key cannot create this table. Fresh installs using `combined_schema.sql` already include it. Recruiters schedule from Candidate Pipeline for either direct jobs or approved campus drives, supplying a future date/time and either an HTTPS video link or an in-person location. Students see the appointment in Applications and on their dashboard; notifications link back to Applications. A Google Calendar/Meet invitation must currently be created separately and its meeting link pasted into Placify—calendar/Meet OAuth automation is not enabled.

---

## License and Academic Context

Developed as a Final Year Engineering Project module for automated campus placement administration. All rights reserved.
