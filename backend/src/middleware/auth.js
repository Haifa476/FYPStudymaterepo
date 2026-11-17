const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const ApiError = require('../utils/ApiError');

/** Verifies the Bearer JWT and binds every request to the authenticated student (NFR-03/04). */
module.exports = function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new ApiError(401, 'Authentication required'));
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.studentId = Number(payload.sub);
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};
