const { Sequelize } = require('sequelize');
const { databaseUrl } = require('./env');

// Parameterised queries via Sequelize guard against SQL injection (NFR-03).
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  define: { underscored: true, freezeTableName: true },
});

module.exports = sequelize;
