const { z } = require('zod');
const { GRADE_SCALE } = require('../config/gradeScale');

const id = z.coerce.number().int().positive();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date');
const letter = z.string().trim().toUpperCase().refine((l) => l in GRADE_SCALE, { message: `Letter grade must be one of: ${Object.keys(GRADE_SCALE).join(', ')}` });

const password = z.string().min(8, 'At least 8 characters').max(72)
  .regex(/[A-Za-z]/, 'Must contain a letter').regex(/[0-9]/, 'Must contain a digit');

const register = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  password,
  program: z.string().trim().max(100).optional(),
  current_semester: z.number().int().min(1).max(12).optional(),
});
const login = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
const profile = z.object({
  name: z.string().trim().min(2).max(100),
  program: z.string().trim().max(100).nullable(),
  current_semester: z.number().int().min(1).max(12).nullable(),
  target_cgpa: z.number().min(0).max(4).nullable(),
  daily_available_hours: z.number().min(0).max(24).nullable(),
}).partial();

const course = z.object({
  code: z.string().trim().min(1).max(20),
  title: z.string().trim().min(1).max(150),
  instructor: z.string().trim().max(100).nullable().optional(),
  credit_hours: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(12),
  attendance_policy_min_percent: z.number().min(0).max(100).default(75),
  max_allowed_absences: z.number().int().min(0).nullable().optional(),
  difficulty_rating: z.number().int().min(1).max(5).nullable().optional(),
});
const coursePatch = course.partial().extend({ attendance_policy_min_percent: z.number().min(0).max(100).optional() });

const assessmentBase = z.object({
  type: z.enum(['assignment', 'quiz', 'midterm', 'final', 'project']),
  title: z.string().trim().min(1).max(150),
  due_date: isoDate.nullable().optional(),
  weight_percent: z.number().min(0).max(100),
  max_marks: z.number().positive().max(100000),
  obtained_marks: z.number().min(0).nullable().optional(),
  status: z.enum(['pending', 'submitted', 'graded']).optional(),
});
const marksCheck = (a) => a.obtained_marks == null || a.max_marks == null || a.obtained_marks <= a.max_marks;
const marksMsg = { message: 'obtained_marks cannot exceed max_marks', path: ['obtained_marks'] };
const assessment = assessmentBase.extend({ course_id: id }).refine(marksCheck, marksMsg);
const assessmentPatch = assessmentBase.partial().refine(marksCheck, marksMsg);

const attendance = z.object({ date: isoDate, status: z.enum(['present', 'absent']) });
const attendanceWhatIf = z.object({ additional_absences: z.number().int().min(0).max(200) });

const gradeCreate = z.object({ course_id: id, letter_grade: letter });
const gradePatch = z.object({ letter_grade: letter });
const target = z.object({
  target_cgpa: z.number().min(0).max(4).optional(),
  remaining_credit_hours: z.number().int().positive().max(200),
});
const whatIf = z.object({
  scenarios: z.array(z.object({
    credit_hours: z.number().int().min(1).max(6),
    letter_grade: letter,
    label: z.string().max(60).optional(),
  })).min(1).max(15),
});
const idParam = z.object({ id });
const courseIdParam = z.object({ courseId: id });

module.exports = {
  register, login, profile, course, coursePatch, assessment, assessmentPatch, attendance,
  attendanceWhatIf, gradeCreate, gradePatch, target, whatIf, idParam, courseIdParam, id,
};
