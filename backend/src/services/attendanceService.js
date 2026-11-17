/**
 * Academic Analytics Engine – attendance module (pure functions, no I/O).
 * Implements FR-04 (percentage), FR-05 (what-if absences), FR-06 (threshold warning).
 */
const { round } = require('../utils/numbers');

// Percentage points above the policy minimum at which a warning is raised (design parameter).
const WARNING_MARGIN = 5;

const pct = (attended, conducted) => (conducted > 0 ? (attended / conducted) * 100 : null);

function classify(percentage, minPercent, margin = WARNING_MARGIN) {
  if (percentage === null) return 'no_data';
  if (percentage < minPercent - 1e-9) return 'below_threshold';
  if (percentage < minPercent + margin - 1e-9) return 'at_risk';
  return 'safe';
}

/** Largest k >= 0 such that attended / (conducted + k) still meets minPercent. null = unlimited. */
function maxAdditionalAbsences(attended, conducted, minPercent) {
  if (minPercent <= 0) return null;
  const k = Math.floor((attended * 100) / minPercent - conducted + 1e-9);
  return Math.max(0, k);
}

const STATUS_TEXT = {
  no_data: 'No classes recorded yet.',
  safe: 'Attendance is comfortably above the policy minimum.',
  at_risk: 'Warning: attendance is close to the policy minimum.',
  below_threshold: 'Alert: attendance is below the policy minimum.',
};

/**
 * @param {{attended:number, conducted:number, minPercent:number, maxAbsences?:number|null}} p
 */
function summarise({ attended, conducted, minPercent, maxAbsences = null }) {
  const percentage = pct(attended, conducted);
  const absent = conducted - attended;
  const status = classify(percentage, minPercent);
  const limitReached = maxAbsences !== null && maxAbsences !== undefined && absent >= maxAbsences;
  return {
    classes_conducted: conducted,
    classes_attended: attended,
    classes_missed: absent,
    attendance_percent: round(percentage, 2),
    policy_min_percent: minPercent,
    status,
    message: STATUS_TEXT[status],
    max_additional_absences: conducted > 0 ? maxAdditionalAbsences(attended, conducted, minPercent) : null,
    absence_limit: maxAbsences ?? null,
    absence_limit_reached: Boolean(limitReached),
    formula: 'attendance % = classes attended ÷ classes conducted × 100',
    working:
      conducted > 0
        ? `attendance % = ${attended} ÷ ${conducted} × 100 = ${round(percentage, 2)}%`
        : 'attendance % is undefined until at least one class is recorded',
  };
}

/** FR-05 – effect of n additional absences (each adds one conducted class, none attended). */
function whatIfAbsences({ attended, conducted, minPercent, additionalAbsences }) {
  if (conducted === 0) {
    // Nothing recorded yet: a percentage would be meaningless (0 ÷ n would misleadingly read as 0%).
    return {
      additional_absences: additionalAbsences, before_percent: null, after_percent: null,
      status_after: 'no_data', crosses_threshold: false,
      message: 'No classes recorded yet, so there is nothing to simulate.',
      formula: 'attendance % after = classes attended ÷ (classes conducted + additional absences) × 100',
      working: 'undefined until at least one class is recorded',
    };
  }
  const before = pct(attended, conducted);
  const newConducted = conducted + additionalAbsences;
  const after = pct(attended, newConducted);
  const statusAfter = classify(after, minPercent);
  return {
    additional_absences: additionalAbsences,
    before_percent: round(before, 2),
    after_percent: round(after, 2),
    status_after: statusAfter,
    crosses_threshold: before !== null && before >= minPercent && after !== null && after < minPercent,
    message:
      after === null
        ? 'No classes recorded yet, so there is nothing to simulate.'
        : `${STATUS_TEXT[statusAfter]} (${round(after, 2)}% vs. minimum ${minPercent}%)`,
    formula: 'attendance % after = classes attended ÷ (classes conducted + additional absences) × 100',
    working:
      after === null
        ? 'undefined'
        : `attendance % after = ${attended} ÷ (${conducted} + ${additionalAbsences}) × 100 = ${round(after, 2)}%`,
  };
}

module.exports = { summarise, whatIfAbsences, classify, maxAdditionalAbsences, WARNING_MARGIN };
