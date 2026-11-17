const { Course, Assessment } = require('../models');
const { Op } = require('sequelize');
const ser = require('../utils/serializers');
const gpa = require('../services/gpaService');
const { loadGradeRows } = require('./gradeController');
const { overviewData } = require('./attendanceController');

exports.summary = async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const include = [{ model: Course, attributes: ['code'], where: { student_id: req.studentId }, required: true }];
  const [courseCount, pendingCount, upcoming, gradeRows, attendance] = await Promise.all([
    Course.count({ where: { student_id: req.studentId } }),
    Assessment.count({ where: { status: { [Op.ne]: 'graded' } }, include }),
    Assessment.findAll({ where: { status: { [Op.ne]: 'graded' }, due_date: { [Op.gte]: today } }, include, order: [['due_date', 'ASC']], limit: 5 }),
    loadGradeRows(req.studentId),
    overviewData(req.studentId),
  ]);
  const { cgpa, semesters } = gpa.computeSummary(gradeRows);
  res.json({
    counts: { courses: courseCount, pending_assessments: pendingCount },
    cgpa: { value: cgpa.value, total_credit_hours: cgpa.total_credit_hours },
    semester_gpas: semesters.map((s) => ({ semester: s.semester, gpa: s.gpa.value })),
    attendance,
    upcoming_assessments: upcoming.map((a) => ({ ...ser.assessment(a), course_code: a.Course.code })),
  });
};
