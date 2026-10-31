# Exercise labels and RAID Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make existing exercise headings, unit controls and RAID explanations understandable and semantically accessible.
**Architecture:** Reuse module metadata in StudyCard and retain the current RAID diagram, adding semantic groups and image roles. No new shared architecture.
**Tech Stack:** Existing React/TypeScript, Testing Library/Vitest, Playwright and Next.js.
**Spec:** `docs/superpowers/specs/2026-10-31-exercise-labels-raid-design.md`

## Global Constraints

Preserve module/storage IDs, saved history, math, generator contracts, scoring tolerance and AP2 flows. No new dependencies or backend/schema/security changes. PR #58 untouched. No merge or separate public summary without specific authorization.

## Review Focus

- Unknown/prototype-like module IDs must produce a safe heading.
- Stored aliases and the retired mixed module must keep accurate labels.
- Multiple time controls must remain distinguishable and submit unchanged answer keys/units.
- RAID 5/6 tiles must describe capacity equivalents, never dedicated parity disks.
- RAID 1/10 must explain mirrored capacity; RAID 0 must not claim redundancy.

### Task 1: Existing-card UX and diagram semantics

**Files:** `src/app/components/StudyCard.tsx`, `RaidVisualizer.tsx` and their existing component tests.
**Interfaces:** Consume existing `Question`, `RaidConfig`, module registry and canonicalization. Preserve all props/callback signatures, answer payloads and generator output.

- [x] Add heading regressions for canonical/alias/legacy/unknown/prototype-like IDs and contextual unit names with unchanged payload/grade checks; run RED before product edits.
- [x] Add named group/image/legend regressions across parity and nonparity RAID, linked explanation checks and coherent RAID6 fixture assertions; run RED.
- [x] Implement minimal StudyCard labels and RAID semantic/explanation changes; run focused tests GREEN.
- [x] Run full `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`; exercise local production desktop/mobile heading, unit keyboard/check/reveal and RAID roles/overflow flows. No live accounts.
- [x] Independent actual-code review before committing/pushing final content. Fix validated scoped defects and repeat only affected checks.
- [ ] Push, create Ready-for-Review PR, verify exact head and preview, wait real 15 minutes from ready/every push, inspect all paginated review feedback. Independently replace unavailable reviewers.
- [ ] Report exact head, checks, windows and proposed DE/EN completion comment; no merge or public completion comment.

## Verification before initial publication

Baseline 82 focused tests passed. RED: 18 failures (17 new behavior cases plus the RAID6 fixture consistency assertion); GREEN: 99 focused tests. Full suite: 1,160 tests / 65 files passed, 131.42 seconds. Lint, types and production build exited 0. Local production Chromium at 1440/390px checked readable calculation headings, independently calculated transfer-time submission, both unit names, Tab/Enter, disabled state after checking, and all five RAID levels with image/group/legend roles and no overflow/page errors/account writes. Independent actual-code review found no blocking issue. Real screenreader/device keyboards, hosted browser and live persistence were not exercised.
