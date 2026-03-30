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

/** Create a new user with the given hash.
 *  Returns null on hash collision (expected, caller should retry with a new hash).
 *  Throws on RPC/network errors so callers can abort early instead of retrying.
 */
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

  const { data, error } = await supabase.rpc('create_user_with_hash', { p_hash: hash });

  if (error) {
    throw new Error(`createUser RPC failed: ${error.message}`);
  }

  // data is null when the hash already exists – legitimate collision
  return data ? (data as User) : null;
}

/** Get user by access hash (login).
 *  Throws on RPC/network errors so callers can distinguish from "not found".
 */
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

  const { data, error } = await supabase.rpc('get_user_by_hash', { p_hash: hash });

  if (error) {
    throw new Error(`getUserByHash RPC failed: ${error.message}`);
  }

  // data is null when the hash doesn't exist – legitimate "not found"
  return data ? (data as User) : null;
}

/** Generate a unique hash and create user (with retry on collision).
 *  Relies on the atomic INSERT ... ON CONFLICT in create_user_with_hash
 *  to detect collisions — no separate hashExists pre-check needed.
 *  Throws if createUser() fails with an RPC/network error (so the caller
 *  surfaces a single failure instead of 10 pointless retries).
 */
export async function generateUniqueUser(): Promise<{ user: User; hash: string } | null> {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const hash = generateAccessHash();
    const user = await createUser(hash); // throws on RPC error; propagate immediately
    if (user) {
      return { user, hash };
    }
    // user is null → hash collision; retry with a new hash
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
    // earlier or missing, leave unchanged if it's the same calendar day (UTC).
    const todayUTC = new Date().toISOString().slice(0, 10);
    if (entry.last_session) {
      const lastUTC = new Date(entry.last_session).toISOString().slice(0, 10);
      if (lastUTC === todayUTC) {
        // Same day – streak stays the same
      } else {
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayUTC = yesterday.toISOString().slice(0, 10);
        if (lastUTC === yesterdayUTC) {
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
    const { error } = await supabase.rpc('record_question', {
      p_hash: accessHash,
      p_module: module,
      p_question_type: questionType,
      p_was_correct: wasCorrect,
      p_user_answer: userAnswer,
      p_correct_answer: correctAnswer
    });
    if (error) {
      console.error(`record_question RPC failed (hash=${accessHash}, module=${module}, type=${questionType}):`, error);
    }
  } catch (err) {
    console.error(`record_question RPC failed (hash=${accessHash}, module=${module}, type=${questionType}):`, err);
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
