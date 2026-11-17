# StudyMate REST API (v1) – implemented endpoints

Base URL: `http://localhost:5000/api/v1` · JSON · `Authorization: Bearer <JWT>` on everything except register/login/health.
Errors: `{ "error": { "message": "...", "details": [{ "field": "...", "message": "..." }] } }`
(400 validation · 401 auth · 404 not found / not yours · 409 conflict · 422 business rule · 500 server).

| Method | Path | Purpose | Req. |
|---|---|---|---|
| GET | /health | Liveness | – |
| POST | /auth/register | Create account → `{token, student}` | FR-01 |
| POST | /auth/login | Login → `{token, student}` | FR-01 |
| POST | /auth/logout | Acknowledge logout (token discarded client-side) | FR-01 |
| GET | /auth/me | Current student | FR-01 |
| PUT | /students/me | Update profile: name, program, current_semester, target_cgpa, daily_available_hours | Scope 4.1-1 (profile) |
| GET / POST | /courses | List (`?semester=`) / create | FR-02 |
| GET / PUT / DELETE | /courses/:id | Read / update / delete (cascades) | FR-02 |
| GET / POST | /assessments | List (`?course_id=`) / create `{course_id,type,title,due_date,weight_percent,max_marks,obtained_marks?}` | FR-03 |
| PUT / DELETE | /assessments/:id | Update / delete | FR-03 |
| GET | /attendance/overview | Summary for every course | FR-04, FR-06 |
| GET / POST | /courses/:courseId/attendance | History + summary / record `{date,status: present|absent}` | FR-04 |
| GET | /courses/:courseId/attendance/summary | Percentage, status, max extra absences, formula & working | FR-04, FR-06 |
| POST | /courses/:courseId/attendance/what-if | `{additional_absences}` → projected % | FR-05 |
| DELETE | /attendance/:id | Remove a record | FR-04 |
| GET / POST | /grades | List / create `{course_id, letter_grade}` (points, semester, credits derived server-side) | FR-07 |
| PUT / DELETE | /grades/:id | Change letter / delete | FR-07 |
| GET | /gpa/scale | Grade-point scale in use | FR-07 |
| GET | /gpa/summary | Semester GPAs + CGPA with formula, working, steps | FR-07 |
| POST | /gpa/target | `{target_cgpa?, remaining_credit_hours}` → required average | FR-08 |
| POST | /gpa/what-if | `{scenarios:[{credit_hours, letter_grade}]}` → projected CGPA | FR-09 |
| GET | /dashboard/summary | KPIs, attendance, semester GPAs, upcoming assessments | FR-18 (partial) |
| GET | /ml/status | ML-service availability; `risk_prediction.implemented` is `false` | NFR-05 |

ML service (FastAPI, port 8000): `GET /health` (implemented) · `POST /predict` → **501 Not Implemented** (planned contract in `ml-service/app/schemas.py`).
