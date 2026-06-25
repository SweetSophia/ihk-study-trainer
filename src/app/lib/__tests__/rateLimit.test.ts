import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Upstash modules BEFORE importing the SUT so the module's
// `getUpstashLimiter()` returns null (no env) and exercises the memory
// fallback path. This is the path that actually runs in dev / tests.
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn(),
}));
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}));

import { checkRateLimit, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '../rateLimit';

describe('rateLimit (memory fallback when Upstash env missing)', () => {
  beforeEach(() => {
    // Make sure no Upstash env vars are set for the whole suite.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('allows the first call for an identifier', async () => {
    const r = await checkRateLimit('user-a');
    expect(r.allowed).toBe(true);
    expect(r.mode).toBe('memory');
    expect(r.limit).toBe(RATE_LIMIT_MAX);
    expect(r.remaining).toBe(RATE_LIMIT_MAX - 1);
  });

  it('counts down remaining within the window', async () => {
    const r1 = await checkRateLimit('user-b');
    const r2 = await checkRateLimit('user-b');
    expect(r1.remaining).toBe(RATE_LIMIT_MAX - 1);
    expect(r2.remaining).toBe(RATE_LIMIT_MAX - 2);
  });

  it('rejects after RATE_LIMIT_MAX calls and exposes retryAfterMs', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const r = await checkRateLimit('user-c');
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkRateLimit('user-c');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(RATE_LIMIT_WINDOW_MS);
  });

  it('isolates buckets per identifier', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await checkRateLimit('user-d');
    }
    // user-d is now exhausted; user-e must still be allowed.
    const other = await checkRateLimit('user-e');
    expect(other.allowed).toBe(true);
  });

  it('returns a resetMs roughly within the window', async () => {
    const before = Date.now();
    const r = await checkRateLimit('user-f');
    expect(r.resetMs).toBeGreaterThanOrEqual(before);
    expect(r.resetMs).toBeLessThanOrEqual(before + RATE_LIMIT_WINDOW_MS + 50);
  });

  it('warns loudly when Upstash env is missing in production', async () => {
    process.env.NODE_ENV = 'production';
    const warn = vi.spyOn(console, 'warn');
    await checkRateLimit('user-g');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/UPSTASH/i);
  });
});