# Exact RAID Capacity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exact theoretical RAID capacity with equivalent decimal GB/TB answers preserved.
**Architecture:** One opt-in field rule and an exact bounded decimal-to-byte parser; existing shared grading and progress contracts stay intact.
**Tech Stack:** Existing TypeScript/React/Vitest/Playwright, no new dependencies.
**Spec:** `docs/superpowers/specs/2026-11-06-raid-capacity-design.md`

## Global Constraints
- Preserve module ID `raid`, answer keys, history, formulas, fault tolerance and all untagged grading.
- Only GB/TB, decimal 1000 conversion; theoretical capacity before filesystem overhead, no hot spares.
- No account actions, production data/configuration changes, or changes/merge/closure of held #58.

## Review Focus
- Equivalent representations must agree without floating-point aliasing: comma/exponent/zero suffixes.
- Reject plausible wrong units and near-neighbor/sub-byte quantities rather than accepting 5%.
- Bound hostile exponents and reject inherited object keys without allocations proportional to exponent.
- Preserve generic conversion tolerance and cent-accurate money grading.
- Real form/progress wiring must match validator results, with no reveal/repeat writes.

### Task 1: Exact byte grading and visible teaching rule
Files: create `src/app/lib/storagePrecision.ts`, `src/app/lib/__tests__/raidCapacity.test.ts`; modify `src/app/types/index.ts`, `src/app/lib/answerValidation.ts`, `src/app/lib/generators/raid.ts`.
Interface: `parseDecimalStorageBytes(raw?: string|null, unit?: string|null): number|null`; tagged `numericRule: 'decimalStorageBytes'` compares byte integers with required valid units.
- [x] Add literal and generated-question regressions; run red against existing 5% grading.
- [x] Implement bounded exact parser, validator branch and RAID-only metadata; state decimal/theoretical/no-overhead assumptions and exact grading in question/solution.
- [x] Run focused tests, including complete numeric grammar, range, signs and sub-byte neighbors; preserve unrelated rules.

### Task 2: Integration, documentation and final verification
Files: modify `src/app/__tests__/calculationSeparation.integration.test.tsx`, `scripts/check-fairness.mjs`, `README.md`, `src/app/lib/changelog.ts`, welcome changelog tests as needed; narrowly clarify legacy untagged-storage test wording.
- [x] Test synthetic guest/signed-in RAID form flows, both units, next/repeat/reveal and stable progress ID.
- [x] Extend existing local browser guard for exact RAID grading and unit/keyboard/accessible feedback checks; do not alter unrelated cable checks.
- [x] Update factual docs/release marker with current UTC shipping date; no live-persistence claims.
- [x] Full tests, lint, explicit type check, production build, fresh-server browser320/390/1440 and independent actual-code review before push.
- [ ] Ready PR, verify exact remote SHA/preview; real15min after each push, triage findings, fresh independent substitute for unavailable bots. Normal merge only with authorization/rules; observe automatic deployment.

## Other two user-requested tracks
- Live production GET in fresh Chromium profile currently fails ERR_TUNNEL_CONNECTION_FAILED before application load. No sign-in/account/progress writes; do not infer an application outage. Real synchronization requires separately approved normal test-account actions and two independent browser profiles; no Supabase admin keys.
- #58 read-only: compare both changed files/content/tests to current main, report unique missing work and safe cleanup recommendation. Do not alter or close it.

## Verified implementation record
- Initial 44-case regression run: 19 failures against old tolerance/no metadata, then green. Final RAID file has45cases including byte/range limits. Disabling the new rule makes both UI/progress integration cases fail; mutation restored.
- Initial full run had one stale test deliberately accepting a +4% RAID answer. Updated only that RAID policy assertion, retained equivalent-unit checks and unrelated measurement tolerances. Final full run: 1,427/1,427 Vitest tests in78files plus23Node contracts pass.
- Lint: zero errors, one existing AuthModal ref warning. Explicit types and production build pass.
- Local production browser `IHK_TEST_URL=http://127.0.0.1:3149 CHROMIUM_PATH=/usr/bin/chromium node scripts/check-fairness.mjs`: 320/390/1440px pass including wrong-by1GB rejection, equivalent32000GB acceptance, input-focusedEnter, freshfeedback, labeledunits, both themes and no guestwrites/progressstorage/overflow/pageerrors. These are Chromium simulations, not physicaldevice or screenreader tests.
- Independent actual-code pre-push review: no blockers/major/minors; 50,000parsercases matched independentBigInt oracle and3,030generatedRAID configurations agreed. Narrow stale-policytest update separately reviewed without findings.
- Hosted productionGET still fails ERR_TUNNEL_CONNECTION_FAILED beforeapp loads. No accountactions, secrets or liveprogresswrites. Live synchronization requires separately approved normal testaccount actions plus demonstrably successful RPCs and independentbrowserprofiles; fallback-only success is insufficient.
- Held#58 fully inspected read-only: only oldchangelog/test changes, corehistory and testgoals superseded bycurrentmain; no uniqueproductcode. Recommend closingassuperseded afterspecificapproval, preservinghistory. No change toitsbranch/status/metadata.
