const { checkHealth } = require('../services/mlClient');

/** Reports ML-service availability. Risk prediction itself is NOT implemented in the 25% build. */
exports.status = async (_req, res) => {
  res.json({
    ml_service: await checkHealth(),
    risk_prediction: { implemented: false, note: 'Planned: model training and /predict integration are future work.' },
  });
};
