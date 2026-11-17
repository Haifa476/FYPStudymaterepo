const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const D = DataTypes;
const noTs = { timestamps: false };
const createdOnly = { createdAt: 'created_at', updatedAt: false };
const both = { createdAt: 'created_at', updatedAt: 'updated_at' };

const Student = sequelize.define('Student', {
  student_id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: D.STRING(100), allowNull: false },
  email: { type: D.STRING(255), allowNull: false, unique: true },
  password_hash: { type: D.STRING(255), allowNull: false },
  program: D.STRING(100),
  current_semester: D.SMALLINT,
  target_cgpa: D.DECIMAL(3, 2),
  daily_available_hours: D.DECIMAL(4, 2),
}, { tableName: 'students', ...both });

const Course = sequelize.define('Course', {
  course_id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: D.INTEGER, allowNull: false },
  code: { type: D.STRING(20), allowNull: false },
  title: { type: D.STRING(150), allowNull: false },
  instructor: D.STRING(100),
  credit_hours: { type: D.SMALLINT, allowNull: false },
  semester: { type: D.SMALLINT, allowNull: false },
  attendance_policy_min_percent: { type: D.DECIMAL(5, 2), allowNull: false, defaultValue: 75 },
  max_allowed_absences: D.SMALLINT,
  difficulty_rating: D.SMALLINT,
}, { tableName: 'courses', ...both });

const Assessment = sequelize.define('Assessment', {
  assessment_id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  course_id: { type: D.INTEGER, allowNull: false },
  type: { type: D.STRING(20), allowNull: false },
  title: { type: D.STRING(150), allowNull: false },
  due_date: D.DATEONLY,
  weight_percent: { type: D.DECIMAL(5, 2), allowNull: false },
  max_marks: { type: D.DECIMAL(7, 2), allowNull: false },
  obtained_marks: D.DECIMAL(7, 2),
  status: { type: D.STRING(20), allowNull: false, defaultValue: 'pending' },
}, { tableName: 'assessments', ...both });

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  record_id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  course_id: { type: D.INTEGER, allowNull: false },
  date: { type: D.DATEONLY, allowNull: false },
  status: { type: D.STRING(10), allowNull: false },
}, { tableName: 'attendance_records', ...createdOnly });

const Grade = sequelize.define('Grade', {
  grade_id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  course_id: { type: D.INTEGER, allowNull: false, unique: true },
  letter_grade: { type: D.STRING(2), allowNull: false },
  grade_points: { type: D.DECIMAL(3, 2), allowNull: false },
  semester: { type: D.SMALLINT, allowNull: false },
  credit_hours: { type: D.SMALLINT, allowNull: false },
}, { tableName: 'grades', ...createdOnly });

// Tables below exist in the schema; no endpoints yet (planned phases).
const StudyLog = sequelize.define('StudyLog', {
  log_id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: D.INTEGER, course_id: D.INTEGER, date: D.DATEONLY, hours: D.DECIMAL(4, 2), focus_rating: D.SMALLINT,
}, { tableName: 'study_logs', ...createdOnly });
const Budget = sequelize.define('Budget', {
  budget_id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: D.INTEGER, month: D.CHAR(7), pocket_money_amount: D.DECIMAL(10, 2),
}, { tableName: 'budgets', ...createdOnly });
const Expense = sequelize.define('Expense', {
  expense_id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  budget_id: D.INTEGER, category: D.STRING(50), amount: D.DECIMAL(10, 2), date: D.DATEONLY, note: D.STRING(255),
}, { tableName: 'expenses', ...createdOnly });

Student.hasMany(Course, { foreignKey: 'student_id', onDelete: 'CASCADE' });
Course.belongsTo(Student, { foreignKey: 'student_id' });
Course.hasMany(Assessment, { foreignKey: 'course_id', onDelete: 'CASCADE' });
Assessment.belongsTo(Course, { foreignKey: 'course_id' });
Course.hasMany(AttendanceRecord, { foreignKey: 'course_id', onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(Course, { foreignKey: 'course_id' });
Course.hasOne(Grade, { foreignKey: 'course_id', onDelete: 'CASCADE' });
Grade.belongsTo(Course, { foreignKey: 'course_id' });
Student.hasMany(StudyLog, { foreignKey: 'student_id' });
Course.hasMany(StudyLog, { foreignKey: 'course_id' });
Student.hasMany(Budget, { foreignKey: 'student_id' });
Budget.hasMany(Expense, { foreignKey: 'budget_id' });

module.exports = { sequelize, Student, Course, Assessment, AttendanceRecord, Grade, StudyLog, Budget, Expense };
