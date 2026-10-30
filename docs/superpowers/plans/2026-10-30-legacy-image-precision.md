# Legacy Image Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make image calculation solutions arithmetically reproducible and preserve positive fractional transfer times.

**Architecture:** Keep exact image-size conversion operands and round only the final answer. Add a combo-local fractional formatter that delegates durations of at least 60 seconds to the unchanged shared time formatter.

**Tech Stack:** TypeScript, Vitest, existing ESLint.

**Spec:** `docs/superpowers/specs/2026-10-30-legacy-image-precision.md`

## Global Constraints

Only approved M3/M4; keep 5% tolerance, history, module IDs, progress, AP2, rates and question families unchanged. No dependencies/schema/security/account/config/SQL/commerce changes. No external writes, commits, full suite or build; parent owns final integration checks.

## Review Focus

1. Tiny positive transfers must stay positive; enumerate all 420 combinations.
2. Values near 0.5, 59.5 and 60 seconds must follow the stated precision; test the formatter boundary table.
3. Binary versus decimal conversions must retain accurate operands; enumerate all 140 combinations.
4. Rounded final answers and solution displays must agree; compare numeric final lines and requested precision.
5. Shared bandwidth hour/minute precision must remain unchanged; characterize representative shared formatter outputs.

### Task 1: Exact image-size teaching steps

**Files:** Modify `src/app/lib/generators/imageCalc.ts` and `src/app/lib/generators/__tests__/imageCalc.test.ts`.

**Interfaces:** Keep `generateImageCalcQuestion(): Question` and all answer keys/units.

- [x] Add deterministic XGA GB/GiB regressions and an independent exhaustive conversion oracle. Parse displayed equations to verify unrounded operands and correct rounded endpoints.
- [x] Run the focused imageCalc test and observe arithmetic failures before changing source.
- [x] Preserve intermediate numeric precision and explicitly state final rounding; use approximation for rounded output.
- [x] Re-run the same focused test to GREEN.

### Task 2: Fractional combo transfer answers

**Files:** Modify `src/app/lib/generators/imageTransferCombo.ts` and `src/app/lib/generators/__tests__/imageTransferCombo.test.ts`; create `src/app/lib/generators/imageTransferTime.ts` and its focused test.

**Interfaces:** `formatImageTransferTime(rawSeconds: number): ImageTransferTimeResult` adds 10% overhead exactly once; below 60 effective seconds round to nine decimals, otherwise preserve the shared formatter contract. Keep `generateImageTransferComboQuestion(): Question` and existing input keys.

- [x] Add the fixed `0.1824768 s` regression, real-validator acceptance, boundary table and complete 420-case independent time oracle, including displayed arithmetic.
- [x] Run focused tests to RED; exercise the original shared formatter in boundary tests before switching their import to the new combo-local formatter.
- [x] Implement combo-local precision; align rounding instructions, intermediate operands and solution approximations.
- [x] Run imageCalc/combo/helper tests together to GREEN, then focused ESLint and diff checks.
- [x] Leave changes uncommitted and report exact commands/results to parent for independent review and final checks.

## Execution ledger

