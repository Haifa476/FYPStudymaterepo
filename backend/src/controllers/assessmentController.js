const { Assessment, Course } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const ser = require('../utils/serializers');
const { ownedCourse, ownedAssessment } = require('../utils/ownership');

/** Total weight of one course's assessments must not exceed 100%. */
async function assertWeightFits(courseId, weight, excludeId) {
  const where = { course_id: courseId };
  if (excludeId) where.assessment_id = { [Op.ne]: excludeId };
  const total = Number((await Assessment.sum('weight_percent', { where })) || 0);
  if (total + Number(weight) > 100 + 1e-9) {
    throw new ApiError(422, `Total assessment weight for this course would be ${total + Number(weight)}%, which exceeds 100%`);
  }
}

exports.list = async (req, res) => {
  const include = [{ model: Course, attributes: ['course_id'], where: { student_id: req.studentId }, required: true }];
  const where = req.query.course_id ? { course_id: Number(req.query.course_id) } : {};
  const rows = await Assessment.findAll({ where, include, order: [['due_date', 'ASC NULLS LAST'], ['assessment_id', 'ASC']] });
  res.json({ assessments: rows.map(ser.assessment) });
};

exports.create = async (req, res) => {
  await ownedCourse(req.body.course_id, req.studentId);
  await assertWeightFits(req.body.course_id, req.body.weight_percent);
  const body = { ...req.body };
  if (!body.status) body.status = body.obtained_marks != null ? 'graded' : 'pending';
  res.status(201).json({ assessment: ser.assessment(await Assessment.create(body)) });
};

exports.update = async (req, res) => {
  const row = await ownedAssessment(req.params.id, req.studentId);
  const max = req.body.max_marks ?? Number(row.max_marks);
  const obtained = req.body.obtained_marks !== undefined ? req.body.obtained_marks : row.obtained_marks;
  if (obtained != null && Number(obtained) > max) throw new ApiError(400, 'Validation failed', [{ field: 'obtained_marks', message: 'obtained_marks cannot exceed max_marks' }]);
  if (req.body.weight_percent !== undefined) await assertWeightFits(row.course_id, req.body.weight_percent, row.assessment_id);
  const body = { ...req.body };
  if (body.obtained_marks != null && !body.status) body.status = 'graded';
  await row.update(body);
  res.json({ assessment: ser.assessment(row) });
};

exports.remove = async (req, res) => {
  const row = await ownedAssessment(req.params.id, req.studentId);
  await row.destroy();
  res.status(204).end();
};
