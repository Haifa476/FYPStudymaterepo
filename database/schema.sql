-- StudyMate – PostgreSQL schema (25% implementation: foundational entities)
-- Implemented tables: students, courses, assessments, attendance_records,
--                     grades, study_logs, budgets, expenses
-- Planned tables (study_plans, plan_tasks, risk_predictions, chat_messages)
-- are defined in schema_planned.sql and are NOT created by this script.

BEGIN;

CREATE TABLE IF NOT EXISTS students (
  student_id            SERIAL PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NOT NULL,
  program               VARCHAR(100),
  current_semester      SMALLINT CHECK (current_semester BETWEEN 1 AND 12),
  target_cgpa           NUMERIC(3,2) CHECK (target_cgpa BETWEEN 0 AND 4),
  daily_available_hours NUMERIC(4,2) CHECK (daily_available_hours BETWEEN 0 AND 24),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  course_id                     SERIAL PRIMARY KEY,
  student_id                    INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  code                          VARCHAR(20)  NOT NULL,
  title                         VARCHAR(150) NOT NULL,
  instructor                    VARCHAR(100),               -- label only (proposal 4.1 item 2)
  credit_hours                  SMALLINT NOT NULL CHECK (credit_hours BETWEEN 1 AND 6),
  semester                      SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 12),
  attendance_policy_min_percent NUMERIC(5,2) NOT NULL DEFAULT 75 CHECK (attendance_policy_min_percent BETWEEN 0 AND 100),
  max_allowed_absences          SMALLINT CHECK (max_allowed_absences >= 0),
  difficulty_rating             SMALLINT CHECK (difficulty_rating BETWEEN 1 AND 5),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, code, semester)
);
CREATE INDEX IF NOT EXISTS idx_courses_student ON courses(student_id);

CREATE TABLE IF NOT EXISTS assessments (
  assessment_id  SERIAL PRIMARY KEY,
  course_id      INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  type           VARCHAR(20) NOT NULL CHECK (type IN ('assignment','quiz','midterm','final','project')),
  title          VARCHAR(150) NOT NULL,
  due_date       DATE,
  weight_percent NUMERIC(5,2) NOT NULL CHECK (weight_percent BETWEEN 0 AND 100),
  max_marks      NUMERIC(7,2) NOT NULL CHECK (max_marks > 0),
  obtained_marks NUMERIC(7,2) CHECK (obtained_marks >= 0),
  status         VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','graded')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (obtained_marks IS NULL OR obtained_marks <= max_marks)
);
CREATE INDEX IF NOT EXISTS idx_assessments_course_due ON assessments(course_id, due_date);

CREATE TABLE IF NOT EXISTS attendance_records (
  record_id  SERIAL PRIMARY KEY,
  course_id  INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  status     VARCHAR(10) NOT NULL CHECK (status IN ('present','absent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON attendance_records(course_id, date);

-- One final grade per course. semester/credit_hours are copied from the course
-- when the grade is recorded (as in the proposal ERD).
CREATE TABLE IF NOT EXISTS grades (
  grade_id     SERIAL PRIMARY KEY,
  course_id    INTEGER NOT NULL UNIQUE REFERENCES courses(course_id) ON DELETE CASCADE,
  letter_grade VARCHAR(2) NOT NULL,
  grade_points NUMERIC(3,2) NOT NULL CHECK (grade_points BETWEEN 0 AND 4),
  semester     SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 12),
  credit_hours SMALLINT NOT NULL CHECK (credit_hours BETWEEN 1 AND 6),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table created now; endpoints/UI are planned (Study Planner phase).
CREATE TABLE IF NOT EXISTS study_logs (
  log_id       SERIAL PRIMARY KEY,
  student_id   INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  course_id    INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  hours        NUMERIC(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  focus_rating SMALLINT CHECK (focus_rating BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tables created now; endpoints/UI are planned (Budget phase).
CREATE TABLE IF NOT EXISTS budgets (
  budget_id           SERIAL PRIMARY KEY,
  student_id          INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  month               CHAR(7) NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  pocket_money_amount NUMERIC(10,2) NOT NULL CHECK (pocket_money_amount >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, month)
);

CREATE TABLE IF NOT EXISTS expenses (
  expense_id SERIAL PRIMARY KEY,
  budget_id  INTEGER NOT NULL REFERENCES budgets(budget_id) ON DELETE CASCADE,
  category   VARCHAR(50) NOT NULL,
  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  date       DATE NOT NULL,
  note       VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
