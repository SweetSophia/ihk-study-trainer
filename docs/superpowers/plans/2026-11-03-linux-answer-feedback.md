# Linux answer alternatives and feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native implementation, independent actual-code review before every push under the user's autonomous workflow.

**Goal:** Accept curated valid Linux tool alternatives and explain checked answers without pretending to parse or execute shell commands.
**Architecture:** Extend generator metadata and reuse it consistently in both question directions. Pass display-only explanation and accepted forms into the existing terminal; leave shared grading/progress contracts untouched.
**Tech Stack:** Existing TypeScript/React/Tailwind/Vitest/Playwright, no new dependency.
**Spec:** `docs/superpowers/specs/2026-11-03-linux-answer-feedback-design.md`

## Global Constraints
- Stable linux module ID and existing grading/progress/reveal policy; no shared validator or storage changes.
- Explicit curated forms, normalized recognition only. No first-token parsing, arbitrary execution, new task families, backend/security changes or #58 changes.
- Independent code review before each push; Ready PR and real 15 minutes after every push; no bypasses or formal GitHub approval.

## Review Focus
- Generic and specific capabilities are directional, never inferred symmetric equivalence.
- Multiword required subcommands and literal operators remain exact normalized forms.
- Accepted alternative feedback must not imply it uses the canonical tool's flags.
- Repeated Enter/button presses and replacing a question must not retain verdicts or duplicate attempts.
- Polite results/focus indicators and long accepted lists remain usable at narrow widths in both themes.

## Task 1: catalogue and nonconflicting choices
**Files:** `src/app/lib/generators/linux.ts`, its existing `__tests__/linux.test.ts`.
**Interfaces:** generator returns existing inputs/expected answer plus optional display-only `answerExplanation: string`; accepted command-form helper internal only.
- [x] Add deterministic table regressions for the 14 spec rows, named negative controls and all-entry invariants in both directions. Known overlapping descriptions must be accepted and excluded from wrong choices. Run focused tests, observe false-reject/distractor failures.
- [x] Add curated metadata, narrow intended prompts and correct nice/awk teaching copy. Factor one internal supported-form helper to drive reverse answers and dropdown relationship filtering. Retain five unique choices and canonical answer.
- [x] Run focused generator/validator tests; expected all pass, no broad parser behavior introduced.

## Task 2: transparent terminal feedback and state
**Files:** `src/app/lib/generators/registry.ts`, `src/app/types/index.ts`, `src/app/components/StudyCard.tsx`, `LinuxTerminal.tsx`, new real-component Linux learning test.
**Interfaces:** optional Question `answerExplanation?: string`; LinuxTerminal receives `acceptedAnswers?: string[]` and `answerExplanation?: string`. These are display-only; onCheckAnswer remains authoritative.
- [x] Write real StudyCard/LinuxTerminal tests for alternative success, rejected wrong/prefixed input, visible curated forms/canonical explanation, stable status/instruction association, reset on next/replacement, repeated checks and retained navigation/appearance behavior. Observe relevant RED failures.
- [x] Add metadata wiring and accessible checked feedback; qualify example/explanation, explain recognition-only input, keep callbacks/state policy. Add no parser or scoring rule.
- [x] Run focused UI/generator tests, expected pass. Update README and existing changelog narrowly for the actual behavior.

## Task 3: final verification and review workflow
**Files:** bounded local production browser guard; spec/plan and current docs/tests only.
- [x] Run full tests, lint, type-check and production build. Use local production browser checks at desktop/narrow widths/both themes including genuine accepted/incorrect submissions, reset/repetition and accessibility/focus. No live credentials.
- [ ] Independent fresh whole-branch actual-code review against spec and Review Focus; fix confirmed defects RED→GREEN and affected verification. Commit and independently review final actual changes before push.
- [ ] Push/verify SHA, open Ready PR, record UTC ready time, real 15-minute review window; inspect all paginated comments/reviews/threads and permitted statuses. Fix valid findings with pre-push review/reverification/new full window; independently supplement unavailable bots, do not retrigger quota failures.
- [ ] Normal expected-head merge only with applicable authority/protections and green relevant checks. Verify remote main tree and automatic deployment terminal status; guest live smoke only through permitted route, accurately disclose tunnel/hosted persistence limitations. Stop denied action, report exact reason/state.

## Self-review
All spec decisions map to the three tasks. Task1's optional display metadata is consumed by Task2, which never changes grading. The supported-form helper stays inside the generator. Shared code changes are confined to passing display-only props. Five Review Focus cases have concrete regression/browser checks; no new user scope decision is required. General full-command parsing remains a recommendation for separate design, not an implementation task.

## Local verification record
74 files / 1,266 tests passed; focused generator/validator/real-component set83passed. Type check and production build passed. Lint exited0 with no errors and one preexisting AuthModal fallback-ref warning; that file is unchanged from main. Production Chromium320/390/1440 passed both palettes, genuine valid/invalid cases, required subcommands, feedback reset, single status, focus indication and guest no-write checks. Screenshots inspected. Fresh independent whole-branch actual-code review found no Important/Critical issue. Hosted browser/persistence and actual screenreader/device-keyboard coverage are not claimed. Ready publication/review windows/merge/deployment remain pending in the local ledger.
