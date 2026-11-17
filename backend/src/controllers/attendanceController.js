const { AttendanceRecord, Course, sequelize } = require('../models');
const { Op } = require('sequelize');
const ser = require('../utils/serializers');
const { toNum } = require('../utils/numbers');
const { ownedCourse, ownedAttendance } = require('../utils/ownership');
const attendanceService = require('../services/attendanceService');

async function counts(courseId) {
  const [attended, absent] = await Promise.all([
    AttendanceRecord.count({ where: { course_id: courseId, status: 'present' } }),
    AttendanceRecord.count({ where: { course_id: courseId, status: 'absent' } }),
  ]);
  return { attended, conducted: attended + absent };
}
const summaryFor = async (course) => {
  const { attended, conducted } = await counts(course.course_id);
  return attendanceService.summarise({
    attended, conducted,
    minPercent: toNum(course.attendance_policy_min_percent),
    maxAbsences: course.max_allowed_absences,
  });
};

exports.list = async (req, res) => {
  const course = await ownedCourse(req.params.courseId, req.studentId);
  const rows = await AttendanceRecord.findAll({ where: { course_id: course.course_id }, order: [['date', 'DESC'], ['record_id', 'DESC']] });
  res.json({ records: rows.map(ser.attendance), summary: await summaryFor(course) });
};

exports.create = async (req, res) => {
  const course = await ownedCourse(req.params.courseId, req.studentId);
  const row = await AttendanceRecord.create({ course_id: course.course_id, ...req.body });
  res.status(201).json({ record: ser.attendance(row), summary: await summaryFor(course) });
};

exports.remove = async (req, res) => {
  const row = await ownedAttendance(req.params.id, req.studentId);
  await row.destroy();
  res.status(204).end();
};

exports.summary = async (req, res) => {
  const course = await ownedCourse(req.params.courseId, req.studentId);
  res.json({ course_id: course.course_id, summary: await summaryFor(course) });
};

exports.whatIf = async (req, res) => {
  const course = await ownedCourse(req.params.courseId, req.studentId);
  const { attended, conducted } = await counts(course.course_id);
  res.json({
    course_id: course.course_id,
    result: attendanceService.whatIfAbsences({
      attended, conducted,
      minPercent: toNum(course.attendance_policy_min_percent),
      additionalAbsences: req.body.additional_absences,
    }),
  });
};

/** Summary for every course of the student (dashboard / attendance overview). */
exports.overview = async (req, res) => {
  res.json({ courses: await overviewData(req.studentId) });
};

async function overviewData(studentId) {
  const courses = await Course.findAll({ where: { student_id: studentId }, order: [['semester', 'ASC'], ['code', 'ASC']] });
  if (!courses.length) return [];
  const rows = await AttendanceRecord.findAll({
    attributes: ['course_id', 'status', [sequelize.fn('COUNT', sequelize.col('record_id')), 'n']],
    where: { course_id: { [Op.in]: courses.map((c) => c.course_id) } },
    group: ['course_id', 'status'], raw: true,
  });
  const tally = {};
  rows.forEach((r) => { tally[r.course_id] = tally[r.course_id] || { present: 0, absent: 0 }; tally[r.course_id][r.status] = Number(r.n); });
  return courses.map((c) => {
    const t = tally[c.course_id] || { present: 0, absent: 0 };
    return {
      course_id: c.course_id, code: c.code, title: c.title,
      summary: attendanceService.summarise({
        attended: t.present, conducted: t.present + t.absent,
        minPercent: toNum(c.attendance_policy_min_percent), maxAbsences: c.max_allowed_absences,
      }),
    };
  });
}
exports.overviewData = overviewData;
