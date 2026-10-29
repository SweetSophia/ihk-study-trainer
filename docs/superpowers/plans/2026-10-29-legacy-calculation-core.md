# Legacy Calculation Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Native implementation; independent whole-branch review before every push.

**Goal:** Correct M1/M2 across three existing calculation modules with reproducible cent arithmetic.
**Architecture:** One explicit net purchase convention; shared forward chain and shared backward-from-displayed-price routine. Keep generator/UI/progress contracts.
**Tech Stack:** TypeScript, Vitest, existing Next/React UI.
**Spec:** docs/superpowers/specs/2026-10-29-legacy-calculation-core-design.md

## Global Constraints

- No schema/dependencies/new families/UI redesign/tolerance change; stable module IDs/progress; PR58 held; AP2 unchanged.
- Round every newly computed amount/base to cents, complementary values from rounded rows. VAT only at sale boundary; purchase LEP/net costs exclude VAT.
- Independent code review BEFORE every push; Ready PR;15real minutes after ready/every push; merge only verified exact head under normal rules.

## Review Focus

- Backward uses displayed rounded gross input, not hidden forward values: independent integer-cent oracle.
- Every displayed row equation works on cents, including .005 ties: literal midpoint fixture plus boundary seeds.
- Differenz starting LEP equals supplied net LEP: complete forward/backward row checks.
- Correct answers accepted under existing validator; wrong audited BP rejected; no tolerance modification.
- Module IDs/answer prefixes and backward amount nonnegativity preserved; no accidental AP2/shared storage edits.

### Task1: Repair complete calculation chains and descriptions

Files: generators/handelskalkulation.ts and its existing test file. Interface: existing six exported generators and schemas unchanged; generated purchase input metadata explicitly net, answer keys remain.

- [x] Add independent integer-cent oracle, literal midpoint M1/M2 regressions, bounds/awkward cents and task convention checks. Run focused test; observe failures against old core.
- [x] Make arithmetic round each row; remove contradictory VAT purchase seed; share backward-from-displayed-gross routine. Align labels/solution text with net convention and explicit rounding.
- [x] Focused tests green; strengthen old skipped row invariants; inspect full diff.
- [x] Run full tests, lint, explicit types, production build and local desktop/mobile calculation flows once final code settles.
- [x] Independent whole-branch actual-code review; fix validated issues with red/green, repeat affected checks only unless full regression warranted.
- [ ] Commit, reviewer confirms final snapshot, push and open Ready PR once. Record SHA/time/deadline/preview.
- [ ] Real15-minute window; all paginated feedback; substitute fresh independent review for unavailable bots; bilingual assessment. No new code means no needless reruns.
- [ ] Normal expected-head merge if green; verify remote main and automatic deployment. Update global tracker and start next eligible approved repair.

## Verification ledger

- TDD:9expected failures→18passing focused tests. Full regression1019/1019,61files,197.26s. Lint/types exit0; productionbuild exit0. Initialbuild setup failed because Turbopack rejects node_modules symlink outsideprojectroot; copied SAME installeddependencies locally, no manifest/version/configchange, reran affectedbuild only.
- Production Chromium1440×900/390×900: all3existingmodules, independentcent answers fromdisplayedgivens, Enter, fullsolutions, net/roundingnotice, nooverflow/pageerrors; guest only/noaccountwrites.
- Independent actual-source review: no actionabledefects. BigInt centoracle/solution-equation/validator checks and explicit half-cent/fallback edge passed. Optional permanent tie/fallback/equation regression expansion deferred; currenttests use literalmidpoint plus5boundary/awkwardseeds. No codechangesfromreview.
- Finalsource/test snapshot unchanged after fullverification. Ready publication/reviewwindow/merge tracked privately until complete.
