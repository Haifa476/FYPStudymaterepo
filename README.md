# StudyMate

AI-powered personal academic planning assistant for students.

## Structure
```
studymate/
├── database/        PostgreSQL schema files
├── backend/         Node.js + Express + Sequelize REST API, JWT auth, tests (Jest)
├── ml-service/      FastAPI service for ML features + pytest
├── frontend/        React + Vite + Tailwind + React Router + Axios + Recharts
└── docs/            API.md · TESTING.md · DEMO_CHECKLIST.md · SPEAKER_NOTES.md
                     diagrams/ (Mermaid .mmd sources + png/) · screenshots/
```

## Prerequisites
Node.js 18+ · PostgreSQL 14+ · Python 3.10+ (for the ML service)

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
### 4. ML service (optional)
```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```
If the ML service is not running, the app keeps working and `GET /api/v1/ml/status` reports it as unavailable.

## Tests
```bash
cd backend && TEST_DATABASE_URL=postgres://USER:PASS@localhost:5432/studymate_test npm test
cd ml-service && pytest
```
Details in `docs/TESTING.md`.

## Configuration notes
* **Grade scale** (`backend/src/config/gradeScale.js`) uses a 4.0 scale – verify it against your university policy.
* Default attendance minimum is 75% per course (editable per course).
* Attendance warning margin: 5 percentage points above the minimum (`attendanceService.js`).
* Logout is client-side (stateless JWT).
* The access token is kept in `localStorage` in this build.
