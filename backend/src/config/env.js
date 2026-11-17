// Central environment configuration. Secrets come ONLY from environment variables.
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';
const databaseUrl = isTest
  ? process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  : process.env.DATABASE_URL;

const missing = [];
if (!databaseUrl) missing.push(isTest ? 'TEST_DATABASE_URL' : 'DATABASE_URL');
if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
if (missing.length) {
  throw new Error(`Missing required environment variable(s): ${missing.join(', ')}. See .env.example`);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest,
  port: Number(process.env.PORT) || 5000,
  databaseUrl,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  mlTimeoutMs: Number(process.env.ML_TIMEOUT_MS) || 1500,
};
