const { toNum } = require('./numbers');

const student = (s) => ({
  student_id: s.student_id, name: s.name, email: s.email, program: s.program,
  current_semester: s.current_semester, target_cgpa: toNum(s.target_cgpa),
  daily_available_hours: toNum(s.daily_available_hours),
});
const course = (c) => ({
  course_id: c.course_id, code: c.code, title: c.title, instructor: c.instructor,
  credit_hours: c.credit_hours, semester: c.semester,
  attendance_policy_min_percent: toNum(c.attendance_policy_min_percent),
  max_allowed_absences: c.max_allowed_absences, difficulty_rating: c.difficulty_rating,
});
const assessment = (a) => ({
  assessment_id: a.assessment_id, course_id: a.course_id, type: a.type, title: a.title,
  due_date: a.due_date, weight_percent: toNum(a.weight_percent), max_marks: toNum(a.max_marks),
  obtained_marks: toNum(a.obtained_marks), status: a.status,
});
const grade = (g) => ({
  grade_id: g.grade_id, course_id: g.course_id, letter_grade: g.letter_grade,
  grade_points: toNum(g.grade_points), semester: g.semester, credit_hours: g.credit_hours,
  ...(g.Course ? { course_code: g.Course.code, course_title: g.Course.title } : {}),
});
const attendance = (r) => ({ record_id: r.record_id, course_id: r.course_id, date: r.date, status: r.status });

module.exports = { student, course, assessment, grade, attendance };
