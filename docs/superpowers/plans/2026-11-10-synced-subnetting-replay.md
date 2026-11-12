# Synchronized Subnetting Replay Implementation Plan


**Goal:** Save future missed Subnetting tasks to the existing account and replay exact snapshots without changing scores.

**Architecture:** A narrow versioned domain model and Supabase RPC adapter sit above additive owner-scoped SQL storage. A separate replay view and guarded Home state keep original scoring isolated. The new feature fails explicitly unavailable until its database migration is installed.

**Tech Stack:** Existing Next.js/React/TypeScript, Supabase JS, PostgreSQL SQL/PLpgSQL, Vitest/Testing Library and installed PGlite. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-10-synced-subnetting-replay-design.md`

## Global Constraints

- Subnetting only, future incorrect normal checks only; old aggregate history is not replayable.
- No learner answer text/access code in snapshot storage; no aggregate score/streak write from replay.
- Max 100 records/account; eligibility expires after 90 days; on-access pruning; never extend creation time.
- Snapshot <=16384 UTF-8 bytes; prompt <=2000 chars; 1..40 solution steps each <=1000 chars; source 10.x.x.x and CIDR 17..30; version 1 / subnetting-v1.
- Safe account ownership, generation checks, idempotent live captures/resolution, no resurrection after clear/prune/eviction; no silent local fallback or write retry.
- Existing normal grading, AP2 behavior, authentication and unrelated modules remain unchanged.
- Production migration is not executed by this plan without project verification, safe deployment evidence and required authorization.

## Review Focus

- Hidden StudyCard Enter/N handlers can grade a normal task while the queue is active: prove inactivity and draft retention.
- A -> B -> A session races must not accept old response data: test a revision guard, not hash alone.
- Old idempotent save requests after eviction/clear must not recreate removed records: test rotated generations and duplicate-before-prune.
- Solution reveal followed by hide must remain assisted until a new replay session: test latched events.
- Missing migration and successful history save with failed aggregate write must never imply a successful synchronized score: separate status/error paths.

### Task 1: Versioned replay model, client adapter and additive SQL

**Files:** Create `src/app/lib/subnettingReplay.ts`, `src/app/lib/subnettingReplayApi.ts`, `src/app/lib/__tests__/subnettingReplay.test.ts`, `src/app/lib/__tests__/subnettingReplayApi.test.ts`, `src/app/lib/__tests__/subnettingReplayDatabase.test.ts`; create migration/rollback named in spec. Extract deterministic Subnetting calculation only if needed, preserving generator output semantics.

**Interfaces:** Use exact data/API shapes and RPC names in the spec. Export `createSubnettingSnapshot(question: Question): SubnettingSnapshotV1`, `parseSubnettingSnapshot(value: unknown): SubnettingSnapshotV1`, `createReplayQuestion(snapshot: SubnettingSnapshotV1, sessionId: string): Question`, `validateSubnettingReplayAnswers(snapshot: SubnettingSnapshotV1, answers: Record<string,string>): boolean`, record/state parsers, and API methods named in spec. Invalid model/API payloads throw sanitized typed errors.

- [x] Write failing domain tests for exact snapshots, six fields, boundary CIDRs, wrong keys/extra fields/oversized strings and bytes, coherence, strict IPv4/integer grading and fresh identities.
- [x] Run domain tests and observe expected missing-feature failures, implement the narrow model, then pass them.
- [x] Write failing API tests for exact RPC argument/response contracts, no local fallback, invalid credentials/payloads, missing RPC, transport error and sanitized error handling. Implement and pass them.
- [x] Write real PGlite database tests loading base schema plus migration, with synthetic roles/accounts; observe missing-migration failure. Implement transactional additive SQL and non-destructive disable rollback.
- [x] Prove owner separation, denied direct table/private helper access, invalid/foreign IDs, duplicate/mismatched captures, clear/generation/prune/eviction boundaries, resolve idempotence, no score changes, rerun and rollback.
- [x] Run all Task 1 tests and full suite, type/lint checks. Commit Task 1. Independent scoped review before Task 2.

### Task 2: Replay UI, capture and account-safe navigation

**Files:** Create `src/app/components/SubnettingReplay.tsx`, its tests, `src/app/lib/useSubnettingReplay.ts` if state orchestration warrants a focused hook, and `src/app/__tests__/subnettingReplay.integration.test.tsx`. Modify `page.tsx`, `StudyCard.tsx` and their tests only as needed.

**Interfaces:** Consume Task 1 exports. Add optional StudyCard replay presentation/interaction controls while keeping existing defaults untouched: inactive shortcuts, latched solution-reveal callback, controlled next/skip labels or visibility. Dedicated replay callback must never call Home's normal check/progress handler.

- [x] Add failing StudyCard tests for inactive Enter/N and controls, latched reveal/hide and new-session reset; implement the minimal optional contract and rerun old card/keyboard tests.
- [x] Add failing queue/replay tests: explicit states/help, exact prompt and blanks, retry same record, current incorrect/assisted/unassisted feedback, solved grouping, clear cancel/confirm and no random next task. Implement component.
- [x] Add failing Home integration tests for first wrong capture once, correct/skip/guest no capture, zero progress calls across every replay path, preserved inactive normal draft during queue inspection, AP2 cancel/confirm, return to explicitly normal question, and repeated open/close/focus.
- [x] Test eager login bootstrap, wrong checks before bootstrap success (explicit unsaved status, no later backfill), account A/B/A delayed loads/writes, unavailable migration, invalid server payload, stale generations, expiration/removal during active replay and bounded refresh behavior; implement session/request guards.
- [x] Run focused tests, entire suite, lint, types and build. Commit Task 2. Independent scoped review.

### Task 3: Documentation, release review and deployment boundary

**Files:** Update README and factual changelog. Add `database/README.md` with preflight, apply/verify/disable/re-enable steps, retention/privacy and production authorization boundary. Update plan execution notes.

- [x] Document database-first ideal rollout, graceful unavailable frontend-first behavior, existing-account trust boundary, what is stored/omitted, synchronized clear, on-access retention and future-only capture.
- [x] Document non-destructive rollback and exact production requirements. Discover eligible Supabase setup without claiming it is connected or requesting secrets in chat.
- [ ] Run final full suite, lint, types, build and diff check; perform permitted browser checks with synthetic data and disclose remaining hosted/mobile limits.
- [ ] Obtain fresh independent whole-branch review; fix material findings with failing regressions and rerun affected/full checks.
- [ ] Push feature branch, create ready-for-review PR under the user's explicit workflow, wait 15 minutes, inspect bot comments/checks and fix valid issues. Substitute independent review for unavailable bot review. Repeat 15-minute window after changes.
- [ ] Merge normally only when the exact current head is green and review findings are addressed/justifiably dismissed. Verify main/deployment; clearly distinguish code merged from database migration installed and actual account synchronization verified.

## Execution notes

- Existing dedicated cloud checkout at detached 5483fa7 was clean; remote main verified equal. Continue on a fresh feature branch in this workspace rather than creating an unrequested additional worktree or reinstalling already present dependencies.
- Prior-day unchanged baseline: 80 files / 1440 tests and 23 script contracts passed; lint had the existing AuthModal warning, TypeScript passed. New final evidence is still required after edits.
- Scope ruling: persist only first successful unassisted replay marker, not an unbounded retry log/count. The user chose synchronized replay, not detailed attempt analytics; this keeps writes naturally idempotent and storage strictly bounded.

- Task 3 documentation records the deployment boundary and a catalog-only runbook; the eligible production target was independently identified, but backup/recovery capability and migration authorization remain unverified. No production SQL was applied.
- Replay changelog entry is prepared as the 10/11/2026 UTC code release, with separate database setup explicitly required. Recheck the UTC date at merge and update the marker and test if it has changed.
- Local browser startup failed with `uv_interface_addresses` / `ERR_SYSTEM_ERROR`; the earlier hosted check covered signed-out guest desktop only. Authenticated two-session synchronization and hosted mobile acceptance remain outstanding.
