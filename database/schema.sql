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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM users WHERE access_hash = p_hash);
END;
$$;
REVOKE ALL ON FUNCTION check_hash_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_hash_exists(TEXT) TO anon, authenticated;

-- Create a new user and return the row as JSON.
-- Returns NULL when the hash already exists (collision) so the caller can
-- retry with a different hash.  Never returns an existing user's data.
CREATE OR REPLACE FUNCTION create_user_with_hash(p_hash TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO users (access_hash)
  VALUES (p_hash)
  ON CONFLICT (access_hash) DO NOTHING
  RETURNING row_to_json(users.*) INTO result;

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION create_user_with_hash(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_user_with_hash(TEXT) TO anon, authenticated;

-- Look up a user by hash, update last_login, return JSON.
-- Only touches the row when the user actually exists.
CREATE OR REPLACE FUNCTION get_user_by_hash(p_hash TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE users SET last_login = NOW()
  WHERE access_hash = p_hash
  RETURNING row_to_json(users.*) INTO result;

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION get_user_by_hash(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_by_hash(TEXT) TO anon, authenticated;

-- Return all progress rows for the user identified by hash
CREATE OR REPLACE FUNCTION get_all_progress(p_hash TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(p.*), '[]'::json)
    FROM progress p
    JOIN users u ON p.user_id = u.id
    WHERE u.access_hash = p_hash
  );
END;
$$;
REVOKE ALL ON FUNCTION get_all_progress(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_all_progress(TEXT) TO anon, authenticated;

-- Upsert a progress row: atomically increment counters, recalculate streak,
-- return the resulting JSON.  Uses INSERT ... ON CONFLICT to avoid race
-- conditions from concurrent requests (double-clicks, multi-tab, retries).
CREATE OR REPLACE FUNCTION upsert_progress(p_hash TEXT, p_module TEXT, p_was_correct BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date;
  result JSON;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE access_hash = p_hash;
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  INSERT INTO progress (user_id, module, questions_attempted, questions_correct, streak_days, last_session)
  VALUES (
    v_user_id,
    p_module,
    1,
    CASE WHEN p_was_correct THEN 1 ELSE 0 END,
    1,
    NOW()
  )
  ON CONFLICT (user_id, module) DO UPDATE SET
    questions_attempted = progress.questions_attempted + 1,
    questions_correct   = progress.questions_correct + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
    streak_days         = CASE
                            WHEN progress.last_session IS NULL THEN 1
                            WHEN (progress.last_session AT TIME ZONE 'UTC')::date = v_today THEN progress.streak_days
                            WHEN (progress.last_session AT TIME ZONE 'UTC')::date = v_today - 1 THEN progress.streak_days + 1
                            ELSE 1
                          END,
    last_session        = NOW()
  RETURNING row_to_json(progress.*) INTO result;

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION upsert_progress(TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_progress(TEXT, TEXT, BOOLEAN) TO anon, authenticated;

-- Record an individual question attempt
CREATE OR REPLACE FUNCTION record_question(
  p_hash TEXT, p_module TEXT, p_question_type TEXT,
  p_was_correct BOOLEAN, p_user_answer TEXT, p_correct_answer TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE access_hash = p_hash;
  IF v_user_id IS NULL THEN RETURN; END IF;

  INSERT INTO question_history (user_id, module, question_type, was_correct, user_answer, correct_answer)
  VALUES (v_user_id, p_module, p_question_type, p_was_correct, p_user_answer, p_correct_answer);
END;
$$;
REVOKE ALL ON FUNCTION record_question(TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_question(TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) TO anon, authenticated;
