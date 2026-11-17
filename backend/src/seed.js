/**
 * Demo data for rehearsing the mid-evaluation demo. NOT real student data.
 * Creates the account demo@studymate.local using the password in SEED_DEMO_PASSWORD.
 * Usage:  SEED_DEMO_PASSWORD=... npm run seed
 */
const bcrypt = require('bcrypt');
const { sequelize, Student, Course, Assessment, AttendanceRecord, Grade } = require('./models');
const { bcryptRounds } = require('./config/env');
const { pointsForLetter } = require('./services/gpaService');

(async () => {
  const pw = process.env.SEED_DEMO_PASSWORD;
  if (!pw) { console.error('Set SEED_DEMO_PASSWORD in your environment/.env first.'); process.exit(1); }
  const email = 'demo@studymate.local';
  await sequelize.authenticate();
  await Student.destroy({ where: { email } }); // cascades – safe to re-run
  const st = await Student.create({
    name: 'Demo Student', email, password_hash: await bcrypt.hash(pw, bcryptRounds),
    program: 'BS Computer Science', current_semester: 3, target_cgpa: 3.3, daily_available_hours: 4,
  });
  const mk = (o) => Course.create({ student_id: st.student_id, ...o });
  const past = [
    await mk({ code: 'CSC101', title: 'Programming Fundamentals', credit_hours: 4, semester: 1, difficulty_rating: 3 }),
    await mk({ code: 'MTH101', title: 'Calculus I', credit_hours: 3, semester: 1, difficulty_rating: 4 }),
    await mk({ code: 'CSC102', title: 'Object Oriented Programming', credit_hours: 4, semester: 2, difficulty_rating: 3 }),
    await mk({ code: 'MTH102', title: 'Discrete Mathematics', credit_hours: 3, semester: 2, difficulty_rating: 4 }),
  ];
  const letters = ['A-', 'B', 'B+', 'C+'];
  for (let i = 0; i < past.length; i++) {
    await Grade.create({ course_id: past[i].course_id, letter_grade: letters[i], grade_points: pointsForLetter(letters[i]), semester: past[i].semester, credit_hours: past[i].credit_hours });
  }
  const cur = [
    await mk({ code: 'CSC201', title: 'Data Structures', instructor: 'Demo Instructor', credit_hours: 4, semester: 3, difficulty_rating: 4, max_allowed_absences: 8 }),
    await mk({ code: 'CSC203', title: 'Database Systems', credit_hours: 3, semester: 3, difficulty_rating: 3 }),
    await mk({ code: 'MTH201', title: 'Linear Algebra', credit_hours: 3, semester: 3, difficulty_rating: 4 }),
  ];
  const pattern = { 0: 'PPPPPAPPAPPPAPPA', 1: 'PPPPPPPPAPPPPPPP', 2: 'PPAPAAPPAPAAPPAA' }; // P=present, A=absent
  for (const [i, c] of cur.entries()) {
    for (const [d, ch] of [...pattern[i]].entries()) {
      const date = new Date(Date.UTC(2026, 8, 7 + d * 2)).toISOString().slice(0, 10);
      await AttendanceRecord.create({ course_id: c.course_id, date, status: ch === 'P' ? 'present' : 'absent' });
    }
  }
  const soon = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  await Assessment.bulkCreate([
    { course_id: cur[0].course_id, type: 'quiz', title: 'Quiz 3 – Linked Lists', due_date: soon(3), weight_percent: 5, max_marks: 20 },
    { course_id: cur[0].course_id, type: 'midterm', title: 'Midterm', due_date: soon(10), weight_percent: 25, max_marks: 50 },
    { course_id: cur[0].course_id, type: 'assignment', title: 'Assignment 2', due_date: soon(-5), weight_percent: 10, max_marks: 100, obtained_marks: 82, status: 'graded' },
    { course_id: cur[1].course_id, type: 'project', title: 'Schema Design Project', due_date: soon(14), weight_percent: 20, max_marks: 100 },
    { course_id: cur[2].course_id, type: 'quiz', title: 'Quiz 2 – Vector Spaces', due_date: soon(5), weight_percent: 5, max_marks: 15 },
  ]);
  console.log(`Seeded demo account ${email} (password = value of SEED_DEMO_PASSWORD)`);
  await sequelize.close();
})().catch((e) => { console.error(e); process.exit(1); });
