import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Upstash modules BEFORE the SUT is imported. The SUT's
// getUpstashLimiter() reads env at first call; if neither
// UPSTASH_REDIS_REST_URL nor UPSTASH_REDIS_REST_TOKEN is set, the mock
// isn't reached and we exercise the memory fallback. With env set, the
// mocked Ratelimit constructor returns { limit: mockLimit }.
const mockLimit = vi.fn();

vi.mock('@upstash/ratelimit', () => {
  // `function` (not arrow) so the mock is constructable via `new`.
  function RatelimitCtor() {
    return { limit: mockLimit };
  }
  // Static methods used by getUpstashLimiter() (rateLimit.ts:72-78).
  const fixedWindow = vi.fn(() => 'fixedWindow-config');
  const slidingWindow = vi.fn(() => 'slidingWindow-config');
  const tokenBucket = vi.fn(() => 'tokenBucket-config');
  Object.assign(RatelimitCtor, { fixedWindow, slidingWindow, tokenBucket });
  const mock = vi.fn(RatelimitCtor);
  Object.assign(mock, { fixedWindow, slidingWindow, tokenBucket });
  return { Ratelimit: mock };
});

vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn(() => ({})) },
}));

// Clean env state + module cache before every test. rateLimit.ts reads
// process.env on first call and caches the limiter, so without this the
// first test's state would leak into subsequent tests.
beforeEach(() => {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  vi.stubEnv('RATE_LIMIT_PEPPER', '');
  vi.stubEnv('NODE_ENV', 'test');
  mockLimit.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// Memory fallback (Upstash env absent)
// ---------------------------------------------------------------------------
describe('rateLimit — memory fallback', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('allows the first call for an identifier', async () => {
    const { checkRateLimit, __resetRateLimitForTests, RATE_LIMIT_MAX } = await import('../rateLimit');
    __resetRateLimitForTests();
    const r = await checkRateLimit('user-a');
    expect(r.allowed).toBe(true);
    expect(r.mode).toBe('memory');
    expect(r.limit).toBe(RATE_LIMIT_MAX);
    expect(r.remaining).toBe(RATE_LIMIT_MAX - 1);
  });

  it('counts down remaining within the window', async () => {
    const { checkRateLimit, __resetRateLimitForTests, RATE_LIMIT_MAX } = await import('../rateLimit');
    __resetRateLimitForTests();
    const r1 = await checkRateLimit('user-b');
    const r2 = await checkRateLimit('user-b');
    expect(r1.remaining).toBe(RATE_LIMIT_MAX - 1);
    expect(r2.remaining).toBe(RATE_LIMIT_MAX - 2);
  });

  it('rejects after RATE_LIMIT_MAX calls and exposes retryAfterMs', async () => {
    const { checkRateLimit, __resetRateLimitForTests, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } =
      await import('../rateLimit');
    __resetRateLimitForTests();
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
    const { checkRateLimit, __resetRateLimitForTests, RATE_LIMIT_MAX } = await import('../rateLimit');
    __resetRateLimitForTests();
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await checkRateLimit('user-d');
    }
    const other = await checkRateLimit('user-e');
    expect(other.allowed).toBe(true);
  });

  it('returns a resetMs roughly within the window', async () => {
    const { checkRateLimit, __resetRateLimitForTests, RATE_LIMIT_WINDOW_MS } =
      await import('../rateLimit');
    __resetRateLimitForTests();
    const before = Date.now();
    const r = await checkRateLimit('user-f');
    expect(r.resetMs).toBeGreaterThanOrEqual(before);
    expect(r.resetMs).toBeLessThanOrEqual(before + RATE_LIMIT_WINDOW_MS + 50);
  });

  it('warns in production when Upstash env is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RATE_LIMIT_PEPPER', 'test-pepper');
    const warnSpy = vi.spyOn(console, 'warn');
    const { checkRateLimit, __resetRateLimitForTests } = await import('../rateLimit');
    __resetRateLimitForTests();
    await checkRateLimit('user-g');
    const upstashWarns = warnSpy.mock.calls.filter((call) =>
      String(call[0] ?? '').includes('UPSTASH')
    );
    expect(upstashWarns.length).toBe(1);
  });

  it('does not warn in production when Upstash env is missing more than once per process', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RATE_LIMIT_PEPPER', 'test-pepper');
    const warnSpy = vi.spyOn(console, 'warn');
    const { checkRateLimit, __resetRateLimitForTests } = await import('../rateLimit');
    __resetRateLimitForTests();
    await checkRateLimit('user-h1');
    await checkRateLimit('user-h2');
    await checkRateLimit('user-h3');
    const upstashWarns = warnSpy.mock.calls.filter((call) =>
      String(call[0] ?? '').includes('UPSTASH')
    );
    expect(upstashWarns.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// hashIdentifier — accessHash credential defense
// ---------------------------------------------------------------------------
describe('hashIdentifier', () => {
  it('produces a stable hex digest for a fixed pepper', async () => {
    vi.stubEnv('RATE_LIMIT_PEPPER', 'test-pepper-fixed');
    vi.stubEnv('NODE_ENV', 'test');
    const { hashIdentifier } = await import('../rateLimit');
    expect(hashIdentifier('user-a')).toMatch(/^[a-f0-9]{64}$/);
    expect(hashIdentifier('user-a')).toBe(hashIdentifier('user-a'));
    expect(hashIdentifier('user-a')).not.toBe(hashIdentifier('user-b'));
  });

  it('different peppers produce different digests', async () => {
    vi.stubEnv('RATE_LIMIT_PEPPER', 'pepper-A');
    vi.stubEnv('NODE_ENV', 'test');
    const { hashIdentifier: h1 } = await import('../rateLimit');
    const a = h1('user-x');
    vi.stubEnv('RATE_LIMIT_PEPPER', 'pepper-B');
    vi.resetModules();
    const { hashIdentifier: h2 } = await import('../rateLimit');
    const b = h2('user-x');
    expect(a).not.toBe(b);
  });

  it('throws in production when pepper is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { hashIdentifier } = await import('../rateLimit');
    expect(() => hashIdentifier('user')).toThrow(/RATE_LIMIT_PEPPER/);
  });

  it('uses dev: prefix when no pepper is set outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { hashIdentifier } = await import('../rateLimit');
    expect(hashIdentifier('user-a')).toBe('dev:user-a');
  });
});

