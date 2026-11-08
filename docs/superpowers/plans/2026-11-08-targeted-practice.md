# Targeted Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Let learners choose a topic from transparent lifetime attempt statistics instead of automatically jumping to the largest lifetime error count.

**Architecture:** Derive read-only, canonical topic summaries in a small helper. A focused TargetedPractice component owns an inline disclosure inside ProgressDashboard and invokes Home's existing module navigation only after an explicit selection.

**Tech Stack:** Existing Next.js, React, TypeScript, Tailwind, Vitest and Testing Library; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-08-targeted-practice-design.md`

## Global Constraints
- Preserve grading, scoring callbacks, storage, totals and question generation.
- Use the complete saved aggregate history, not a recent window.
- No question replay, spaced repetition, new persistence or readiness prediction.
- 1–4 scored attempts are a small sample; 5 is only a display threshold.
- Keep the existing AP2 training-run departure confirmation and active-module draft preservation.

## Review Focus
- Legacy and current aliases must merge without mutating source rows (Task 1).
- Zero attempts, perfect scores and retired/unknown/composite history must not create misleading percentages or automatic choices (Tasks 1–2).
- Equal rounded rates must sort on unrounded ratios; low samples must not displace larger samples (Task 1).
- Escape, repeated opening, mobile collapse and selecting the current topic must retain exercise inputs and usable focus (Task 2 and browser check).
- AP2 cancellation, account change and progress refresh must not leak selection or write additional attempts (Task 2).

### Task 1: Derive selectable topic statistics
**Files:** Create `src/app/lib/targetedPractice.ts` and `src/app/lib/__tests__/targetedPractice.test.ts`.
**Interfaces:** Consume `ProgressLike[]` and existing module catalogue/normalizer. Produce `getPracticeTopics(progress: ProgressLike[]): PracticeTopic[]`; each entry has `module: ModuleId`, `attempted: number`, `correct: number`, `accuracy: number`, `lowSample: boolean`.
- [x] Write unit tests for merged aliases (2/3 + 1/2 = 3/5), nonmutation, unknown/prototype-like IDs, retired mixed history, AP2-run exclusion, 0 versus 1/4/5 attempts, perfect records, ratio and deterministic tie order.
- [x] Run `npx vitest run src/app/lib/__tests__/targetedPractice.test.ts`; expect missing-helper failure.
- [x] Implement the helper. Use catalogue membership, normalize aliases, require positive attempts, separate samples under 5, sort by raw ratio and then attempt count.
- [x] Rerun the focused test; expect all tests passing. Commit helper and tests.

### Task 2: Add accessible selection and preserve navigation
**Files:** Create `src/app/components/TargetedPractice.tsx` and its test. Modify `ProgressDashboard.tsx`, `page.tsx`, dashboard/navigation/calculation integration tests and other existing tests querying the renamed action.
**Interfaces:** `TargetedPractice({ progress: ProgressLike[], onSelectModule: (module: string) => void })` consumes Task 1. ProgressDashboard accepts `onSelectModule` instead of the automatic callback. Home supplies its existing handler.
- [x] Write failing tests for explicit choice, displayed attempts/rate, small-sample grouping, empty/perfect history, opening/closing focus, Escape, repeated opening and updates without selection.
- [x] Update integration contracts to require topic choice, preserving SQL/AP2 navigation, current draft, AP2 cancellation/confirmation and account reset. Opening never calls grading/storage or SQL generation.
- [x] Run focused component and integration tests; expect missing selector and obsolete automatic behavior failures.
- [x] Implement disclosure and wire it to existing navigation. Focus the opener before selecting so departure cancellation can return there. Key the dashboard by account. Rename total label to scored attempts, keeping the total unchanged.
- [x] Rerun focused tests; expect all passing. Commit selection and tests.

### Task 3: Explain counting and verify release
**Files:** Update `README.md`, `src/app/lib/changelog.ts`; create a local-only guarded browser smoke script if needed.
**Interfaces:** No new runtime interface.
- [x] Document lifetime scope, 1–4 display warning, and standard/SQL/AP2 counting differences without readiness claims. Update release notes with actual date.
- [x] Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`; expect exit 0. Distinguish existing warnings from failures.
- [ ] Run local production browser checks at desktop/mobile sizes for keyboard open/close, explicit choice, AP2 interruption and no overflow; use synthetic local progress only and block external writes.
- [x] Inspect final diff, obtain independent review, fix valid issues with failing regression tests, rerun affected/full checks and commit.
- [ ] Push feature branch, create ready PR, allow 15 minutes after each push for bot feedback. Fix valid feedback; use independent substitute review if a bot is unavailable.
- [ ] Verify exact-head checks, merge normally only when green, then verify main and production deployment. Report any exact blocker instead of bypassing it.


## Execution notes
- Implementation and focused regression checks completed in order. Independent review found no correctness/storage blocker and one keyboard-focus defect when a topic moved from 4 to 5 attempts. A failing regression reproduced it; a single keyed list now keeps the focused button mounted, and the regression passes.
- The initial unrestricted-parallel baseline showed timeouts in TrainingRun and networkPlanning integration. Both pass with bounded worker concurrency; final full-suite verification uses two workers.
- Browser acceptance is blocked in this executor: Chromium cannot create its required socket (`Operation not permitted`), and the supported cloud browser cannot reach the local production preview (`ERR_CONNECTION_REFUSED`). No browser security/sandbox settings were changed. Desktop/mobile layout and real-browser interactions remain unverified here; component/integration tests are not a substitute for those checks.
- No schema, storage, scoring or exercise-generator changes. No deferred review findings after the focus fix.
- Final verification: `npm test -- --maxWorkers=2 --reporter=verbose` passed 80 files / 1,438 tests, plus 23 script contracts. TypeScript and production build passed. ESLint passed with the existing AuthModal exhaustive-deps warning only. Real-browser acceptance remains blocked as described above.
