const app = require('./app');
const { sequelize } = require('./models');
const { port } = require('./config/env');

(async () => {
  try {
    await sequelize.authenticate(); // fail fast if PostgreSQL is unreachable
    console.log('PostgreSQL connection established');
    app.listen(port, () => console.log(`StudyMate API listening on http://localhost:${port}/api/v1`));
  } catch (err) {
    console.error('Unable to start: database connection failed –', err.message);
    process.exit(1);
  }
})();
