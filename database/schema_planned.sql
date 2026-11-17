-- StudyMate – PLANNED tables (from the proposal ERD). Not part of the 25% build.
-- Apply only after schema.sql, when the corresponding phases begin.
BEGIN;

CREATE TABLE IF NOT EXISTS study_plans (
  plan_id      SERIAL PRIMARY KEY,
  student_id   INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  generated_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  horizon_days SMALLINT NOT NULL CHECK (horizon_days > 0)
);

CREATE TABLE IF NOT EXISTS plan_tasks (
  task_id         SERIAL PRIMARY KEY,
  plan_id         INTEGER NOT NULL REFERENCES study_plans(plan_id) ON DELETE CASCADE,
  assessment_id   INTEGER REFERENCES assessments(assessment_id) ON DELETE SET NULL,
  plan_date       DATE NOT NULL,
  allocated_hours NUMERIC(4,2) NOT NULL CHECK (allocated_hours >= 0),
  priority_score  NUMERIC(6,3)
);

CREATE TABLE IF NOT EXISTS risk_predictions (
  prediction_id SERIAL PRIMARY KEY,
  student_id    INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  generated_on  TIMESTAMPTZ NOT NULL DEFAULT now(),
  risk_class    VARCHAR(10) NOT NULL CHECK (risk_class IN ('Low','Medium','High')),
  probability   NUMERIC(5,4) NOT NULL CHECK (probability BETWEEN 0 AND 1),
  top_features  JSONB
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  role       VARCHAR(10) NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
