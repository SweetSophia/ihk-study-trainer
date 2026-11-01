# Calculation Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve explanations, post-error learning guidance and variety within the three existing pure calculation drills.
**Architecture:** Reuse the arithmetic engine and validator; add pure grouped learning content and optional per-question hint metadata, rendered by existing StudyCard. No new scoring or persistence flow.
**Tech Stack:** Existing TypeScript/React, Vitest/Testing Library, Next.js and Playwright.
**Spec:** `docs/superpowers/specs/2026-10-31-calculation-learning-design.md`

## Global Constraints

Preserve stable IDs/keys/16-15-32 fields, existing cent arithmetic/5% tolerance/strict number grammar, progress and reveal behavior, AP2 and legacy history. No new navigation/dependencies/accounts/backend/schema/AI/analytics. PR58 held. No merge or public final comment without specific authority.

## Review Focus

- Accepted/tolerated rows must never be diagnosed as wrong, including numeric pattern coincidences.
- Invalid/comma/signed input must use the existing parser and not crash guidance.
- Zero-rate/zero-gap variants must have coherent given values and unchanged answer sets.
- Hints and solution actions must not submit attempts or retain old-question feedback.
- Explanations must state the actual percentage base, direction, price-gap meaning and cent-rounding limits.

### Task 1: Pure variants and grouped learning content

**Files:** `lib/generators/handelskalkulation.ts`, new `lib/calculationLearning.ts`, `types/index.ts`, calculation generator and new learning tests.
**Interfaces:** Existing calculation functions gain optional explicit profile arguments defaulting to standard. Dedicated Question factories randomly select 25% special / 75% standard when no argument supplied. `buildCalculationLearning` consumes mode/given/calculated/optional forward/backward rows; produces grouped solution strings and row hints. No arithmetic helper changes.

- [x] Add red regressions for explicit 0%/0-gap profiles, unchanged pure IDs/keys/field counts and explanatory bases/directions.
- [x] Implement profiles before existing cent computation; special differential equality bypass only. Build grouped content from already computed cent records; preserve original scenario assumptions.
- [x] Verify each profile with an independent integer-cent oracle, including half-cent, standard positive/negative and matching gap; inspect exact solution equations.

### Task 2: Post-error hints and final workflow

**Files:** `lib/calculationLearning.ts`, `components/StudyCard.tsx`, learning/component/integration tests.
**Interfaces:** `getCalculationHints(question, answers)` returns at most two `{valueKey,label,text}` hints. Full validator gates all guidance; one-field validation gates row rejection. Only checked-wrong StudyCard state renders hints, preserving callback signatures and existing actions.

- [x] RED: silent correct/within-tolerance rows; exact rejected patterns; invalid/comma/boundary cases; max2 and no mind-reading; component reset/reveal/repeated navigation and no additional check/progress callbacks.
- [x] Implement minimal in-memory metadata and conditional accessible hint list; no independent grade or new retry control.
- [x] Focused GREEN, then one full `npm test`, lint, `npx tsc --noEmit`, production build and relevant local desktop/narrow browser flows.
- [ ] Independent actual-code review and fix verified scoped issues; commit and review exact head before push. Publish Ready PR if permitted; verify remote SHA/preview, wait real15minutes and assess all paginated feedback. No merge/final-summary comment.

Pre-flight: tasks share the optional Question learning metadata and builder/selector module; field hints must use original answer keys and validator, not a second correctness policy. No other interfaces change.

## Final local verification

137 focused tests/5files passed. Full final suite:1,200 tests/66files passed134.62s. Final lint/types/build all0. Local production Chromium1440/390 exercised all standard/special profiles, positive/negative/zero gaps, independent integer-cent answers, rejected numeric patterns, tolerated-row suppression, input Enter/repetition, disclosure and question-reset. No overflow/page errors/account/progress writes; narrow hint/solution screenshots visually inspected. Independent source review found no material defect; a zero-gap sub-cent hint edge was regression-tested RED→GREEN and reviewed. Earlier full-suite failures were10 obsolete title-only assertions, now aligned with meaningful grouped steps; scoring/field invariants retained.

## Follow-up: checked-question binding and concise live feedback

- [x] RED/GREEN layout-effect commit probe confirms no new-question hints can be committed from old answers before passive reset; bind guidance to the checked question ID and clear on reset/next.
- [x] RED/GREEN DOM assertion keeps the detailed hint section outside the atomic correctness status.
- [x] Real-generator tests cover every candidate across seven mode/profile/sign cases: accepted candidates stay silent (also when another row is wrong), rejected candidates select their factual reminder. A real cross-row number coincidence remains a neutral reminder, not an asserted cause. No tolerance change or arbitrary structured-input expansion.
- [x] Final correction verification:93 focused tests/3files,1,209 full tests/66files139.99s; lint/types/build0. Fresh local production Chromium1440/390 seven-case matrix passed, including hint/status separation and the existing independent-cent, repeat, reveal, reset and no-write guards. Independent source review found no blocker before push.
