# Trainer Navigation and Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the module wall with the approved exercise-first topic navigation and complete accessible light/dark presentation, retaining learning state and scoring.

**Architecture:** Canonical module IDs feed a separate topic grouping registry. One responsive navigation instance controls selection while the existing workspace remains mounted. Appearance is an independent local preference applied through shared semantic Tailwind tokens; one central page selection boundary protects the session-only training run.

**Tech Stack:** Existing Next.js/React, Tailwind 4, Lucide, Vitest/Testing Library and Playwright; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-03-trainer-navigation-design.md` (approved 2026-11-03 08:30 UTC).

## Global Constraints
- Preserve all module/storage IDs, retired mixed history, cents/tolerance/scoring/reveal contracts, progress/account boundaries and SQL auth restriction; guest AP2 database remains available.
- Five groups, maximum two navigation levels, separate prominent training run. Desktop breakpoint 1024px, sidebar about 260px, overall maximum about 1440px.
- Opening/closing navigation, appearance changes and reselecting the active module do not regenerate questions, remount trainers or record attempts.
- Confirm every internal module departure from the training run; reload/account changes retain existing reset warnings, with no new autosave promises.
- System/Hell/Dunkel, isolated local key `ihk_theme_preference`, storage failure fallback and system-change support; existing CSP unchanged.
- Migrate every existing component/diagram/dialog, German document language and existing Geist fonts; no backend/schema/dependency/security changes.
- #58 held. Independent code review before every push, ready PR, real 15-minute window after every push, normal protected merge only when authorized/eligible.

## Review Focus
1. A blocked/invalid preference store or changing OS preference must not break rendering or reset learning state (Task 2 tests).
2. Selection cancellation via Escape or closing mobile navigation must preserve the entire run and restore a visible focus target (Task 3 browser/integration tests).
3. Selecting an active exercise and changing layout/theme while an answer is revealed/checked must retain first-attempt bookkeeping (Tasks 1/3 integration tests).
4. Mobile/desktop breakpoint transitions with focus inside a hidden navigation region must move to an equivalent visible control (Tasks 1/4 browser tests).
5. Rare surfaces—SVG roles, SQL errors, dialogs, disabled fields—must remain legible in light/dark rather than inheriting the old palette (Tasks 2/4 browser tests).

---

### Task 1: Canonical topic navigation
**Files:** Create `src/app/lib/moduleTopics.ts`; replace `src/app/components/ThemeSelector.tsx`; replace its obsolete grid-specific test with behavioral disclosure tests; create `src/app/lib/__tests__/moduleTopics.test.ts`.
**Interfaces:** `MODULE_TOPICS` has stable topic IDs, German labels and canonical `ModuleId[]`; `getModuleTopic(module: string | null)` returns topic or undefined. Keep `ThemeSelector({currentModule,onSelectModule,isAuthenticated})`, add optional `onDismiss` for pending departure cancellation.
- [x] Write tests asserting unique 29 grouped IDs plus separate run, SQL visibility, exact five groups, independent group browsing, active marking, mobile open/close/Escape focus and selection callbacks without selecting on disclosure.
- [x] Run `npx vitest run src/app/lib/__tests__/moduleTopics.test.ts src/app/components/__tests__/ThemeSelector.test.tsx`; expected RED because registry/disclosures are absent.
- [x] Implement registry and one responsive accessible navigation tree. CSS media queries expose the desktop list or mobile disclosure, not duplicate module trees. Use full canonical names, an AP2 badge, real buttons/list semantics and active-group marker. Keep pure navigation state local; coordinate responsive focus through matchMedia with graceful test fallback.
- [x] Run those tests; expected PASS. Update page integration tests to open the appropriate real group before choosing a module; keep their existing grading assertions.
- [x] Commit topic navigation and its tests.

### Task 2: Complete semantic appearance
**Files:** Create `src/app/lib/appearance.ts`, `src/app/components/AppearanceSelector.tsx` and tests; modify `layout.tsx`, `globals.css`, every existing component and page color class, and SVG fills/strokes in both visualizers.
**Interfaces:** `AppearancePreference = 'system' | 'light' | 'dark'`; `APPEARANCE_KEY`, safe `readAppearance()`, `applyAppearance(preference)` and early `APPEARANCE_BOOTSTRAP` set root `data-theme`/`color-scheme`. Preference selection never controls a trainer key or execution state.
- [x] Write behavioral tests for stored/absent/invalid/throwing storage, explicit-vs-system change handling, persistence and selector focus. Run the new file, expected RED.
- [x] Implement appearance selection with system matchMedia listener/cleanup and a small early inline bootstrap compatible with current CSP. Set html language de and suppress only intentional root hydration attribute difference. Use Geist body/mono variables.
- [x] Define semantic canvas/surface/subtle/ink/muted/control/line/action/onaction/accent/success/warning/danger/info tokens for both palettes, default system CSS fallback, global visible focus and reduced-motion handling. Map all existing hardcoded component color utilities to these tokens, including disabled/hover/ring and diagram paints; preserve layout and behavior outside the approved shell.
- [x] Run appearance and existing component tests; expected PASS. Browser contrast checks in Task 4 cover actual resolved styles rather than source string matching.
- [x] Commit appearance migration and tests.

### Task 3: Stable workspace and run departure guard
**Files:** Modify `src/app/page.tsx`, minimally extend `StudyCard` autofocus contract, add `src/app/__tests__/navigationState.integration.test.tsx`; update existing integration selections to the new grouped interface.
**Interfaces:** Central `requestModule(module)` validates/gates/canonicalizes, ignores active selection, requests confirmation for run departures, otherwise commits selection. Pending target is a canonical module or null. Navigation `onDismiss` clears pending target. Workspace ref coordinates visible heading focus without remounting children. `StudyCard` optional navigation-focus override applies only to module selection, not next-question.
- [x] Write RED tests: active ordinary module preserves question/draft; group/theme changes preserve answers; active AP2/run preserves rubric/reveal/check state; run departure cancel retains answers, confirm switches, mistake action also guarded, guest paths never write progress. Account transitions keep prior reset contract.
- [x] Run new integration file against current page; expected failure on active reselect/unguarded departure.
- [x] Implement 1440px shell/260px desktop sidebar, compact mobile progress disclosure, labelled appearance selector, active path, central guard and inline confirmation with initially focused Continue, focus restoration and heading focus. Do not change existing generators/progress handlers/auth or worker contracts.
- [x] Run navigation and existing integration tests; expected PASS with unchanged scoring assertions. Add blocked auth target and dismissal edge cases.
- [x] Commit workspace integration and tests.

### Task 4: Integrated acceptance and publication
**Files:** Create `scripts/check-navigation-theme.mjs`; narrowly update README usage and existing changelog for the delivered navigation/appearance behavior, if warranted; preserve #58.
**Interfaces:** Browser script accepts local `IHK_TEST_URL`, rejects nonlocal destinations and account writes; tests real production DOM and computed colors, logs no credentials.
- [ ] Write/run browser acceptance against the local production server: 320/390/768/1023/1024/1440px, both themes/system, keyboard/zoom/long labels, focus on dismissal/selection/breakpoint, no page overflow, run cancel/confirm/repeated selection, filled/checked/revealed ordinary questions, SVG and dialog contrast, guest SQL boundary/AP2 DB availability. Record actual-device and real-screenreader limitations.
- [ ] Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`; expected all pass. Inspect desktop/mobile screenshots, console errors and theme first paint under production CSP.
- [ ] Fresh independent whole-branch actual-code review against spec and Review Focus. Fix validated important issues red-to-green, rerun affected checks plus final suite; record optional deferred findings.
- [ ] Commit final verification/docs, independently review final actual changes before push. Push feature branch, verify exact remote SHA, create ready PR and record UTC ready time/review deadline. Wait real 15 minutes, inspect all paginated discussion/reviews/inline feedback and permitted combined statuses; do not access denied check-runs/rules endpoints. Independently substitute failed reviewers. Repeat independent pre-push review and full wait for corrective pushes.
- [ ] Refresh exact head/reviews/mergeability; normal expected-head merge only with authorization and protections satisfied. Verify remote merged/main tree and terminal automatic Vercel deployment; bounded guest smoke through permitted browser, report connectivity limits accurately. Stop any denied operation, no alternate route.

## Self-review
All spec sections map to Tasks 1–4, including mobile progress, initial empty navigation, active-group discoverability, no workspace duplication, run confirmation on every internal path, font/language and full component palette. Interfaces and filenames align; no additional product decision is needed. This plan proceeds natively under the user's explicitly adopted autonomous workflow, superseding routine plan-review gates. Existing linked worktree is isolated; a new feature branch is based on freshly fetched main. Plan ledger is local `/workspace/trainer-navigation-progress.md`; skill helper scripts are cloud references, so use equivalent explicit ledger entries rather than assume filesystem availability.
