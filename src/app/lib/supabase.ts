import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// Create a mock client for build time when env vars aren't available.
// Every query-builder method returns the same chainable object so that
// calls like `.from('t').select('*').eq('k','v').single()` never throw.
const createMockClient = () => {
  const result = { data: null, error: null };
  const chainable: Record<string, unknown> = {};
  for (const m of ['select','insert','update','upsert','delete','eq','neq','gt','lt','gte','lte','like','ilike','is','in','order','limit','range','single','maybeSingle','csv','then']) {
    if (m === 'then') {
      // Make the object thenable so `await` resolves to result
      chainable[m] = (resolve: (v: unknown) => void) => resolve(result);
    } else {
      chainable[m] = () => chainable;
    }
  }
  return {
    from: () => chainable,
    rpc: () => ({ data: null, error: null }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock intentionally mimics SupabaseClient without full generic type
  } as any;
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : createMockClient();

// Helper to set the current hash for RLS
export async function setUserContext(hash: string) {
  if (!supabaseUrl || !supabaseKey) return;
  await supabase.rpc('set_config', {
    parameter: 'app.current_hash',
    value: hash
  });
}
