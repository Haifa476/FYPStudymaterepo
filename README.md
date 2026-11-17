# StudyMate – 25% Mid-Evaluation Implementation

AI-powered personal academic planning assistant (single-user, student role only).
FYP 23F-48 · Computer Science Department · Supervisor: Dr. Syed Hifazat Ali Shah.

This repository contains the **foundational ~25%** of the project. See `docs/STATUS.md` for an honest
Implemented / Placeholder / Planned matrix. **Risk prediction, the study planner, the AI chat assistant and
budget/expense features are NOT implemented.**

## Structure
```
studymate/
├── database/        schema.sql (implemented tables) · schema_planned.sql (future tables)
├── backend/         Node.js + Express + Sequelize REST API, JWT auth, tests (Jest)
├── ml-service/      FastAPI skeleton (/health only; /predict returns 501) + pytest
├── frontend/        React + Vite + Tailwind + React Router + Axios + Recharts
└── docs/            STATUS.md · API.md · TESTING.md · DEMO_CHECKLIST.md · SPEAKER_NOTES.md
                     diagrams/ (Mermaid .mmd sources + png/) · screenshots/ (real screens, demo data)
```

## Prerequisites
Node.js 18+ · PostgreSQL 14+ · Python 3.10+ (only for the ML skeleton)

## Setup
### 1. Database
```bash
createdb studymate
psql -d studymate -f database/schema.sql
# (optional, separate DB for tests – tables are truncated by the integration tests)
createdb studymate_test && psql -d studymate_test -f database/schema.sql
```
### 2. Backend
```bash
cd backend
cp .env.example .env          # then fill in DATABASE_URL and JWT_SECRET (never commit .env)
npm install
npm run dev                   # http://localhost:5000/api/v1/health
SEED_DEMO_PASSWORD=choose-one npm run seed   # optional demo data: demo@studymate.local
```
### 3. Frontend
```bash
cd frontend
cp .env.example .env          # optional
npm install
npm run dev                   # http://localhost:5173  (proxies /api to the backend)
```
### 4. ML service skeleton (optional)
```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```
With it stopped, the app keeps working and `GET /api/v1/ml/status` reports it as unavailable.

## Tests
```bash
cd backend && TEST_DATABASE_URL=postgres://USER:PASS@localhost:5432/studymate_test npm test
cd ml-service && pytest
```
Details in `docs/TESTING.md`.

## Configuration notes / assumptions to confirm
* **Grade scale** (`backend/src/config/gradeScale.js`) is an *assumed* 4.0 scale – verify against the university policy.
* Default attendance minimum is 75% per course (editable per course).
* Attendance warning margin: 5 percentage points above the minimum (`attendanceService.js`).
* Logout is client-side (stateless JWT); refresh tokens are planned.
* The access token is kept in `localStorage` in this build (simple; see SDS security notes for the planned hardening).
