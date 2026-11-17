/** Round to `d` decimals (half away from zero, float-safe). */
const round = (n, d = 2) => {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  const f = 10 ** d;
  return Math.round((n + Number.EPSILON * Math.sign(n)) * f) / f;
};
/** Postgres returns NUMERIC as strings; convert safely. */
const toNum = (v) => (v === null || v === undefined ? null : Number(v));
module.exports = { round, toNum };
