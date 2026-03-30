-- IHK Study Trainer Database Schema
-- Run this in Supabase SQL Editor

-- Users table with hash-based authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_hash VARCHAR(12) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Progress tracking per module
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_session TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module)
);

-- Question history for review and "practice mistakes" feature
CREATE TABLE question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  was_correct BOOLEAN NOT NULL,
  user_answer TEXT,
  correct_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_module ON progress(module);
CREATE INDEX idx_question_history_user_id ON question_history(user_id);
CREATE INDEX idx_question_history_module ON question_history(module);
CREATE INDEX idx_question_history_was_correct ON question_history(was_correct);
CREATE INDEX idx_users_access_hash ON users(access_hash);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (access_hash = current_setting('app.current_hash', true));

CREATE POLICY "Users can read own progress" ON progress
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE access_hash = current_setting('app.current_hash', true)
  ));

CREATE POLICY "Users can update own progress" ON progress
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE access_hash = current_setting('app.current_hash', true)
  ));

CREATE POLICY "Users can insert own progress" ON progress
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE access_hash = current_setting('app.current_hash', true)
  ));

CREATE POLICY "Users can read own history" ON question_history
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE access_hash = current_setting('app.current_hash', true)
  ));

CREATE POLICY "Users can insert own history" ON question_history
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE access_hash = current_setting('app.current_hash', true)
  ));

-- ============================================================
-- RPC helper functions (SECURITY DEFINER)
-- ============================================================

-- Check whether a given access_hash already exists.
CREATE OR REPLACE FUNCTION check_hash_exists(p_hash VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE access_hash = p_hash);
END;
$$;

-- Create a new user with the given hash.
-- Returns NULL when the hash already exists (collision); never exposes an
-- existing row to the caller.
CREATE OR REPLACE FUNCTION create_user_with_hash(p_hash VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO users (access_hash)
  VALUES (p_hash)
  ON CONFLICT (access_hash) DO NOTHING
  RETURNING to_json(users.*) INTO result;

  RETURN result; -- NULL on conflict
END;
$$;

-- Get a user by access hash, updating last_login atomically.
-- Returns NULL when the hash does not exist (never fabricates a user row).
CREATE OR REPLACE FUNCTION get_user_by_hash(p_hash VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE users
  SET last_login = NOW()
  WHERE access_hash = p_hash
  RETURNING to_json(users.*) INTO result;

  RETURN result; -- NULL when hash not found
END;
$$;

-- Atomically upsert progress for a (user, module) pair, computing streak_days
-- from the existing last_session without a separate SELECT.
CREATE OR REPLACE FUNCTION upsert_progress(
  p_access_hash VARCHAR,
  p_module      VARCHAR,
  p_was_correct BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_today   DATE := (NOW() AT TIME ZONE 'UTC')::DATE;
  v_result  JSON;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE access_hash = p_access_hash;
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO progress (user_id, module, questions_attempted, questions_correct, streak_days, last_session)
  VALUES (
    v_user_id,
    p_module,
    1,
    CASE WHEN p_was_correct THEN 1 ELSE 0 END,
    1, -- first session starts a 1-day streak
    NOW()
  )
  ON CONFLICT (user_id, module) DO UPDATE SET
    questions_attempted = progress.questions_attempted + 1,
    questions_correct   = progress.questions_correct + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
    streak_days = CASE
      WHEN progress.last_session IS NULL
        THEN 1
      WHEN (progress.last_session AT TIME ZONE 'UTC')::DATE = v_today
        THEN progress.streak_days
      WHEN (progress.last_session AT TIME ZONE 'UTC')::DATE = v_today - 1
        THEN progress.streak_days + 1
      ELSE 1
    END,
    last_session = NOW()
  RETURNING to_json(progress.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- Get all progress rows for a user identified by access_hash.
CREATE OR REPLACE FUNCTION get_all_progress(p_access_hash VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_result  JSON;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE access_hash = p_access_hash;
  IF v_user_id IS NULL THEN
    RETURN '[]'::JSON;
  END IF;

  SELECT json_agg(p.*) INTO v_result
  FROM progress p
  WHERE p.user_id = v_user_id;

  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

-- Record a question attempt in question_history.
CREATE OR REPLACE FUNCTION record_question(
  p_access_hash    VARCHAR,
  p_module         VARCHAR,
  p_question_type  VARCHAR,
  p_was_correct    BOOLEAN,
  p_user_answer    TEXT,
  p_correct_answer TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE access_hash = p_access_hash;
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO question_history (user_id, module, question_type, was_correct, user_answer, correct_answer)
  VALUES (v_user_id, p_module, p_question_type, p_was_correct, p_user_answer, p_correct_answer);
END;
$$;
