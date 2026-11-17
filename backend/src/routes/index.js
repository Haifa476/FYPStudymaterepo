const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const wrap = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../utils/schemas');
const { isTest } = require('../config/env');

const auth = require('../controllers/authController');
const courses = require('../controllers/courseController');
const assessments = require('../controllers/assessmentController');
const attendance = require('../controllers/attendanceController');
const grades = require('../controllers/gradeController');
const dashboard = require('../controllers/dashboardController');
const ml = require('../controllers/mlController');

// Brute-force protection on credential endpoints (proposal §7.1).
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, skip: () => isTest,
  message: { error: { message: 'Too many attempts, please try again later' } } });

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'studymate-api' }));

// --- Authentication (FR-01) and personal profile (proposal scope item 4.1-1)
router.post('/auth/register', authLimiter, validate(s.register), wrap(auth.register));
router.post('/auth/login', authLimiter, validate(s.login), wrap(auth.login));
router.post('/auth/logout', authenticate, auth.logout);
router.get('/auth/me', authenticate, wrap(auth.me));
router.put('/students/me', authenticate, validate(s.profile), wrap(auth.updateProfile));

// Everything below requires a valid JWT.
router.use(authenticate);

// --- Courses (FR-02)
router.get('/courses', wrap(courses.list));
router.post('/courses', validate(s.course), wrap(courses.create));
router.get('/courses/:id', validate(s.idParam, 'params'), wrap(courses.get));
router.put('/courses/:id', validate(s.idParam, 'params'), validate(s.coursePatch), wrap(courses.update));
router.delete('/courses/:id', validate(s.idParam, 'params'), wrap(courses.remove));

// --- Assessments (FR-03)
router.get('/assessments', wrap(assessments.list));
router.post('/assessments', validate(s.assessment), wrap(assessments.create));
router.put('/assessments/:id', validate(s.idParam, 'params'), validate(s.assessmentPatch), wrap(assessments.update));
router.delete('/assessments/:id', validate(s.idParam, 'params'), wrap(assessments.remove));

// --- Attendance (FR-04, FR-05, FR-06)
router.get('/attendance/overview', wrap(attendance.overview));
router.get('/courses/:courseId/attendance', validate(s.courseIdParam, 'params'), wrap(attendance.list));
router.post('/courses/:courseId/attendance', validate(s.courseIdParam, 'params'), validate(s.attendance), wrap(attendance.create));
router.get('/courses/:courseId/attendance/summary', validate(s.courseIdParam, 'params'), wrap(attendance.summary));
router.post('/courses/:courseId/attendance/what-if', validate(s.courseIdParam, 'params'), validate(s.attendanceWhatIf), wrap(attendance.whatIf));
router.delete('/attendance/:id', validate(s.idParam, 'params'), wrap(attendance.remove));

// --- Grades, GPA/CGPA (FR-07, FR-08, FR-09)
router.get('/grades', wrap(grades.list));
router.post('/grades', validate(s.gradeCreate), wrap(grades.create));
router.put('/grades/:id', validate(s.idParam, 'params'), validate(s.gradePatch), wrap(grades.update));
router.delete('/grades/:id', validate(s.idParam, 'params'), wrap(grades.remove));
router.get('/gpa/scale', grades.scale);
router.get('/gpa/summary', wrap(grades.summary));
router.post('/gpa/target', validate(s.target), wrap(grades.target));
router.post('/gpa/what-if', validate(s.whatIf), wrap(grades.whatIf));

// --- Dashboard (FR-18, partial: attendance + GPA trend only; risk/workload/spending charts are planned)
router.get('/dashboard/summary', wrap(dashboard.summary));

// --- ML service status (graceful-degradation check; prediction not implemented)
router.get('/ml/status', wrap(ml.status));

module.exports = router;
