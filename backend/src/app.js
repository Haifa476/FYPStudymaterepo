const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { corsOrigin, isTest } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors({ origin: corsOrigin.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '100kb' }));
if (!isTest) app.use(morgan('dev'));

app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
