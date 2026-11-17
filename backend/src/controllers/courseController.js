const { Course } = require('../models');
const ser = require('../utils/serializers');
const { ownedCourse } = require('../utils/ownership');

exports.list = async (req, res) => {
  const where = { student_id: req.studentId };
  if (req.query.semester) where.semester = Number(req.query.semester);
  const rows = await Course.findAll({ where, order: [['semester', 'ASC'], ['code', 'ASC']] });
  res.json({ courses: rows.map(ser.course) });
};
exports.create = async (req, res) => {
  const row = await Course.create({ ...req.body, student_id: req.studentId });
  res.status(201).json({ course: ser.course(row) });
};
exports.get = async (req, res) => res.json({ course: ser.course(await ownedCourse(req.params.id, req.studentId)) });
exports.update = async (req, res) => {
  const row = await ownedCourse(req.params.id, req.studentId);
  await row.update(req.body);
  res.json({ course: ser.course(row) });
};
exports.remove = async (req, res) => {
  const row = await ownedCourse(req.params.id, req.studentId);
  await row.destroy(); // cascades to assessments, attendance, grade
  res.status(204).end();
};
