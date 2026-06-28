# Placify — AI-Powered Campus Placement Management Hub

Placify is a modern, enterprise-grade campus placement and hiring ecosystem designed to streamline the university recruitment funnel. It supports 4 role-based portals (Students, Recruiters, University Administrators, and Mentors) with AI-powered resume parsing, ATS scoring, semantic candidate matching, and placement risk prediction.

## 🚀 Technology Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS (vanilla-styled dark glass theme)
- **Backend API**: FastAPI (Python 3.11)
- **Database, Auth & Realtime**: Supabase (PostgreSQL + RLS Policies + Storage buckets)
- **AI Integrations**: Gemini 2.5 Pro / Flash APIs (ATS advice, cover letter writing, AI mock interviews, career chatbot)
- **ML Engine**: Scikit-Learn + Sentence Transformers + FAISS (lazy-loaded semantic matches and risk metrics)

---

## 📁 Repository Structure

```
Placify/
├── frontend/             # Next.js 15 App
│   ├── app/              # App router portals (student, recruiter, university, mentor)
│   ├── contexts/         # Auth & state management contexts
│   ├── lib/              # Axios API client, utils, types
│   └── package.json
│
├── backend/              # FastAPI Application
│   ├── app/              # Core API logic (routers, services, models)
│   ├── ml/               # Machine Learning modules (Sentence Transformers, predictor)
│   ├── Dockerfile
│   └── requirements.txt
│
├── supabase/             # Database migrations
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_extended_schema.sql
│
├── docker-compose.yml    # DevOps orchestration
├── .env.example          # Consolidated environment variables
└── README.md             # Project documentation
```

---

## 🔧 Installation & Setup

### 1. Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Run the migrations in order:
   - First, run `supabase/migrations/001_initial_schema.sql`.
   - Then, run `supabase/migrations/002_extended_schema.sql`.
4. Enable database triggers or storage buckets for resume PDFs as needed.

### 2. Environment Configuration
Copy `.env.example` at the project root to `.env` (and also to `frontend/.env.local` and `backend/.env`):
```bash
cp .env.example .env
```
Fill in your Supabase connection strings, service keys, and Google Gemini API keys.

### 3. Backend Setup
Make sure Python 3.11+ is installed. Run the following:
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
The API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Frontend Setup
Make sure Node.js (v20+) is installed. Run the following:
```bash
cd frontend
npm install
npm run dev
```
The frontend portal will be running at [http://localhost:3000](http://localhost:3000).

---

## 🐳 Docker Deployment

To spin up both frontend and backend automatically:
```bash
docker-compose up --build
```
This runs the FastAPI server at `localhost:8000` and Next.js client at `localhost:3000`.

---

## 🔒 License & Credits
Built for the 7th Semester Placement Management Module. Built with ❤️ using Next.js, FastAPI, and Supabase.
