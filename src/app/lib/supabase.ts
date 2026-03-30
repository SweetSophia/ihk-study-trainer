import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// Create a mock client for build time when env vars aren't available.
// Every query-builder method returns the same chainable object so that
// calls like `.from('t').select('*').eq('k','v').single()` never throw.
// The `rpc` mock is also thenable so `await supabase.rpc(...)` resolves.
const createMockClient = () => {
  const result = { data: null, error: null };

  // Shared thenable handler – used by both chainable queries and rpc()
  const thenHandler = (resolve: (v: unknown) => void) => resolve(result);

  const chainable: Record<string, unknown> = {};
  for (const m of ['select','insert','update','upsert','delete','eq','neq','gt','lt','gte','lte','like','ilike','is','in','order','limit','range','single','maybeSingle','csv','then']) {
    if (m === 'then') {
      chainable[m] = thenHandler;
    } else {
      chainable[m] = () => chainable;
    }
  }

  // rpc mock returns a thenable object so `await supabase.rpc(...)` works
  const rpcResult = {
    ...result,
    then: thenHandler,
  };

  return {
    from: () => chainable,
    rpc: () => rpcResult,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as unknown as ReturnType<typeof createClient>;
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : createMockClient();
