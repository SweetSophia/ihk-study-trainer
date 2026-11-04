# Trainer Fairness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native execution and independent whole-branch review follow the adopted autonomous workflow.

**Goal:** Accept technically valid cable alternatives and remove confirmed RAID/knowledge wording ambiguity.
**Architecture:** Rate-specific cable catalogue plus a selected-medium input contract shared by StudyCard and validation. RAID and knowledge fixes remain local teaching text changes.
**Tech Stack:** Existing React/TypeScript/Vitest/Playwright; no new packages.
**Spec:** `docs/superpowers/specs/2026-11-04-trainer-fairness.md`

## Global Constraints
Preserve IDs, stored progress, numerical tolerance, AP2 flows and attempt/reveal policy. No PR #58 changes. Money policy is deferred.

## Review Focus
- Properties that do not apply to the selected medium must fail; shared true properties remain valid for every applicable medium.
- Unsupported speed/range/EMI or RG-6 cannot become a fallback answer.
- Medium changes clear dependent reasons without recording a check.
- RAID10 guaranteed versus possible failures cannot be confused in prompt or visualizer.
- HTTPS qualification must reach both generation directions; no universal transport loosening.

### Task 1: Cable contract
Files: `generators/cables.ts`, `generators/registry.ts`, `types/index.ts`, new `lib/cableAnswerContract.ts`, `lib/answerValidation.ts`, `components/StudyCard.tsx`; focused generator/component tests.
Interface: `findSuitableCables(distance,speed,environment,cableTypes?)`; `findBestCable(...)` throws if none. Question `cableChoices` carries all offered type/pros; generator `eligibleCableTypes` supplies the accepted medium list. `getCableAnswerInputs(question,answers)` resolves reason accepted values/options for selected cable.
- [x] Add and run red tests for 40m/10G Cat6, rate-specific boundaries, incompatible media/reasons, duplicate reasons and no capable fallback.
- [x] Implement catalogue and shared selected-medium contract; preserve recommendation as example.
- [x] Add/run UI red regression for clearing old reasons, labelled controls, single check callback; implement UI wiring.
- [x] Run focused tests green.

### Task 2: Precise teaching contracts
Files: `generators/raid.ts`, `components/RaidVisualizer.tsx`, `generators/ports.ts`, `generators/cloud.ts` and their tests.
- [x] Add/run red tests for guaranteed-before-rebuild RAID prompt/label/explanation, both HTTPS directions and term/payment wording.
- [x] Apply minimal text changes; keep arithmetic and answer keys unchanged.
- [x] Verify mirror-pair examples and non-HTTPS strictness; run focused tests green.

### Task 3: Final verification and publication
- [x] Full Vitest, lint, types, production build; production desktop/narrow guest browser checks.
- [x] Independent actual-code review; fix only validated scoped findings and rerun affected verification.
- [ ] Commit/push after independent review, create Ready PR; capture exact SHA/time/preview.
- [ ] Real 15-minute review window after every push, read all feedback, independently replace unavailable bots. Normal merge only if authorized and protections allow; verify production.

Self-review: all spec requirements map to tasks. Shared contract avoids a UI/grader divergence; no persisted schema changes. Money acceptance is explicitly excluded pending the decision.

Final local evidence: 1,296 tests / 75 files pass; lint 0 errors / 1 pre-existing AuthModal hook warning; tsc --noEmit and production build pass. Chromium guest flows pass at 320/390/1440 px with both themes and no writes. Independent review verified 56 cable/scenario, 150 RAID and 60 port/direction combinations; its unsuitable-medium submission finding was fixed and regression-tested.

Correction review: bind reasons to scenario rate, require two distinct advantages uniformly, reject malformed metadata without inputs, bind RAID possible-count text to generated 4/6/8-disk examples, unify guarantee labels/singular wording; retain distractors and exact supported rate matching. Re-run final checks and independent review before corrective push, then reset 15-minute window.
Correction verification: 1,302 tests / 75 files pass, plus the final 31-test fairness file after sharpening its current-distractor assertion. Lint 0 errors / the same pre-existing warning; explicit type-check, production build and 320/390/1440 px guest checks pass. Fresh independent review checked 12,600 cable/reason combinations and found no remaining product-code blocker. Initial bot round: Sourcery3 and Kilo17 claims dispositioned; Kody completed enabled checks without findings (business logic disabled). Hosted preview browser remains blocked by ERR_TUNNEL_CONNECTION_FAILED; deployment status success does not establish hosted interaction/persistence.

### Late Kilo correction (review 2026-11-04 14:59 UTC)
- [x] Red regressions: visible rate/reach scope and property labels; two same-rate profiles with a shorter first entry; kilometre spelling in options, grading and catalogue.
- [x] Minimal fix: ask for scenario-relevant properties, retain stable reason keys/distractors; use one covering-profile matcher for suitability and property generation; format long profile reaches as km.
- [ ] Focused + full tests, lint/types/build, updated production guest browser flow; independent actual-code review before push. Fresh full15-minute window after push. PR83 merge remains explicitly held after prior denial; no retry without new authorization. Money policy and PR58 untouched.

Late-correction local verification: 1,305 tests/75 files pass, lint0 errors/1pre-existing AuthModal warning, explicit types/build pass. Production Chromium guest checks at320/390/1440 pass, including OS2km-property submission, field reset and no writes. Fresh independent actual-code review:34focused tests and12,600 answer combinations pass; no blockers. Merge hold remains in force; no retry attempted.

### Correction review15:43UTC
Two general medium properties already grade correctly; clarify that explicitly without forcing one profile plus one generic property. Accept all covering same-rate profiles in future repeated-profile catalogues; extend the shorter-first regression with two covering profiles. Browser guard negative control on308a173 unexpectedly passed when OS2 checking was blocked: wait for the old verdict to detach before new submission and prove the negative control fails. RNG-constant consumption claim is incorrect; fibre table is currently accurate, future deduplication optional. No generic parser/renderer/recommendation refactor.
Correction15:43 verification:1,305tests/75files pass; lint0errors/1pre-existingwarning,types/build pass. Browser positives320/390/1440 pass. Negative control deliberately removes OS2submission: old guard falsely passed, fixed guard reaches blocked marker then fails waiting for fresh success. Independent review12,600current cases plus20duplicate-rate boundary cases/34focused tests, no blocker. Public assessment posting remains denied; no retries. Merge remains held.
