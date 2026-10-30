# Original SQL Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Native TDD with independent review before every push.

**Goal:** Repair SQL-1/3/5 in the original SQL trainer.
**Architecture:** Retain the loaded exercise/draft until replacement succeeds; use identity-scoped persistent status and the existing strict engine-error option at the caller.
**Tech Stack:** React, TypeScript, Vitest, existing PGlite grading contract.
**Spec:** docs/superpowers/specs/2026-10-29-legacy-sql-feedback-design.md

## Global Constraints

No dependency, backend, schema, new-family, worker or numeric-grading changes. Preserve IDs, progress and AP2 behavior. PR #58 remains held. This is an independent SQL-only branch on current main, without calculation-repair files or commits.

## Review Focus

- Rejected initial loading remains visible without an exercise.
- Failed replacement preserves draft and completed scoring protection.
- Engine failures do not invoke scoring callbacks; learner syntax errors still do.
- Old identity/request outcomes do not expose old feedback/exercises.
- Pending grading has a status message; replacement blocks grading until it settles.

### Task 1: Trainer feedback and state repair

**Files:** `components/SqlTrainer.tsx`, its existing component tests, and this design/plan.

- [x] Add initial/replacement failure, preservation, status and strict-caller regressions; verify RED.
- [x] Implement the minimal state/render/caller fix; verify focused GREEN.
- [x] Verify the isolated current-main base; full regression, lint, types, production build and synthetic desktop/mobile browser flows.
- [ ] Independent actual-code review of the final commit before push; fix valid findings with regression tests.
- [ ] Publish Ready PR; record exact head/preview and wait 15 real minutes after publication/every push. Assess all feedback, substituting a fresh independent review for unavailable bots.
- [ ] Publish a bilingual assessment. Merge/deployment remain subject to current action authorization and holds; never bundle another unmerged repair to bypass a denial.

## Local ledger

Five new regressions failed before implementation; 26 component tests then passed. Independent review found absent pending-check status. A deferred-promise regression failed; the minimal informational status fix made 27/27 tests pass. The reviewer inspected that correction and found no further issues.

The private local browser harness uses the actual component and synthetic service/engine fixtures. Desktop/mobile checks cover error visibility, draft retention, technical-versus-learner scoring, repeated success, replacement reset, identity transition, Enter and overflow. It is not live-account, AI, WASM or hosted persistence proof. Harness files remain outside Git. Final verification/publication evidence is recorded separately.

Final isolated-base verification: 1,017/1,017 tests across 61 files (192.14s), lint, explicit types and production build passed. Final desktop1440/mobile390 harness used this branch’s own production stylesheet and passed all flows above; no accounts or external services contacted. Main/base remains3868890; calculation repair is excluded.
