const { Grade, Course } = require('../models');
const ApiError = require('../utils/ApiError');
const ser = require('../utils/serializers');
const { toNum } = require('../utils/numbers');
const { ownedCourse, ownedGrade } = require('../utils/ownership');
const { GRADE_SCALE } = require('../config/gradeScale');
const gpa = require('../services/gpaService');

const include = (studentId) => [{ model: Course, where: { student_id: studentId }, required: true, attributes: ['code', 'title'] }];

exports.list = async (req, res) => {
  const rows = await Grade.findAll({ include: include(req.studentId), order: [['semester', 'ASC'], ['grade_id', 'ASC']] });
  res.json({ grades: rows.map(ser.grade) });
};

exports.create = async (req, res) => {
  const course = await ownedCourse(req.body.course_id, req.studentId);
  if (await Grade.findOne({ where: { course_id: course.course_id } })) throw new ApiError(409, 'A grade is already recorded for this course; edit it instead');
  const row = await Grade.create({
    course_id: course.course_id,
    letter_grade: req.body.letter_grade,
    grade_points: gpa.pointsForLetter(req.body.letter_grade),
    semester: course.semester,
    credit_hours: course.credit_hours,
  });
  res.status(201).json({ grade: ser.grade(row) });
};

exports.update = async (req, res) => {
  const row = await ownedGrade(req.params.id, req.studentId);
  await row.update({ letter_grade: req.body.letter_grade, grade_points: gpa.pointsForLetter(req.body.letter_grade) });
  res.json({ grade: ser.grade(row) });
};

exports.remove = async (req, res) => {
  const row = await ownedGrade(req.params.id, req.studentId);
  await row.destroy();
  res.status(204).end();
};

async function loadGradeRows(studentId) {
  const rows = await Grade.findAll({ include: include(studentId), order: [['semester', 'ASC']] });
  return rows.map((g) => ({ credit_hours: g.credit_hours, grade_points: toNum(g.grade_points), semester: g.semester, label: g.Course.code }));
}
exports.loadGradeRows = loadGradeRows;

exports.summary = async (req, res) => res.json(gpa.computeSummary(await loadGradeRows(req.studentId)));
exports.scale = (_req, res) => res.json({ scale: GRADE_SCALE, note: 'Assumed 4.0 scale – verify against the official university policy.' });

exports.target = async (req, res) => {
  const { Student } = require('../models');
  const student = await Student.findByPk(req.studentId);
  const targetCgpa = req.body.target_cgpa ?? toNum(student.target_cgpa);
  if (targetCgpa === null || targetCgpa === undefined) throw new ApiError(422, 'Provide target_cgpa or set a target CGPA in your profile');
  const { total_credit_hours, total_quality_points } = gpa.computeGpa(await loadGradeRows(req.studentId));
  res.json({
    result: gpa.targetRequirement({
      completedCredits: total_credit_hours, qualityPoints: total_quality_points,
      remainingCredits: req.body.remaining_credit_hours, targetCgpa,
    }),
  });
};

exports.whatIf = async (req, res) => {
  const scenarios = req.body.scenarios.map((s) => ({ credit_hours: s.credit_hours, grade_points: gpa.pointsForLetter(s.letter_grade), label: s.label || `${s.letter_grade} (${s.credit_hours} cr)` }));
  res.json({ result: gpa.whatIf(await loadGradeRows(req.studentId), scenarios) });
};
