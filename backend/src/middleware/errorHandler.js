const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: { message: 'A record with these unique values already exists' } });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError' || err.name === 'SequelizeDatabaseError') {
    // Constraint/CHECK violations that slipped past validation: report as a client error without leaking SQL.
    const code = err.parent && err.parent.code;
    if (code && (code.startsWith('23') || code === '22P02')) {
      return res.status(422).json({ error: { message: 'The data violates a database constraint' } });
    }
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Malformed JSON body' } });
  }
  console.error(err); // server-side log only; no stack trace is returned to the client
  return res.status(500).json({ error: { message: 'Internal server error' } });
};

module.exports = { notFound, errorHandler };
