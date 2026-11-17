# Testing

| Suite | Command | What it covers |
|---|---|---|
| Backend unit (16) | `cd backend && npm run test:unit` | GPA/CGPA, target planner, what-if, attendance %, status thresholds, edge cases (no data, unreachable targets) |
| Backend integration (19) | `cd backend && TEST_DATABASE_URL=... npm test` | Register/login/JWT, bcrypt hashing, per-student data isolation, course/assessment/attendance/grade flows, validation errors, cascade delete, ML-down degradation |
| ML skeleton (3) | `cd ml-service && pytest` | `/health`, `/predict` → 501, input-contract validation |
| Frontend | – | **No automated tests yet.** Verified by a scripted browser walkthrough (login → dashboard → courses → course detail → attendance what-if → GPA planner/what-if → mobile layout → registration validation) |

Integration tests need a **separate** PostgreSQL database with `database/schema.sql` applied; they TRUNCATE the tables.
Without `TEST_DATABASE_URL` they are skipped (unit tests still run).

Manual checks: see `DEMO_CHECKLIST.md`.
