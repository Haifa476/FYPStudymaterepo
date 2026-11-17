const att = require('../../src/services/attendanceService');

describe('attendanceService', () => {
  test('summarise computes percentage with working', () => {
    const r = att.summarise({ attended: 18, conducted: 20, minPercent: 75 });
    expect(r.attendance_percent).toBe(90);
    expect(r.classes_missed).toBe(2);
    expect(r.status).toBe('safe');
    expect(r.working).toContain('18 ÷ 20 × 100 = 90%');
  });

  test('status boundaries: below / at-risk / safe', () => {
    expect(att.classify(74.9, 75)).toBe('below_threshold');
    expect(att.classify(75, 75)).toBe('at_risk');
    expect(att.classify(79.9, 75)).toBe('at_risk');
    expect(att.classify(80, 75)).toBe('safe');
    expect(att.classify(null, 75)).toBe('no_data');
  });

  test('no classes recorded gives null percentage (no divide-by-zero)', () => {
    const r = att.summarise({ attended: 0, conducted: 0, minPercent: 75 });
    expect(r.attendance_percent).toBeNull();
    expect(r.status).toBe('no_data');
  });

  test('maxAdditionalAbsences keeps attendance at or above the minimum', () => {
    // 18/20 = 90%. k=3 -> 18/23 = 78.3% (>=75); k=4 -> 18/24 = 75% (>=75); k=5 -> 18/25 = 72%
    expect(att.maxAdditionalAbsences(18, 20, 75)).toBe(4);
    expect(att.maxAdditionalAbsences(10, 20, 75)).toBe(0); // already below
    expect(att.maxAdditionalAbsences(10, 10, 0)).toBeNull();
  });

  test('absence limit flag', () => {
    expect(att.summarise({ attended: 8, conducted: 16, minPercent: 50, maxAbsences: 8 }).absence_limit_reached).toBe(true);
    expect(att.summarise({ attended: 12, conducted: 16, minPercent: 50, maxAbsences: 8 }).absence_limit_reached).toBe(false);
  });

  test('whatIfAbsences simulates future absences and detects threshold crossing', () => {
    const r = att.whatIfAbsences({ attended: 18, conducted: 20, minPercent: 75, additionalAbsences: 5 });
    expect(r.after_percent).toBe(72);
    expect(r.crosses_threshold).toBe(true);
    expect(r.status_after).toBe('below_threshold');
    const safe = att.whatIfAbsences({ attended: 18, conducted: 20, minPercent: 75, additionalAbsences: 1 });
    expect(safe.crosses_threshold).toBe(false);
  });

  test('whatIfAbsences with no recorded classes reports no_data instead of a misleading 0%', () => {
    const r = att.whatIfAbsences({ attended: 0, conducted: 0, minPercent: 75, additionalAbsences: 2 });
    expect(r.after_percent).toBeNull();
    expect(r.status_after).toBe('no_data');
    expect(r.crosses_threshold).toBe(false);
  });
});