- Pre-flight: isolated worktree `/workspace/ihk-legacy-precision`, branch `fix/legacy-image-precision`, base `3868890713be1a3fd80d557fbb2a2050a3b19c86`; clean before edits. No repository AGENTS.md found. The two tasks share no mutable interfaces.
- Baseline: existing imageCalc/combo tests passed, 14/14.
- Task 1 RED: 3 failures / 7 passes. XGA intermediate values were `1` instead of `0.75 MiB` / `0.786432 MB`; precision instructions absent. Log: `/tmp/legacy-imagecalc-red.log`.
- Task 1 GREEN: 10/10, including all 140 selectable images. Log: `/tmp/legacy-imagecalc-green.log`.
- Task 2 RED: 10 failures / 12 passes against original combo/shared formatting. Full-HD transfer expected `0.182477` under the initial six-place policy but received `0`; precision boundaries also failed. Log: `/tmp/legacy-imagecombo-red.log`.
- Ruling: refine six fractional decimal places to nine — the exhaustive oracle found a 9.6% error for a selectable transfer under the initial six-place policy, above the unchanged 5% tolerance. Existing rates reach `0.00000069206016 s`; nine places keep every current option within tolerance. Cost: longer fractional answers for the existing extreme rates.
- Precision refinement RED: 6 failures / 18 passes with nine-place expectations against the first six-place implementation. Log: `/tmp/legacy-imagecombo-precision-red.log`.
- Plain-decimal display RED: 4 failures / 22 passes when the smallest transfer displayed as `6.92e-7`; literal helper/generator regressions require `0.000000692`. Log: `/tmp/legacy-imagecombo-display-red.log`.
- Task 2 GREEN: final combined focused command below passed 36/36 tests in three files, including all 420 selectable transfers, 14 boundary rows, plain decimal output, real-validator acceptance for both fractional reproductions and unchanged shared formatter characterization. Log: `/tmp/legacy-image-precision-green.log`.
- Parent review request: changed the solution's unsupported `IHK-Standard` wording to `vorgegebenes Modell`; overhead formula and scoring remain the same.
- Focused ESLint on the six source/test files exited 0, no output. Log: `/tmp/legacy-image-precision-lint.log`. `git diff --check` exited 0.
- Focused TypeScript check on the same six files and their imports exited 0, no output. Log: `/tmp/legacy-image-precision-types.log`.
- Ruling: keep work uncommitted and defer full-suite/build/independent review to parent — explicit assignment avoids shared build/test contention and reserves integration authority. Cost: this local verification is not a full integration gate.

Focused test command:

```sh
./node_modules/.bin/vitest run src/app/lib/generators/__tests__/imageCalc.test.ts src/app/lib/generators/__tests__/imageTransferCombo.test.ts src/app/lib/generators/__tests__/imageTransferTime.test.ts --maxWorkers=1
```

Focused type command:

```sh
./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --target ES2017 --lib ESNext,DOM --module ESNext --moduleResolution Bundler --types vitest/globals,node src/app/lib/generators/imageCalc.ts src/app/lib/generators/imageTransferCombo.ts src/app/lib/generators/imageTransferTime.ts src/app/lib/generators/__tests__/imageCalc.test.ts src/app/lib/generators/__tests__/imageTransferCombo.test.ts src/app/lib/generators/__tests__/imageTransferTime.test.ts
```

All changes remain local; no external write, push, PR, comment or merge was attempted. `node_modules` is an ignored symlink to `/workspace/ihk-legacy-sql-numeric/node_modules` solely for these focused checks. Parent will replace it with local dependencies before its build.

Parent-requested browser diagnostic: `/tmp/legacy-precision-browser.cjs` (syntax checked with `node --check`, not executed yet). It targets production port 3130 in Chromium at widths 1440/390, closes login for guest use, seeds actual module selection deterministically, enters a correct fractional transfer and image-size answer, submits/reveals with the keyboard, checks exact solution operands and horizontal overflow, captures screenshots and asserts no account/progress writes. Parent owns execution after its build.

## Final standalone verification
Full suite1033/1033 in62files passed236.00s; full lint, explicit types and production build passed. The first full-lint attempt started while local dependencies were being copied and could not find eslint (exit127); after the unchanged dependency copy completed, final lint/types exited0. No manifest/configuration/version changed.

Production Chromium1440/390 on fresh3130 passed fractional-transfer answer0.21897216seconds, precise image conversion operands, explicit rounding, keyboard check/disclosure, no overflow/page errors/account-progress/network writes. Independent actual-code review found no substantive blocker, probed all140images/420transfers in en-US/de-DE, and confirmed every reachable fractional answer remains accepted under the existing5% policy. Reachable branches:360fractional/60minute/0hour; maximum expected-answer error0.4694%. Two GiB intermediate strings use Intl's shortest Number decimals with relative discrepancy below5e-17; exact rational-decimal output/approximation polish is deferred as optional and affects no carried value or grading. Hosted/cloud/account/screenreader verification remains unconfirmed.

The branch remains directly based on3868890 with no other pending repair integrated. Publication follows the approved ReadyPR/15-minute workflow; all merges and public assessment-comment retries remain paused. Final commit requires independent exact-head review acknowledgment before push.
