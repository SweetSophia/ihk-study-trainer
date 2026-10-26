# AP2 Troubleshooting Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans, followed by independent review.

**Goal:** Distinguish supported DNS/HTTPS evidence from unproven connectivity claims in one original incident.
**Architecture:** Pure stable-choice validators, dedicated client trainer, existing identity-keyed progress wiring.
**Tech Stack:** Existing React/TypeScript/Vitest; no dependencies.
**Spec:** Approved conversation design, summarized below.

## Constraints and scenario
One static fictional workshop incident. Approved client 10.20.30.24/24, gateway 10.20.30.1, DNS 10.20.30.53; actual local DNS override 10.20.30.99. Ordinary portal.werkstatt.test access fails resolution; .99 query times out; explicit .53 returns 10.20.40.10. HTTPS with pinned address preserving hostname/SNI/certificate validation returns HTTP 200. Four ICMP probes receive no reply. Same client/time; one interface, no VPN/proxy/alternate browser DNS. No post-change results supplied or real commands executed.
Objective sections: diagnosis plus four supported/unproven classifications; scoped profile restoration plus ordinary DNS and hostname HTTPS verification. First completed check per section/run counts, max two; prior example reveal makes only that section unscored. Reasoning is session-only self-assessment. Preserve all existing IDs/progress. No security, schema, dependency or account changes.

## Review focus
- Unknown/missing choices must fail, including unsupported outage claims.
- Repeat submissions and hidden revealed examples must not score again.
- Edits remove stale feedback; errors have accessible associations.
- Guest and identity changes preserve scoring/reset boundaries.
- Wording must distinguish a control result from ordinary access and proposed verification from an observed fix.

## Tasks
- [x] Add failing pure validator tests in lib/__tests__/troubleshooting.test.ts; implement lib/troubleshooting.ts with diagnosis/classification and correction/verification validators returning valid/errors.
- [x] Add failing component and page integration tests; implement TroubleshootingTrainer.tsx and ap2Troubleshooting catalog/routing/registry exclusion. Exercise correct/wrong/missing answers, reveal/repeat/reset/guest/identity and existing drill navigation.
- [x] Run focused/full tests, lint, types, build and desktop/mobile production browser flows. Independently review and fix validated issues.
- [ ] Publish ready PR; verify SHA/preview; wait >=15 minutes before bot assessment, and after any corrective push. Supplemental fresh review if bots unavailable. Normal expected-head merge only after verification and allowed repository checks; verify automatic production deployment.

## Verification before publication
831 tests / 48 files passed; lint, types and production build passed. Desktop/mobile Chromium flows passed against local production build, including full wrapping selected choices. Independent review found no substantive blocker. Hosted persistence/browser QA remain unverified; existing confetti CSP fallback warning unchanged.
