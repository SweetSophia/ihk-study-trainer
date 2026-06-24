import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
// The app is a single-page client that talks to Supabase (RPC) and Groq
// (AI for the SQL module). The CSP whitelists exactly those origins and
// keeps everything else pinned to 'self'. Next.js's dev mode needs
// 'unsafe-inline' + 'unsafe-eval' for scripts; production would ideally
// drop these and use nonces, but doing that without breaking framer-motion
// is out of scope for this PR.
//
// Vercel automatically adds HSTS on HTTPS deployments, so we keep the
// value conservative (2 years, subdomains, preload-ready). HSTS is
// harmless over plain HTTP — browsers ignore it.

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js dev needs 'unsafe-inline' + 'unsafe-eval' for the HMR runtime;
  // framer-motion + Tailwind v4 inject inline styles. Tighten with nonces
  // in a follow-up if needed.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // PGlite generates its data as a Blob; 'self' + 'data:' cover
  // self-hosted + inline-image use cases. Allow https: so future image
  // generation (PRs in IMPROVEMENT_PLAN.md) can serve CDN URLs.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Supabase (REST + realtime WebSocket) and Groq (OpenAI-compatible API).
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Block until a user enables a script-blocking browser mitigation.
  // Defense in depth against speculative-execution side channels.
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // We don't use the camera, mic, geolocation, or FLoC. Disable them all
  // so a compromised dependency can't quietly request them.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
