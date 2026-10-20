// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function policyDirectives(environment: 'production' | 'development') {
  vi.stubEnv('NODE_ENV', environment);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.resetModules();
  const { default: config } = await import('./next.config');
  const rules = await config.headers!();
  const header = rules
    .find((rule) => rule.source === '/:path*')
    ?.headers.find((entry) => entry.key === 'Content-Security-Policy');
  expect(header, 'CSP header must cover every route').toBeDefined();
  if (!header) throw new Error('Missing Content-Security-Policy header');
  return header.value
    .split(';')
    .map((directive) => directive.trim().split(/\s+/).join(' '));
}

describe('Content Security Policy', () => {
  it('allows PGlite WASM in production without allowing JavaScript eval', async () => {
    expect(await policyDirectives('production')).toEqual([
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ]);
  });

  it('retains JavaScript eval in development for Next HMR', async () => {
    expect(await policyDirectives('development')).toContain(
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval'",
    );
  });
});
