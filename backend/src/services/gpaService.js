/**
 * Academic Analytics Engine – GPA / CGPA module (pure functions, no I/O).
 * Implements FR-07 (GPA/CGPA), FR-08 (target CGPA requirement), FR-09 (what-if).
 * Every result carries its formula, inputs and steps (NFR-02 transparency).
 */
const { GRADE_SCALE, MAX_GRADE_POINTS } = require('../config/gradeScale');
const { round } = require('../utils/numbers');

/** Grade points for a letter grade, or null if the letter is not on the scale. */
function pointsForLetter(letter, scale = GRADE_SCALE) {
  const key = String(letter || '').trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(scale, key) ? scale[key] : null;
}

/** @param {{credit_hours:number, grade_points:number}[]} grades */
function totals(grades) {
  let credits = 0;
  let quality = 0;
  for (const g of grades) {
    credits += g.credit_hours;
    quality += g.credit_hours * g.grade_points;
  }
  return { credit_hours: credits, quality_points: quality };
}

/** GPA over the given grade rows: sum(credits x points) / sum(credits). */
function computeGpa(grades, label = 'GPA') {
  const { credit_hours, quality_points } = totals(grades);
  const steps = grades.map((g) => ({
    credit_hours: g.credit_hours,
    grade_points: g.grade_points,
    quality_points: round(g.credit_hours * g.grade_points, 4),
    ...(g.label ? { label: g.label } : {}),
  }));
  const value = credit_hours > 0 ? quality_points / credit_hours : null;
  return {
    value: round(value, 2),
    total_credit_hours: credit_hours,
    total_quality_points: round(quality_points, 4),
    formula: `${label} = Σ(credit hours × grade points) ÷ Σ(credit hours)`,
    working:
      credit_hours > 0
        ? `${label} = ${round(quality_points, 2)} ÷ ${credit_hours} = ${round(value, 2)}`
        : 'No graded credit hours yet.',
    steps,
  };
}

/** Semester GPAs (grouped by grade.semester) plus cumulative CGPA. */
function computeSummary(grades) {
  const bySemester = new Map();
  for (const g of grades) {
    if (!bySemester.has(g.semester)) bySemester.set(g.semester, []);
    bySemester.get(g.semester).push(g);
  }
  const semesters = [...bySemester.keys()]
    .sort((a, b) => a - b)
    .map((s) => ({ semester: s, gpa: computeGpa(bySemester.get(s), `GPA (semester ${s})`) }));
  return { cgpa: computeGpa(grades, 'CGPA'), semesters };
}

/**
 * FR-08 – average grade points required in the remaining credit hours to reach a target CGPA.
 *   required = (target × (C + R) − Q) ÷ R
 * where C = completed credits, Q = quality points so far, R = remaining credits.
 */
function targetRequirement({ completedCredits, qualityPoints, remainingCredits, targetCgpa, maxPoints = MAX_GRADE_POINTS }) {
  if (!(remainingCredits > 0)) throw new RangeError('remainingCredits must be greater than 0');
  if (!(targetCgpa >= 0 && targetCgpa <= maxPoints)) throw new RangeError(`targetCgpa must be between 0 and ${maxPoints}`);

  const totalCredits = completedCredits + remainingCredits;
  const requiredRaw = (targetCgpa * totalCredits - qualityPoints) / remainingCredits;
  const maxAchievable = (qualityPoints + maxPoints * remainingCredits) / totalCredits;
  const feasible = requiredRaw <= maxPoints + 1e-9;
  const alreadySecured = requiredRaw <= 1e-9;

  let message;
  if (!feasible) {
    message = `Not reachable: it needs an average of ${round(requiredRaw, 2)} grade points, above the scale maximum of ${maxPoints}. The highest CGPA you can reach is ${round(maxAchievable, 2)}.`;
  } else if (alreadySecured) {
    message = 'Target already secured: it is met even with 0.00 grade points in the remaining credit hours.';
  } else {
    message = `You need an average of ${round(requiredRaw, 2)} grade points across the remaining ${remainingCredits} credit hours.`;
  }

  return {
    feasible,
    already_secured: alreadySecured,
    required_average_grade_points: round(alreadySecured ? 0 : requiredRaw, 2),
    max_achievable_cgpa: round(maxAchievable, 2),
    message,
    formula: 'required = (target × (C + R) − Q) ÷ R',
    working: `required = (${targetCgpa} × (${completedCredits} + ${remainingCredits}) − ${round(qualityPoints, 2)}) ÷ ${remainingCredits} = ${round(requiredRaw, 2)}`,
    inputs: {
      target_cgpa: targetCgpa,
      completed_credit_hours: completedCredits,
      quality_points: round(qualityPoints, 4),
      remaining_credit_hours: remainingCredits,
      scale_maximum: maxPoints,
    },
  };
}

/**
 * FR-09 – resulting CGPA if hypothetical grades were earned.
 * @param grades  existing {credit_hours, grade_points}[]
 * @param scenarios [{credit_hours, grade_points, label?}]
 */
function whatIf(grades, scenarios) {
  const current = computeGpa(grades, 'CGPA');
  const hypothetical = scenarios.map((s, i) => ({ ...s, label: s.label || `Scenario course ${i + 1}` }));
  const projected = computeGpa([...grades, ...hypothetical], 'Projected CGPA');
  return {
    current_cgpa: current.value,
    projected_cgpa: projected.value,
    change: current.value === null || projected.value === null ? null : round(projected.value - current.value, 2),
    formula: projected.formula,
    working: projected.working,
    steps: projected.steps,
  };
}

module.exports = { pointsForLetter, computeGpa, computeSummary, targetRequirement, whatIf, totals };
