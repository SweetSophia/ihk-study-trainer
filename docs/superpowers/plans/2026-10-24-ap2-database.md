# AP2 Database Design Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task with TDD and independent final review.

**Goal:** Original guided modeling and executable SQL scenario for an IT inventory.
**Architecture:** Dedicated trainer, fixed content and two deterministic fixtures, existing SQL grader behind a disposable Web Worker. Existing progress callbacks with per-task first-check semantics.
**Tech Stack:** React, TypeScript, PGlite, Vitest, Next.js, Playwright.
**Spec:** Approved conversation design, 2026-10-24: self-assessed devices/locations/maintenance modeling; ordered active-device SELECT, zero-inclusive maintenance counts, constrained retirement UPDATE.

## Global Constraints
- Preserve PR58, existing modules, grading semantics, stored progress and security headers.
- New module ap2DatabaseDesign; guests may practice. No schema migration or AI generation.
- Modeling/rubric session-only; no automatic modeling score. Alternatives welcome.
- First completed objective check per task/run counts; prior solution reveal disables that task's score. Cancellation/infrastructure failures do not count.
- New workers use synthetic fixtures only; cancellation and deadline terminate the worker.
- No publication, merge or deployment.

## Review Focus
- Edits/reset/unmount/auth changes during evaluation must not apply stale results or scores.
- Duplicate clicks and repeated checks must not duplicate progress.
- Long-running SQL must be killable without UI freeze.
- Zero related rows, duplicates and sort ties must distinguish incorrect SQL.
- Wrong mutations and collateral writes must fail independently of returned rows.

### Task 1: Scenario and semantic grading
- [x] Write failing tests in src/app/lib/__tests__/databaseScenario.test.ts for reference/alternative queries and incorrect order/count/update against two fixtures.
- [x] Implement src/app/lib/databaseScenario.ts: task definitions, fixture SQL, gradeDatabaseTask(taskId, query).
- [x] Run focused tests; preserve gradeSqlAnswer behavior unchanged.

### Task 2: Worker lifecycle
- [x] Write failing tests in src/app/lib/__tests__/databaseWorkerClient.test.ts for result, error, abort, timeout, cleanup.
- [x] Implement database.worker.ts and databaseWorkerClient.ts; terminate on every outcome. Deadline 30 seconds. Return correct/incorrect only for completed grading; reject infrastructure errors.
- [x] Run focused worker tests and real production worker browser checks.

### Task 3: Trainer and integration
- [x] Write failing DatabaseDesignTrainer component tests for scoring/reveal/reset/edits/async cancellation and reasoning separation.
- [x] Implement session-only model/rubric/example and three task cards with supplied schema, textarea, check/cancel and accessible feedback.
- [x] Register module and dedicated page branch; keep old IDs and progress mapping unchanged. Key trainer by identity to cancel on account changes.
- [x] Run focused tests and fix registry expectations if necessary.

### Task 4: Final verification and review
- [x] Full npm test, npm run lint, npx tsc --noEmit, npm run build, git diff --check.
- [x] Production browser desktop/mobile, keyboard labels/status, real SQL correct/incorrect, edits, reset, repetition, cancellation and worker timeout.
- [x] Independent whole-diff review; fix valid findings with regression coverage.
- [x] Commit locally, report SHA and evidence; no push or PR.


## Execution ledger
- Baseline: 730 tests / 34 files passed on main b41be60.
- Task 1: real PGlite reference/alternate queries and wrong order/count/update tests passed; added adversarial second-fixture, zero-count, cutoff and write checks.
- Task 2: fake-worker boundary tests verify termination on completion/error/abort/deadline. Real production Chromium successfully executed the bundled worker with unchanged CSP.
- Task 3: first-check scoring, edits, reveal-during-check, repeated checks, cancel/reset/unmount and guest behavior covered. New module integrates without changing existing IDs.
- Independent review: one Important finding: shared grader classified engine traps as wrong answers. Reproduced RED with WebAssembly.RuntimeError; opted-in SQLSTATE classification fixes new scenario while preserving existing trainer behavior. Regression plus existing grader: 23 passed.
- Ruling: use sibling worktree to leave parked PR58 checkout and ignore rules unchanged.
- Ruling: retain existing AI trainer grading default; new scenario opts into unscored infrastructure failures. Avoids unrelated behavior change.
- Verification issue: unbounded concurrent tests/build caused an existing network integration test to exceed 5s (754 passed, 1 timeout); rerun full suite with maxWorkers=2 rather than weakening tests.
- Dependency symlink rejected by Turbopack; copied existing installed dependencies into isolated worktree without dependency version changes.


## Final evidence
- Full regression: `npm test -- --maxWorkers=2` — 756 passed, 39 files, 151.57s.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` passed.
- Production Chromium at 1440px and 390px: all three SQL tasks including equivalent count query, incorrect answer, stale feedback reset, cancellation, repeat/keyboard checks, reset and navigation interruption; no page/CSP errors or horizontal overflow.
- Real 30-second timeout with `SELECT pg_sleep(60)` followed by a successful new check verified on desktop. Worker termination also covered by unit tests.
- Independent review finding fixed and covered by failing-then-passing infrastructure regression. No other substantive review findings.
- Live Supabase persistence and real mobile hardware were not exercised. Integration uses mocked auth/progress services; browser flows use guest mode. Fixture equivalence is not a proof for all data; client scoring guards are not durable server-side attempt deduplication.
- Work retained on local feature branch only; no publication, PR, merge, deployment or PR58 modification.

## Approved review repairs (2026-10-24)
- SQLSTATE 25006 is a learner error; typed learner errors replace message-prefix control flow. Engine failures remain unscored in this module and retain legacy default behavior elsewhere.
- Progress snapshots are guarded by request order and active identity; logout invalidates in-flight reads and old-identity callbacks.
- Worker construction failures receive safe German feedback; task outcomes have distinct labels/styles; model disclosure has show/hide labels and control linkage.
- Guest-login reset is explicitly disclosed. Timeout wording explains browser scheduling limitations and does not claim memory containment.
- Regression additions: completed guest no-score, nonzero worker payload, constructor failure, read-only SQL violation, legacy engine trap, stale progress replies across logout/login, feedback and disclosure.
- Independent repair review: no substantive findings. Full suite: 763 passed / 39 files (`npm test -- --maxWorkers=2`); lint, types, production build and diff checks passed. Production Chromium 1440/390 checks passed for warnings, keyboard disclosure, SQLSTATE25006 feedback, recovery, cancellation, reset and unchanged CSP.
- Deferred by approved scope: caching, randomized/hidden fixtures, memory containment redesign. Resource exhaustion remains a browser-local risk; no hard memory bound claimed. Live Supabase and physical-device background suspension remain untested.
