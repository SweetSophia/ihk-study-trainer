import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function scriptSources(environment: 'production' | 'development') {
  vi.stubEnv('NODE_ENV', environment);
  vi.resetModules();
  const { default: config } = await import('./next.config');
  const rules = await config.headers!();
  const header = rules
    .find((rule) => rule.source === '/:path*')!
    .headers.find((entry) => entry.key === 'Content-Security-Policy')!;
  return header.value
    .split('; ')
    .find((directive) => directive.startsWith('script-src '))!
    .split(' ')
    .slice(1);
}

describe('script Content Security Policy', () => {
  it('allows PGlite WASM in production without allowing JavaScript eval', async () => {
    const sources = await scriptSources('production');

    expect(sources).toContain("'wasm-unsafe-eval'");
    expect(sources).not.toContain("'unsafe-eval'");
  });

  it('retains JavaScript eval in development for Next HMR', async () => {
    expect(await scriptSources('development')).toContain("'unsafe-eval'");
  });
});
