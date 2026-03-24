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
