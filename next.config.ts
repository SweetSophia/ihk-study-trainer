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

const isDev = process.env.NODE_ENV === 'development';

// Derive the Supabase host(s) to allow in connect-src. Cloud Supabase uses
// *.supabase.co; self-hosted / local CLI dev (http://localhost:54321)
// override via NEXT_PUBLIC_SUPABASE_URL.
function deriveSupabaseHosts(envUrl: string | undefined): string[] {
  if (!envUrl) return ['https://*.supabase.co', 'wss://*.supabase.co'];
  try {
    const { host, protocol } = new URL(envUrl);
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    return [`${protocol}//${host}`, `${wsProtocol}//${host}`];
  } catch {
    return ['https://*.supabase.co', 'wss://*.supabase.co'];
  }
}

const supabaseHosts = deriveSupabaseHosts(process.env.NEXT_PUBLIC_SUPABASE_URL);

const ContentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-eval' is dev-only (Next HMR). Production pre-compiles bundles;
  // framer-motion + Tailwind v4 inject inline styles, not eval. Removing
  // 'unsafe-eval' from prod tightens XSS defense.
  // 'unsafe-inline' stays (removing it needs nonces — out of scope here).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // PGlite generates its data as a Blob; 'self' + 'data:' cover
  // self-hosted + inline-image use cases. Speculative future image-gen
  // (IMPROVEMENT_PLAN.md) must add a specific CDN origin when it lands —
  // do NOT reintroduce a wildcard.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Supabase (REST + realtime WebSocket) and Groq (OpenAI-compatible API).
  // Supabase hosts derive from NEXT_PUBLIC_SUPABASE_URL so self-hosted /
  // local CLI dev (http://localhost:54321) works without editing this file.
  `connect-src 'self' ${supabaseHosts.join(' ')} https://api.groq.com`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Prevent mixed-content downgrades (HTTP subresources on HTTPS pages).
  // UAs ignore this directive on plain-HTTP origins, so local dev is fine.
  "upgrade-insecure-requests",
].join('; ');

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
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
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
