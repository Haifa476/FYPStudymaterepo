/**
 * End-to-end API tests against a REAL PostgreSQL database.
 * Requires TEST_DATABASE_URL pointing at a database where schema.sql has been applied.
 * WARNING: tables are truncated before the run – use a dedicated test database.
 */
const request = require('supertest');

const hasDb = Boolean(process.env.TEST_DATABASE_URL) && !process.env.TEST_DATABASE_URL.includes('unused:unused');
const d = hasDb ? describe : describe.skip;

d('StudyMate API (integration)', () => {
  let app; let sequelize; let tokenA; let tokenB; let courseId; let course2Id;

  beforeAll(async () => {
    app = require('../../src/app');
    ({ sequelize } = require('../../src/models'));
    await sequelize.query('TRUNCATE students RESTART IDENTITY CASCADE');
  });
  afterAll(async () => { if (sequelize) await sequelize.close(); });

  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const reg = (email) => request(app).post('/api/v1/auth/register').send({ name: 'Test User', email, password: 'Passw0rdOK' });

  describe('authentication', () => {
    test('registers, hashes the password, and returns a token', async () => {
      const res = await reg('a@example.com');
      expect(res.status).toBe(201);
      expect(res.body.token).toBeTruthy();
      expect(res.body.student.password_hash).toBeUndefined();
      const [rows] = await sequelize.query("SELECT password_hash FROM students WHERE email='a@example.com'");
      expect(rows[0].password_hash).not.toContain('Passw0rdOK');
      expect(rows[0].password_hash.startsWith('$2')).toBe(true); // bcrypt
      tokenA = res.body.token;
    });
    test('rejects duplicate email (409) and weak password (400)', async () => {
      expect((await reg('a@example.com')).status).toBe(409);
      const weak = await request(app).post('/api/v1/auth/register').send({ name: 'X Y', email: 'w@example.com', password: 'short' });
      expect(weak.status).toBe(400);
      expect(weak.body.error.details.length).toBeGreaterThan(0);
    });
    test('login succeeds, wrong password fails with a generic message', async () => {
      const ok = await request(app).post('/api/v1/auth/login').send({ email: 'a@example.com', password: 'Passw0rdOK' });
      expect(ok.status).toBe(200);
      const bad = await request(app).post('/api/v1/auth/login').send({ email: 'a@example.com', password: 'nope-nope1' });
      expect(bad.status).toBe(401);
      expect(bad.body.error.message).toBe('Invalid email or password');
    });
    test('protected routes require a valid token', async () => {
      expect((await request(app).get('/api/v1/courses')).status).toBe(401);
      expect((await request(app).get('/api/v1/courses').set(auth('garbage'))).status).toBe(401);
      expect((await request(app).get('/api/v1/auth/me').set(auth(tokenA))).status).toBe(200);
    });
    test('profile update stores target CGPA', async () => {
      const res = await request(app).put('/api/v1/students/me').set(auth(tokenA)).send({ target_cgpa: 3.5, current_semester: 3 });
      expect(res.status).toBe(200);
      expect(res.body.student.target_cgpa).toBe(3.5);
    });
  });

  describe('courses & assessments', () => {
    test('course CRUD', async () => {
      const c = await request(app).post('/api/v1/courses').set(auth(tokenA))
        .send({ code: 'CSC201', title: 'Data Structures', credit_hours: 4, semester: 3 });
      expect(c.status).toBe(201);
      expect(c.body.course.attendance_policy_min_percent).toBe(75);
      courseId = c.body.course.course_id;
      const c2 = await request(app).post('/api/v1/courses').set(auth(tokenA))
        .send({ code: 'MTH201', title: 'Linear Algebra', credit_hours: 3, semester: 3, attendance_policy_min_percent: 80 });
      course2Id = c2.body.course.course_id;

      expect((await request(app).post('/api/v1/courses').set(auth(tokenA))
        .send({ code: 'CSC201', title: 'Dup', credit_hours: 4, semester: 3 })).status).toBe(409);
      expect((await request(app).post('/api/v1/courses').set(auth(tokenA))
        .send({ code: 'X', title: 'Bad', credit_hours: 9, semester: 3 })).status).toBe(400);

      const upd = await request(app).put(`/api/v1/courses/${courseId}`).set(auth(tokenA)).send({ title: 'DSA' });
      expect(upd.body.course.title).toBe('DSA');
      const list = await request(app).get('/api/v1/courses').set(auth(tokenA));
      expect(list.body.courses).toHaveLength(2);
    });
    test("a student cannot see or modify another student's data", async () => {
      tokenB = (await reg('b@example.com')).body.token;
      expect((await request(app).get(`/api/v1/courses/${courseId}`).set(auth(tokenB))).status).toBe(404);
      expect((await request(app).delete(`/api/v1/courses/${courseId}`).set(auth(tokenB))).status).toBe(404);
      expect((await request(app).get('/api/v1/courses').set(auth(tokenB))).body.courses).toHaveLength(0);
      expect((await request(app).post(`/api/v1/courses/${courseId}/attendance`).set(auth(tokenB)).send({ date: '2026-09-01', status: 'present' })).status).toBe(404);
    });
    test('assessment CRUD with validation and 100% weight cap', async () => {
      const a = await request(app).post('/api/v1/assessments').set(auth(tokenA))
        .send({ course_id: courseId, type: 'midterm', title: 'Midterm', weight_percent: 60, max_marks: 50, due_date: '2026-12-01' });
      expect(a.status).toBe(201);
      expect(a.body.assessment.status).toBe('pending');
      const over = await request(app).post('/api/v1/assessments').set(auth(tokenA))
        .send({ course_id: courseId, type: 'final', title: 'Final', weight_percent: 50, max_marks: 100 });
      expect(over.status).toBe(422);
      const badMarks = await request(app).put(`/api/v1/assessments/${a.body.assessment.assessment_id}`).set(auth(tokenA)).send({ obtained_marks: 80 });
      expect(badMarks.status).toBe(400);
      const graded = await request(app).put(`/api/v1/assessments/${a.body.assessment.assessment_id}`).set(auth(tokenA)).send({ obtained_marks: 40 });
      expect(graded.body.assessment.status).toBe('graded');
      expect((await request(app).get(`/api/v1/assessments?course_id=${courseId}`).set(auth(tokenA))).body.assessments).toHaveLength(1);
      expect((await request(app).delete(`/api/v1/assessments/${a.body.assessment.assessment_id}`).set(auth(tokenA))).status).toBe(204);
    });
  });

  describe('attendance', () => {
    test('records attendance and returns a transparent summary', async () => {
      const days = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'];
      for (const [i, date] of days.entries()) {
        const r = await request(app).post(`/api/v1/courses/${courseId}/attendance`).set(auth(tokenA)).send({ date, status: i === 3 ? 'absent' : 'present' });
        expect(r.status).toBe(201);
      }
      const s = await request(app).get(`/api/v1/courses/${courseId}/attendance/summary`).set(auth(tokenA));
      expect(s.body.summary.attendance_percent).toBe(75);
      expect(s.body.summary.status).toBe('at_risk');
      expect(s.body.summary.working).toContain('3 ÷ 4 × 100 = 75%');
    });
    test('what-if absences and validation', async () => {
      const w = await request(app).post(`/api/v1/courses/${courseId}/attendance/what-if`).set(auth(tokenA)).send({ additional_absences: 2 });
      expect(w.body.result.after_percent).toBe(50);
      expect(w.body.result.crosses_threshold).toBe(true); // 75% (== minimum) -> 50% (below 75%)
    });
    test('invalid attendance payload is rejected; overview lists all courses', async () => {
      expect((await request(app).post(`/api/v1/courses/${courseId}/attendance`).set(auth(tokenA)).send({ date: '01/09/2026', status: 'present' })).status).toBe(400);
      const o = await request(app).get('/api/v1/attendance/overview').set(auth(tokenA));
      expect(o.body.courses).toHaveLength(2);
      expect(o.body.courses.find((c) => c.code === 'MTH201').summary.status).toBe('no_data');
    });
  });

  describe('grades, GPA and CGPA', () => {
    test('records grades with server-derived points, semester and credit hours', async () => {
      const g1 = await request(app).post('/api/v1/grades').set(auth(tokenA)).send({ course_id: courseId, letter_grade: 'a' });
      expect(g1.status).toBe(201);
      expect(g1.body.grade).toMatchObject({ letter_grade: 'A', grade_points: 4, credit_hours: 4, semester: 3 });
      const g2 = await request(app).post('/api/v1/grades').set(auth(tokenA)).send({ course_id: course2Id, letter_grade: 'B' });
      expect(g2.status).toBe(201);
      expect((await request(app).post('/api/v1/grades').set(auth(tokenA)).send({ course_id: courseId, letter_grade: 'B' })).status).toBe(409);
      expect((await request(app).post('/api/v1/grades').set(auth(tokenA)).send({ course_id: courseId, letter_grade: 'Q' })).status).toBe(400);
    });
    test('GPA summary: (4×4.0 + 3×3.0) ÷ 7 = 3.57', async () => {
      const s = await request(app).get('/api/v1/gpa/summary').set(auth(tokenA));
      expect(s.body.cgpa.value).toBe(3.57);
      expect(s.body.cgpa.total_credit_hours).toBe(7);
      expect(s.body.semesters).toHaveLength(1);
    });
    test('target planner uses profile target when none supplied', async () => {
      const t = await request(app).post('/api/v1/gpa/target').set(auth(tokenA)).send({ remaining_credit_hours: 21 });
      expect(t.status).toBe(200);
      expect(t.body.result.inputs.target_cgpa).toBe(3.5);
      expect(t.body.result.feasible).toBe(true);
      const bad = await request(app).post('/api/v1/gpa/target').set(auth(tokenA)).send({ remaining_credit_hours: 0 });
      expect(bad.status).toBe(400);
    });
    test('what-if scenario', async () => {
      const w = await request(app).post('/api/v1/gpa/what-if').set(auth(tokenA)).send({ scenarios: [{ credit_hours: 3, letter_grade: 'C' }] });
      expect(w.body.result.projected_cgpa).toBe(3.1); // (25 + 3×2.0) ÷ (7 + 3) = 31 ÷ 10
    });
    test('dashboard summary aggregates the above', async () => {
      const d2 = await request(app).get('/api/v1/dashboard/summary').set(auth(tokenA));
      expect(d2.status).toBe(200);
      expect(d2.body.counts.courses).toBe(2);
      expect(d2.body.cgpa.value).toBe(3.57);
    });
  });

  describe('platform behaviour', () => {
    test('health, unknown route and malformed JSON are handled cleanly', async () => {
      expect((await request(app).get('/api/v1/health')).body.status).toBe('ok');
      expect((await request(app).get('/api/v1/nope')).status).toBe(401); // unauthenticated: routes are not revealed
      expect((await request(app).get('/api/v1/nope').set(auth(tokenA))).status).toBe(404);
      expect((await request(app).get('/not-an-api-route')).status).toBe(404);
      const bad = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{bad');
      expect(bad.status).toBe(400);
    });
    test('ML status degrades gracefully when the ML service is down', async () => {
      const r = await request(app).get('/api/v1/ml/status').set(auth(tokenA));
      expect(r.status).toBe(200);
      expect(r.body.ml_service.available).toBe(false);
      expect(r.body.risk_prediction.implemented).toBe(false);
    });
    test('deleting a course cascades to its attendance and grade', async () => {
      expect((await request(app).delete(`/api/v1/courses/${courseId}`).set(auth(tokenA))).status).toBe(204);
      const [rows] = await sequelize.query('SELECT count(*)::int AS n FROM attendance_records');
      expect(rows[0].n).toBe(0);
      expect((await request(app).get('/api/v1/grades').set(auth(tokenA))).body.grades).toHaveLength(1);
    });
  });
});
