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
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('access_hash', hash)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking hash:', error);
    }
    
    return !!data;
  } catch {
    // Return false if supabase is not configured (dev mode)
    return false;
  }
}

/** Create a new user with the given hash */
export async function createUser(hash: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ access_hash: hash }])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error creating user:', error);
      // Return mock user for dev mode
      return {
        id: 'mock-' + hash.slice(0, 8),
        access_hash: hash,
        created_at: new Date().toISOString(),
        last_login: null
      };
    }
    
    return data as User;
  } catch {
    // Return mock user if supabase is not configured
    return {
      id: 'mock-' + hash.slice(0, 8),
      access_hash: hash,
      created_at: new Date().toISOString(),
      last_login: null
    };
  }
}

/** Get user by access hash (login) */
export async function getUserByHash(hash: string): Promise<User | null> {
  try {
    // Update last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('access_hash', hash);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('access_hash', hash)
      .single();
    
    if (error || !data) {
      // Return mock user for dev mode or if not found
      return {
        id: 'mock-' + hash.slice(0, 8),
        access_hash: hash,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
    }
    
    return data as User;
  } catch {
    // Return mock user if supabase is not configured
    return {
      id: 'mock-' + hash.slice(0, 8),
      access_hash: hash,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };
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

/** Get or create progress record for a user and module */
export async function getProgress(userId: string, module: string) {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module', module)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No record found, create one
      const { data: newData, error: createError } = await supabase
        .from('progress')
        .insert([{ user_id: userId, module }])
        .select()
        .single();
      
      if (createError) {
        return { user_id: userId, module, questions_attempted: 0, questions_correct: 0, streak_days: 0 };
      }
      
      return newData;
    }
    
    if (error) {
      return { user_id: userId, module, questions_attempted: 0, questions_correct: 0, streak_days: 0 };
    }
    
    return data;
  } catch {
    return { user_id: userId, module, questions_attempted: 0, questions_correct: 0, streak_days: 0 };
  }
}

/** Update progress for a module */
export async function updateProgress(
  userId: string, 
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

  // --- Supabase path ---
  try {
    const progress = await getProgress(userId, module);
    
    if (!progress) return null;
    
    const { data, error } = await supabase
      .from('progress')
      .update({
        questions_attempted: (progress.questions_attempted || 0) + 1,
        questions_correct: (progress.questions_correct || 0) + (wasCorrect ? 1 : 0),
        last_session: new Date().toISOString()
      })
      .eq('id', progress.id)
      .select()
      .single();
    
    if (error) {
      return progress;
    }
    
    return data;
  } catch {
    return null;
  }
}

/** Record question attempt in history */
export async function recordQuestionAttempt(
  userId: string,
  module: string,
  questionType: string,
  wasCorrect: boolean,
  userAnswer: string,
  correctAnswer: string
) {
  try {
    await supabase
      .from('question_history')
      .insert([{
        user_id: userId,
        module,
        question_type: questionType,
        was_correct: wasCorrect,
        user_answer: userAnswer,
        correct_answer: correctAnswer
      }]);
  } catch {
    // Silently fail in dev mode
  }
}

/** Get all progress for a user */
export async function getAllProgress(userId: string) {
  // --- localStorage fallback ---
  if (!isSupabaseConfigured) {
    return loadLocalProgress();
  }

  try {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      return [];
    }
    
    return data || [];
  } catch {
    return [];
  }
}
