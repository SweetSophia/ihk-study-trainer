import { supabase, isSupabaseConfigured } from './supabase';
import { User } from '../types';

// ---------------------------------------------------------------------------
// localStorage helpers - used as fallback when Supabase is not configured
// ---------------------------------------------------------------------------

const LOCAL_PROGRESS_KEY = 'ihk_progress';

interface LocalProgress {
  module: string;
  questions_attempted: number;
  questions_correct: number;
  streak_days: number;
  last_session: string | null;
}

function loadLocalProgress(): LocalProgress[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProgress(data: LocalProgress[]): void {
  try {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable – silently ignore
  }
}

// ---------------------------------------------------------------------------

/** Generate a random 12-character alphanumeric hash */
export function generateAccessHash(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 12; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

/** Check if a hash already exists in the database */
export async function hashExists(hash: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data, error } = await supabase.rpc('check_hash_exists', { p_hash: hash });
    if (error) {
      console.error('Error checking hash:', error);
      return false;
    }
    return !!data;
  } catch {
    return false;
  }
}

/** Create a new user with the given hash */
export async function createUser(hash: string): Promise<User | null> {
  if (!isSupabaseConfigured) {
    // Return mock user for dev mode
    return {
      id: 'mock-' + hash.slice(0, 8),
      access_hash: hash,
      created_at: new Date().toISOString(),
      last_login: null
    };
  }

  try {
    const { data, error } = await supabase.rpc('create_user_with_hash', { p_hash: hash });

    if (error || !data) {
      console.error('Error creating user:', error);
      return null;
    }

    return data as User;
  } catch (err) {
    console.error('Error creating user:', err);
    return null;
  }
}

/** Get user by access hash (login) */
export async function getUserByHash(hash: string): Promise<User | null> {
  if (!isSupabaseConfigured) {
    // Return mock user for dev mode
    return {
      id: 'mock-' + hash.slice(0, 8),
      access_hash: hash,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };
  }

  try {
    const { data, error } = await supabase.rpc('get_user_by_hash', { p_hash: hash });

    if (error || !data) {
      if (error) console.error('Error getting user by hash:', error);
      return null;
    }

    return data as User;
  } catch (err) {
    console.error('Error getting user by hash:', err);
    return null;
  }
}

/** Generate a unique hash and create user (with retry on collision) */
export async function generateUniqueUser(): Promise<{ user: User; hash: string } | null> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const hash = generateAccessHash();
    const exists = await hashExists(hash);
    
    if (!exists) {
      const user = await createUser(hash);
      if (user) {
        return { user, hash };
      }
    }
    
    attempts++;
  }
  
  console.error('Failed to generate unique hash after', maxAttempts, 'attempts');
  return null;
}

/** Update progress for a module.
 *  @param accessHash - the 12-char access hash identifying the user
 */
export async function updateProgress(
  accessHash: string, 
  module: string, 
  wasCorrect: boolean
) {
  // --- localStorage fallback when Supabase is not configured ---
  if (!isSupabaseConfigured) {
    const all = loadLocalProgress();
    let entry = all.find(p => p.module === module);
    if (!entry) {
      entry = { module, questions_attempted: 0, questions_correct: 0, streak_days: 0, last_session: null };
      all.push(entry);
    }
    entry.questions_attempted += 1;
    if (wasCorrect) entry.questions_correct += 1;

    // Streak: increment if last session was yesterday, reset to 1 if it was
    // earlier or missing, leave unchanged if it's the same calendar day.
    const today = new Date();
    const todayStr = today.toDateString();
    if (entry.last_session) {
      const lastDate = new Date(entry.last_session);
      const lastStr = lastDate.toDateString();
      if (lastStr === todayStr) {
        // Same day – streak stays the same
      } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate.toDateString() === yesterday.toDateString()) {
          entry.streak_days = (entry.streak_days || 0) + 1;
        } else {
          entry.streak_days = 1; // gap detected – reset
        }
      }
    } else {
      entry.streak_days = 1; // first ever session
    }

    entry.last_session = new Date().toISOString();

    saveLocalProgress(all);
    return entry;
  }

  // --- Supabase path – use RPC function ---
  try {
    const { data, error } = await supabase.rpc('upsert_progress', {
      p_hash: accessHash,
      p_module: module,
      p_was_correct: wasCorrect
    });

    if (error) {
      console.error('Error updating progress:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error updating progress:', err);
    return null;
  }
}

/** Record question attempt in history */
export async function recordQuestionAttempt(
  accessHash: string,
  module: string,
  questionType: string,
  wasCorrect: boolean,
  userAnswer: string,
  correctAnswer: string
) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.rpc('record_question', {
      p_hash: accessHash,
      p_module: module,
      p_question_type: questionType,
      p_was_correct: wasCorrect,
      p_user_answer: userAnswer,
      p_correct_answer: correctAnswer
    });
  } catch {
    // Silently fail in dev mode
  }
}

/** Get all progress for a user.
 *  @param accessHash - the 12-char access hash identifying the user
 */
export async function getAllProgress(accessHash: string) {
  // --- localStorage fallback ---
  if (!isSupabaseConfigured) {
    return loadLocalProgress();
  }

  try {
    const { data, error } = await supabase.rpc('get_all_progress', { p_hash: accessHash });

    if (error) {
      console.error('Error loading progress:', error);
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}
