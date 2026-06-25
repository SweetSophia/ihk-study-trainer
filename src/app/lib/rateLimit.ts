import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Rate limit config — gleiche Semantik wie der bisherige In-Memory-Limiter
// (5 Calls pro Minute pro accessHash), aber jetzt produktionstauglich.
// ---------------------------------------------------------------------------
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Absolute ms-Timestamp, an dem das Window zurücksetzt. */
  resetMs: number;
  /** Convenience für Caller; nur gesetzt wenn !allowed. */
  retryAfterMs?: number;
  reason?: 'timeout' | 'cacheBlock' | 'denyList';
  /** Upstash-Analytics-Backgroundwork; Caller sollte das per after() / waitUntil() terminieren. */
  pending?: Promise<unknown>;
  mode: 'upstash' | 'memory';
};

// ---------------------------------------------------------------------------
// Upstash-Limiter (lazy init). Wird nur erzeugt, wenn beide Env-Vars da sind.
// ---------------------------------------------------------------------------
let _upstash: Ratelimit | null = null;

function getUpstashLimiter(): Ratelimit | null {
  if (_upstash) return _upstash;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  _upstash = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(RATE_LIMIT_MAX, '60 s'),
    analytics: true,
    prefix: 'rl:ihk',
    // Default 5s ist für eine Server-Action viel zu lang — lieber fail-fast.
    timeout: 1000,
    ephemeralCache: new Map(),
  });
  return _upstash;
}

// ---------------------------------------------------------------------------
// In-Memory-Fallback (Dev ohne Env / bewusst gewählte Notbremse).
// ACHTUNG: Pro Vercel-Instance getrennt — auf Edge / Serverless NICHT
// multi-instance-sicher. Genau das, was der vorige Kommentar am alten
// Map schon angemerkt hat; jetzt wenigstens laut signalisiert.
// ---------------------------------------------------------------------------
type MemEntry = { count: number; resetAt: number };
const mem = new Map<string, MemEntry>();

function checkMemory(id: string): RateLimitResult {
  const now = Date.now();
  const entry = mem.get(id);
  if (!entry || now > entry.resetAt) {
    mem.set(id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX - 1,
      resetMs: mem.get(id)!.resetAt,
      mode: 'memory',
    };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      limit: RATE_LIMIT_MAX,
      remaining: 0,
      resetMs: entry.resetAt,
      retryAfterMs: entry.resetAt - now,
      mode: 'memory',
    };
  }
  entry.count++;
  return {
    allowed: true,
    limit: RATE_LIMIT_MAX,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetMs: entry.resetAt,
    mode: 'memory',
  };
}

/**
 * Prüft, ob `identifier` (bei uns der accessHash) im aktuellen Fenster
 * noch einen Call frei hat. Upstash, wenn env gesetzt, sonst In-Memory.
 *
 * Fail-open: Bei Upstash-Fehlern (Timeout, Netz) wird der Request
 * durchgelassen — Rate-Limit soll nicht selbst zur Downtime führen.
 * Der Fehler wird geloggt.
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter();
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN fehlen — fallback In-Memory. ' +
          'Auf Vercel ist der Limiter dann NICHT multi-instance-sicher.'
      );
    }
    return checkMemory(identifier);
  }

  try {
    const r = await limiter.limit(identifier);
    return {
      allowed: r.success,
      limit: r.limit,
      remaining: r.remaining,
      resetMs: r.reset,
      retryAfterMs: r.success ? undefined : Math.max(0, r.reset - Date.now()),
      reason: r.reason,
      pending: r.pending,
      mode: 'upstash',
    };
  } catch (err) {
    console.error('[rateLimit] Upstash-Call fehlgeschlagen, fail-open:', err);
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX,
      resetMs: Date.now() + RATE_LIMIT_WINDOW_MS,
      mode: 'upstash',
    };
  }
}