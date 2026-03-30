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

-- RLS Policies – all data access goes through SECURITY DEFINER functions
-- below, so direct table access by the anon role is denied by default.

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER RPC functions
--
-- PostgREST (used by the Supabase JS client) handles each HTTP request in a
-- separate transaction, potentially on a different database connection.
-- Session variables set with set_config() in one request are NOT available in
-- the next.  Therefore the old approach of calling set_config('app.current_hash')
-- and relying on current_setting() in RLS policies never actually worked.
--
-- Instead we expose SECURITY DEFINER functions that receive the access_hash as
-- a parameter and perform all required checks internally.  The anon role only
-- needs EXECUTE privileges on these functions.
-- ---------------------------------------------------------------------------

-- Check whether a hash already exists
CREATE OR REPLACE FUNCTION check_hash_exists(p_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM users WHERE access_hash = p_hash);
END;
$$;

-- Create a new user and return the row as JSON
CREATE OR REPLACE FUNCTION create_user_with_hash(p_hash TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO users (access_hash)
  VALUES (p_hash)
  RETURNING row_to_json(users.*) INTO result;
  RETURN result;
END;
$$;

-- Look up a user by hash, update last_login, return JSON
CREATE OR REPLACE FUNCTION get_user_by_hash(p_hash TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE users SET last_login = NOW() WHERE access_hash = p_hash;
  SELECT row_to_json(u.*) INTO result FROM users u WHERE u.access_hash = p_hash;
  RETURN result;
END;
$$;

-- Return all progress rows for the user identified by hash
CREATE OR REPLACE FUNCTION get_all_progress(p_hash TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(p.*), '[]'::json)
    FROM progress p
    JOIN users u ON p.user_id = u.id
    WHERE u.access_hash = p_hash
  );
END;
$$;

-- Upsert a progress row: increment counters, recalculate streak, return JSON
CREATE OR REPLACE FUNCTION upsert_progress(p_hash TEXT, p_module TEXT, p_was_correct BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_progress progress%ROWTYPE;
  v_new_streak INTEGER;
  result JSON;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE access_hash = p_hash;
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO v_progress FROM progress
    WHERE user_id = v_user_id AND module = p_module;

  IF v_progress IS NULL THEN
    -- First attempt in this module
    INSERT INTO progress (user_id, module, questions_attempted, questions_correct, streak_days, last_session)
    VALUES (
      v_user_id, p_module, 1,
      CASE WHEN p_was_correct THEN 1 ELSE 0 END,
      1, NOW()
    )
    RETURNING row_to_json(progress.*) INTO result;
  ELSE
    -- Streak calculation
    IF v_progress.last_session IS NULL THEN
      v_new_streak := 1;
    ELSIF (v_progress.last_session AT TIME ZONE 'UTC')::date = CURRENT_DATE THEN
      v_new_streak := v_progress.streak_days;            -- same day
    ELSIF (v_progress.last_session AT TIME ZONE 'UTC')::date = CURRENT_DATE - 1 THEN
      v_new_streak := v_progress.streak_days + 1;        -- consecutive day
    ELSE
      v_new_streak := 1;                                 -- gap detected
    END IF;

    UPDATE progress SET
      questions_attempted = v_progress.questions_attempted + 1,
      questions_correct   = v_progress.questions_correct + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
      streak_days         = v_new_streak,
      last_session        = NOW()
    WHERE id = v_progress.id
    RETURNING row_to_json(progress.*) INTO result;
  END IF;

  RETURN result;
END;
$$;

-- Record an individual question attempt
CREATE OR REPLACE FUNCTION record_question(
  p_hash TEXT, p_module TEXT, p_question_type TEXT,
  p_was_correct BOOLEAN, p_user_answer TEXT, p_correct_answer TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE access_hash = p_hash;
  IF v_user_id IS NULL THEN RETURN; END IF;

  INSERT INTO question_history (user_id, module, question_type, was_correct, user_answer, correct_answer)
  VALUES (v_user_id, p_module, p_question_type, p_was_correct, p_user_answer, p_correct_answer);
END;
$$;
