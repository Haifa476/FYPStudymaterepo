/**
 * Grade-point scale used to convert a letter grade to grade points.
 *
 * !! TO VERIFY !!  The proposal refers to "the institutional grade-point scale"
 * without listing it. The values below are the common 4.0 scale used by
 * Pakistani universities and are an ASSUMPTION until confirmed against the
 * official Sukkur IBA University grading policy. Edit this single file to change
 * the scale; nothing else in the code base hard-codes grade points.
 */
const GRADE_SCALE = Object.freeze({
  A: 4.0,
  'A-': 3.67,
  'B+': 3.33,
  B: 3.0,
  'B-': 2.67,
  'C+': 2.33,
  C: 2.0,
  'C-': 1.67,
  'D+': 1.33,
  D: 1.0,
  F: 0.0,
});

const MAX_GRADE_POINTS = Math.max(...Object.values(GRADE_SCALE));

module.exports = { GRADE_SCALE, MAX_GRADE_POINTS };
