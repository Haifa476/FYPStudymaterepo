# Mid-evaluation demo checklist (only things that exist)

Before the panel: start PostgreSQL, backend, frontend (and optionally the ML skeleton); run the seed for demo data.

- [ ] Register a new account (show password rule error, then success) → lands on dashboard
- [ ] Log in / log out; show a protected page redirects to login when logged out
- [ ] Courses: add, edit, delete; open a course → add an assessment, show the 100% weight cap error
- [ ] Attendance: mark present/absent; show % and **formula/working**; show warning vs below-minimum states
- [ ] Attendance what-if: simulate N more absences → threshold crossing message
- [ ] GPA: add grades → semester GPA + CGPA with working; change a grade and watch CGPA update
- [ ] Target planner: enter target CGPA + remaining credits → required average (and an unreachable target)
- [ ] GPA what-if with hypothetical grades
- [ ] Dashboard: KPI cards, attendance chart, GPA trend, alerts
- [ ] Responsive layout (narrow the browser)
- [ ] Database: show `\dt` and a few rows in PostgreSQL; show `password_hash` is a bcrypt hash
- [ ] Graceful degradation: stop the ML service → app still works; `GET /api/v1/ml/status` says unavailable
- [ ] Run `npm test` live (backend) and show the result honestly

**Do NOT demo / claim:** risk prediction, study planner, recommendations, AI chat, budget/expenses, ML accuracy.
Be ready to say: "`study_logs`, `budgets` and `expenses` tables exist, but their features are planned."