// ---------------------------------------------------------------------------
// Upstash failure handling — fail-open → fail-closed, URL redaction
// ---------------------------------------------------------------------------
describe('rateLimit — Upstash failure handling', () => {
  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    vi.stubEnv('RATE_LIMIT_PEPPER', 'test-pepper');
    vi.stubEnv('NODE_ENV', 'production');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('fail-opens on a single Upstash error and tags mode=upstash-degraded', async () => {
    mockLimit.mockRejectedValueOnce(new Error('HTTP 503 from https://test.upstash.io'));
    const { checkRateLimit, __resetRateLimitForTests } = await import('../rateLimit');
    __resetRateLimitForTests();
    const r = await checkRateLimit('user-x');
    expect(r.allowed).toBe(true);
    expect(r.mode).toBe('upstash-degraded');
  });

  it('fail-closes after FAILURE_THRESHOLD consecutive failures', async () => {
    mockLimit.mockRejectedValue(new Error('boom'));
    const { checkRateLimit, __resetRateLimitForTests } = await import('../rateLimit');
    __resetRateLimitForTests();
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(`user-${i}`);
    }
    const r = await checkRateLimit('user-z');
    expect(r.allowed).toBe(false);
    expect(r.mode).toBe('upstash-degraded');
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it('does NOT log err.message (URL redaction)', async () => {
    const SECRET_URL = 'https://secret-xyz.upstash.io';
    mockLimit.mockRejectedValueOnce(new Error(`HTTP 500 from ${SECRET_URL}`));
    const errSpy = vi.spyOn(console, 'error');
    const { checkRateLimit, __resetRateLimitForTests } = await import('../rateLimit');
    __resetRateLimitForTests();
    await checkRateLimit('user-z');
    const logged = errSpy.mock.calls
      .flat()
      .map((c) => {
        try {
          return JSON.stringify(c);
        } catch {
          return String(c);
        }
      })
      .join(' ');
    expect(logged).not.toContain(SECRET_URL);
    expect(logged).not.toContain('HTTP 500');
  });

  it('resets failure streak on a successful call', async () => {
    mockLimit
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60_000,
      })
      .mockRejectedValueOnce(new Error('boom'));
    const { checkRateLimit, __resetRateLimitForTests } = await import('../rateLimit');
    __resetRateLimitForTests();
    await checkRateLimit('user-w');
    await checkRateLimit('user-w');
    const r = await checkRateLimit('user-w');
    expect(r.allowed).toBe(true);
    expect(r.mode).toBe('upstash-degraded');
  });
});