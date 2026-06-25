import { createHmac } from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Rate limit config — gleiche Semantik wie der bisherige In-Memory-Limiter
// (5 Calls pro Minute pro accessHash), aber jetzt produktionstauglich.
// ---------------------------------------------------------------------------
export const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_SECONDS * 1000;

// Fail-closed: nach N Upstash-Fehlern innerhalb des Fensters wird auf
// fail-closed geschaltet, damit ein DoS / Ausfall den Limiter nicht
// dauerhaft aushebelt (sonst hätten wir die alte Bypass-Lücke nur verlagert).
const FAILURE_THRESHOLD = 5;
const FAILURE_WINDOW_MS = 30_000;

export type RateLimitMode = 'upstash' | 'memory' | 'upstash-degraded';

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Absolute ms-Timestamp, an dem das Window zurücksetzt. */
  resetMs: number;
  /** Convenience für Caller; nur gesetzt wenn !allowed. */
  retryAfterMs?: number;
  reason?: 'timeout' | 'cacheBlock' | 'denyList';
  /** Upstash-Analytics-Backgroundwork. Caller sollte das per after() terminieren. */
  pending?: Promise<unknown>;
  mode: RateLimitMode;
};

// ---------------------------------------------------------------------------
// Identifier-Hashing: der accessHash IST die einzige Credential. Roh an
// Upstash geben → landet im Redis-Keyspace UND im Analytics-Dashboard.
// Jeder mit Dashboard-Read-Access könnte so User-Logins übernehmen.
// Daher HMAC mit einer prozessspezifischen Pepper-Variable.
//
// Dev: ohne Pepper fallback `dev:<id>` (kollidiert nie mit prod-digests).
// Prod: ohne Pepper ist ein Hard-Fail.
// ---------------------------------------------------------------------------
const RATE_LIMIT_PEPPER = process.env.RATE_LIMIT_PEPPER;

export function hashIdentifier(id: string): string {
  if (!RATE_LIMIT_PEPPER) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'RATE_LIMIT_PEPPER muss in Production gesetzt sein (sonst landet ' +
          'der accessHash roh im Upstash-Dashboard).'
      );
    }
    return `dev:${id}`;
  }
  return createHmac('sha256', RATE_LIMIT_PEPPER).update(id).digest('hex');
}

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
    limiter: Ratelimit.fixedWindow(RATE_LIMIT_MAX, `${RATE_LIMIT_WINDOW_SECONDS} s`),
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
// multi-instance-sicher.
// ---------------------------------------------------------------------------
type MemEntry = { count: number; resetAt: number };
const mem = new Map<string, MemEntry>();

function checkMemory(id: string): RateLimitResult {
  const now = Date.now();
  const entry = mem.get(id);
  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    mem.set(id, { count: 1, resetAt });
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX - 1,
      resetMs: resetAt,
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

// ---------------------------------------------------------------------------
// Failure-Streak-Tracking (per Node-Prozess). Auf Vercel-Warm-Instance lebt
// das Counter mehrere Stunden; Cold-Start resettet es bewusst — ein einzelner
// frischer Prozess darf fail-open laufen, ein dauerhafter Upstash-Ausfall
// soll aber fail-closed werden.
// ---------------------------------------------------------------------------
let failures = 0;
let firstFailureAt = 0;
let warnedMissingUpstash = false;

function recordUpstashFailure(): boolean /* failClosed */ {
  const now = Date.now();
  if (now - firstFailureAt > FAILURE_WINDOW_MS) {
    firstFailureAt = now;
    failures = 1;
    return false;
  }
  failures++;
  return failures >= FAILURE_THRESHOLD;
}

/** Test-only hook: setzt State zurück. */
export function __resetRateLimitForTests(): void {
  warnedMissingUpstash = false;
  failures = 0;
  firstFailureAt = 0;
  mem.clear();
}

/**
 * Prüft, ob `identifier` (bei uns der accessHash) im aktuellen Fenster noch
 * einen Call frei hat. Upstash, wenn env gesetzt, sonst In-Memory.
 *
 * Fail-closed nach FAILURE_THRESHOLD Upstash-Fehlern in FAILURE_WINDOW_MS.
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter();
  if (!limiter) {
    if (process.env.NODE_ENV === 'production' && !warnedMissingUpstash) {
      console.warn(
        '[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN fehlen — fallback In-Memory. ' +
          'Auf Vercel ist der Limiter dann NICHT multi-instance-sicher.'
      );
      warnedMissingUpstash = true;
    }
    return checkMemory(hashIdentifier(identifier));
  }

  const hashedId = hashIdentifier(identifier);

  try {
    const r = await limiter.limit(hashedId);
    // Erfolg — Failure-Streak resetten.
    failures = 0;
    firstFailureAt = 0;
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
    const failClosed = recordUpstashFailure();
    // URL-Redaktion: @upstash/redis inkludiert die REST-URL in err.message
    // (URL + Token sind die Credentials). Wir loggen deshalb nur Name +
    // ggf. Status, niemals die Message.
    const e = err as { name?: string; status?: number };
    console.error('[rateLimit] Upstash-Call fehlgeschlagen:', {
      name: e?.name ?? 'Error',
      status: typeof e?.status === 'number' ? e.status : undefined,
      failures,
      failClosed,
    });
    if (failClosed) {
      return {
        allowed: false,
        limit: RATE_LIMIT_MAX,
        remaining: 0,
        resetMs: Date.now() + RATE_LIMIT_WINDOW_MS,
        retryAfterMs: RATE_LIMIT_WINDOW_MS,
        mode: 'upstash-degraded',
      };
    }
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX,
      resetMs: Date.now() + RATE_LIMIT_WINDOW_MS,
      mode: 'upstash-degraded',
    };
  }
}