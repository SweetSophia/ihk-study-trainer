# AP2-Trainingslauf Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; independent actual-code review before every push.

**Goal:** Combine three unchanged AP2 exercises into a session-only run with retained navigation and honest combined feedback.
**Architecture:** Mounted hidden trainer panels, optional objective events, immutable first-attempt summary, existing per-topic progress callbacks.
**Tech Stack:** Existing React/Next/TypeScript, Vitest/Testing Library and local Chromium.
**Spec:** `docs/superpowers/specs/2026-10-29-ap2-training-run-design.md`

## Global constraints

No backend/schema/dependency change, credentials, arbitrary builder, exam equivalence, PR58 changes or merge/deployment. Existing IDs, standalone graders and first-check/reveal/guest rules stay intact.

## Review focus

- Navigate after wrong/correct/revealed checks: state retained and no duplicate progress writes.
- Guest check followed by identity transition: whole run resets with explicit prior warning.
- Edit after summary: latest result clears, first check remains fixed.
- Hidden panels and narrow viewports: no hidden focus targets, overflow or ambiguous announcements.
- Restart and leave/reload: explicit session loss; stored aggregate progress is not erased.

## Task 1 — run and trainer event integration

Files: new `lib/trainingRun.ts`, `components/TrainingRun.tsx`, optional contracts in CostComparisonTrainer, TroubleshootingTrainer, BackupRecoveryTrainer; real component tests in `components/__tests__/TrainingRun.test.tsx`.
Interfaces: optional `trainingRun.onEvent({section,type,correct?})`; original `onAttempt(correct)` stays sole scoring callback; wrapper `onAttempt(module,correct)` forwards each eligible first attempt only. Pure reducer keeps immutable first-check and current result.
- [x] Write real-trainer tests for navigation/reveal/retry/rubric/reset/summary; run RED.
- [x] Implement optional events and wrapper; run focused tests GREEN.

## Task 2 — page, navigation, docs and acceptance

Files: page.tsx, modules.ts, generator registry exclusions and existing registry tests; new page integration test; README counts and session behavior.
- [x] Add failing page test for original topic IDs, no wrapper write, guest-to-account reset and persistence failure.
- [x] Register dedicated module and wire existing recordProgress; update README six/seven/count inconsistencies and new run description.
- [x] Run focused tests and one final full regression, lint, types and production build. Check desktop/mobile real UI, repeated/interrupted navigation, reset and reload locally with synthetic data.
- [x] Independent whole-branch source review; fix validated issues with RED→GREEN regression tests and repeat affected verification.
- [ ] Commit, review before push, publish ready PR and summary. Real 15-minute wait after ready/every corrective push, classify all paginated feedback; fresh independent substitute for unavailable bots. Report exact head/checks/windows; stop before merge.

## Ledger

Base: 671c1981bf77b8972f6928224c9ca75dc00fc355. Fresh isolated worktree `/workspace/ihk-training-run`. No repository AGENTS.md or relevant local skills found. Existing approved workflow permits native implementation choices without another design gate.

Task 1 complete: initial real-component skeleton produced seven behavioral failures; event/panel integration made them pass. Focused integration (44 tests) passed; four additional reveal/current-result checks passed (11 run tests total). Builder check found no missing decision. Task 2 implementation complete. Lint, explicit types and production build pass; local desktop1440×900/mobile390×844 production flows passed with all external requests blocked, synthetic local identity only. Initial concurrently scheduled full verification was interrupted after timing-only failures in new run integration and existing network integration; both passed in an isolated single-worker rerun (4/4). Final full suite uses one worker, unchanged assertions/time budgets. Independent actual-source branch review found no product blocker.

Final verification: `npm test -- --maxWorkers=1` passed 978/978 tests in 58 files (422.09s), with unchanged assertions/timeouts. Lint, explicit tsc and production build exit0. Local production Chromium desktop/mobile passed, and independent source review found no product blocker.

Pre-merge visual correction: desktop screenshot exposed new card's title/description outside the existing 112px card (children381..519 versus card394..506). Native browser bounds assertion reproduced RED. Added only compact `AP2-Lauf` label and `Drei Szenarien` description; canonical name/ID unchanged. Rebuilt bounds assertion GREEN and full desktop/mobile flow rerun passed. Affected integration/registry/selector tests 39/39, lint/types/build green. Independent actual-code delta review approved before push. Core 978-test verification remains at initial51fd525; final affected checks cover the display-only delta, no weakened assertions/timeouts. Parent forwarded explicit user merge+publication approval at12:33:19UTC; normal merge is authorized only after final review/check/window gates. PR58 remains held.
