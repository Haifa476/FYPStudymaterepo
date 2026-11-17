process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-not-for-production';
process.env.BCRYPT_ROUNDS = '4'; // fast hashing in tests only
// Unit tests do not need a database; integration tests need TEST_DATABASE_URL.
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://unused:unused@localhost:5432/unused';
// Force "ML service unreachable" so the graceful-degradation test is deterministic,
// even if a real ML service happens to be running locally.
process.env.ML_SERVICE_URL = 'http://127.0.0.1:9';
process.env.ML_TIMEOUT_MS = '500';
