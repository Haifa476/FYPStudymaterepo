# Implementation status (what actually exists)

Requirement IDs are those of the approved proposal (Section 5.7 / 5.8).

| Req. | Proposal requirement (short) | Status in this build | Where |
|---|---|---|---|
| FR-01 | Register, log in, log out (JWT) | **Implemented** – bcrypt, JWT, rate-limited login; logout is client-side (stateless JWT). Refresh tokens: *Planned* | `authController.js`, `Login.jsx`, `Register.jsx` |
| (scope 4.1-1) | Personal profile | **Implemented** – name, program, semester, target CGPA, daily available hours (API; no dedicated profile screen yet) | `PUT /students/me` |
| FR-02 | Course CRUD with credit hours & attendance policy | **Implemented** | `courseController.js`, `Courses.jsx` |
| FR-03 | Assessments (type, due date, weight, marks) | **Implemented** – CRUD, 100% weight cap. Weighted course standing: *Planned* | `assessmentController.js`, `CourseDetail.jsx` |
| FR-04 | Attendance per course + percentage | **Implemented** | `attendanceService.js`, `Attendance.jsx` |
| FR-05 | What-if additional absences | **Implemented** | same |
| FR-06 | Warning near/below policy threshold | **Implemented** | same + dashboard alerts |
| FR-07 | Semester GPA and CGPA | **Implemented** – formula and working shown | `gpaService.js`, `Gpa.jsx` |
| FR-08 | Required average for target CGPA; infeasibility | **Implemented** | same |
| FR-09 | Grade what-if scenarios with calculation | **Implemented** | same |
| FR-10 | Study-hour logging, daily available time | **Planned** – `study_logs` table and profile field exist; no endpoints/UI for logging | – |
| FR-11, FR-12 | Study plan, study-hour recommendation | **Planned** | – |
| FR-13, FR-14 | ML risk category/probability, contributing factors | **Placeholder only** – FastAPI skeleton; `/predict` returns HTTP 501. No dataset, model or accuracy exists | `ml-service/` |
| FR-15, FR-16 | Pocket money, expenses, projections | **Planned** – `budgets`/`expenses` tables exist; no endpoints/UI | – |
| FR-17 | Chat assistant | **Planned** | – |
| FR-18 | Dashboards (trend, attendance, risk, workload, spending) | **Partial** – attendance chart, GPA-by-semester chart, KPIs, upcoming assessments. Risk, workload, spending charts: *Planned* | `Dashboard.jsx` |
| FR-19 | Export / permanently delete all data | **Planned** (per-record deletion exists; account-level export/delete does not) | – |
| NFR-02 | Every figure accompanied by explanation | **Implemented** for attendance and GPA results | `FormulaBox` component |
| NFR-03 | bcrypt, signed JWT, server-side authorisation | **Implemented** (HTTPS = deployment concern, not configured) | middleware, `ownership.js` |
| NFR-04 | Per-user data isolation | **Implemented** (verified by integration test); export/delete: *Planned* | `ownership.js` |
| NFR-05 | Graceful degradation if ML/chat down | **Implemented for ML status check** (chat not built) | `mlClient.js`, `/ml/status` |
| NFR-06 | Modular separation | **Implemented** (analytics services separate from controllers; ML separate service) | structure |
| NFR-07 | Responsive UI | **Implemented** (checked at 1440px and 390px widths) | `Layout.jsx` |
| NFR-01, NFR-08 | Response-time targets; predictions as estimates | **Not measured / not applicable yet** – no performance benchmarking has been done | – |

Database: 8 tables implemented (`students, courses, assessments, attendance_records, grades, study_logs, budgets, expenses`);
4 designed-only tables in `database/schema_planned.sql` (`study_plans, plan_tasks, risk_predictions, chat_messages`).
Deviation from the proposal ERD: `courses.instructor` added (proposal scope item 4.1-2 requires an instructor label).
Automated frontend tests: **none yet** (UI verified by a scripted browser walkthrough only).
