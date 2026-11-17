const gpa = require('../../src/services/gpaService');

describe('gpaService', () => {
  test('pointsForLetter maps known letters (case-insensitive) and rejects unknown', () => {
    expect(gpa.pointsForLetter('A')).toBe(4.0);
    expect(gpa.pointsForLetter('b+')).toBe(3.33);
    expect(gpa.pointsForLetter('F')).toBe(0);
    expect(gpa.pointsForLetter('Z')).toBeNull();
  });

  test('computeGpa is credit-weighted and exposes formula/working', () => {
    const r = gpa.computeGpa([
      { credit_hours: 3, grade_points: 4.0 },
      { credit_hours: 4, grade_points: 3.0 },
    ]);
    expect(r.total_credit_hours).toBe(7);
    expect(r.total_quality_points).toBe(24);
    expect(r.value).toBe(3.43); // 24 / 7
    expect(r.formula).toMatch(/Σ\(credit hours × grade points\)/);
    expect(r.steps).toHaveLength(2);
  });

  test('computeGpa with no grades returns null value, not NaN', () => {
    expect(gpa.computeGpa([]).value).toBeNull();
  });

  test('computeSummary groups by semester and computes cumulative CGPA', () => {
    const { cgpa, semesters } = gpa.computeSummary([
      { semester: 2, credit_hours: 3, grade_points: 2.0 },
      { semester: 1, credit_hours: 3, grade_points: 4.0 },
    ]);
    expect(semesters.map((s) => s.semester)).toEqual([1, 2]);
    expect(semesters[0].gpa.value).toBe(4);
    expect(semesters[1].gpa.value).toBe(2);
    expect(cgpa.value).toBe(3);
  });

  describe('targetRequirement', () => {
    const base = { completedCredits: 30, qualityPoints: 90, remainingCredits: 30 }; // CGPA 3.0 so far
    test('computes required average', () => {
      const r = gpa.targetRequirement({ ...base, targetCgpa: 3.5 });
      expect(r.feasible).toBe(true);
      expect(r.required_average_grade_points).toBe(4); // (3.5*60-90)/30 = 4.0
    });
    test('flags unreachable targets and reports the best achievable CGPA', () => {
      const r = gpa.targetRequirement({ ...base, targetCgpa: 3.8 });
      expect(r.feasible).toBe(false);
      expect(r.max_achievable_cgpa).toBe(3.5);
    });
    test('detects already-secured targets', () => {
      const r = gpa.targetRequirement({ ...base, targetCgpa: 1.0 });
      expect(r.already_secured).toBe(true);
      expect(r.required_average_grade_points).toBe(0);
    });
    test('rejects invalid input', () => {
      expect(() => gpa.targetRequirement({ ...base, remainingCredits: 0, targetCgpa: 3 })).toThrow(RangeError);
      expect(() => gpa.targetRequirement({ ...base, targetCgpa: 4.5 })).toThrow(RangeError);
    });
  });

  test('whatIf projects CGPA with hypothetical grades', () => {
    const r = gpa.whatIf([{ credit_hours: 3, grade_points: 3.0 }], [{ credit_hours: 3, grade_points: 4.0 }]);
    expect(r.current_cgpa).toBe(3);
    expect(r.projected_cgpa).toBe(3.5);
    expect(r.change).toBe(0.5);
  });
});
