const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Student } = require('../models');
const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config/env');
const ApiError = require('../utils/ApiError');
const ser = require('../utils/serializers');

const issueToken = (student) => jwt.sign({ sub: student.student_id }, jwtSecret, { expiresIn: jwtExpiresIn });

exports.register = async (req, res) => {
  const { password, ...rest } = req.body;
  if (await Student.findOne({ where: { email: rest.email } })) throw new ApiError(409, 'Email is already registered');
  const password_hash = await bcrypt.hash(password, bcryptRounds); // FR-01, NFR-03: never store plaintext
  const student = await Student.create({ ...rest, password_hash });
  res.status(201).json({ token: issueToken(student), student: ser.student(student) });
};

exports.login = async (req, res) => {
  const student = await Student.findOne({ where: { email: req.body.email } });
  const ok = student && (await bcrypt.compare(req.body.password, student.password_hash));
  if (!ok) throw new ApiError(401, 'Invalid email or password'); // same message for both cases
  res.json({ token: issueToken(student), student: ser.student(student) });
};

// JWTs are stateless: logout is completed client-side by discarding the token.
exports.logout = (_req, res) => res.json({ message: 'Logged out. Discard the token on the client.' });

exports.me = async (req, res) => {
  const student = await Student.findByPk(req.studentId);
  if (!student) throw new ApiError(401, 'Account no longer exists');
  res.json({ student: ser.student(student) });
};

exports.updateProfile = async (req, res) => {
  const student = await Student.findByPk(req.studentId);
  if (!student) throw new ApiError(401, 'Account no longer exists');
  await student.update(req.body);
  res.json({ student: ser.student(student) });
};
