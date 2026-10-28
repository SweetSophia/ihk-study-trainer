# AP2 Cost Comparison Implementation Plan

> Native execution using executing-plans and TDD; independent whole-branch review before publication.

**Goal:** Original fixed IT cost comparison with two objective sections and unscored reasoning.
**Architecture:** Pure integer-cent validation in costComparison.ts; dedicated CostComparisonTrainer; catalog, registry exclusion and identity-keyed page progress integration.
**Tech Stack:** Existing React/TypeScript/Vitest/Playwright; no dependencies.
**Spec:** docs/superpowers/specs/2026-10-28-ap2-cost-comparison-design.md

## Global constraints
Fixed4800+120m versus400+260m, net; initialtime0/month-end payments; no tax/discount/salvage/extra costs. New ap2CostComparison, max2 first checks/run; reveal-before-check unscored, guest no persistence, identity reset warning. Session-only reasoning. Preserve all existing IDs/progress and PR58.

## Review focus
Exact cents, comma/dot and malformed inputs; strict cheaper/equality boundary; duplicate check and sticky reveal; dirty-state identity/reset; accessible errors and feedback. Every focus covered by pure/component/page tests and browser checks.

## Tasks / ledger
- [x] 1. RED pure tests for money parsing and fixed section validators; implement parseEuroCents(value:string):number|null, costAtMonth(offer,month), validateCostAnswers(section,answers). GREEN focused tests. No general crossover engine.
- [x] 2. RED trainer and page integration tests; implement CostComparisonTrainer.tsx, module catalog/page/registry wiring and update affected catalog tests. Assert repeated/blank/wrong checks, completed guest checks, reveal/hide, reset and identity changes, rubric no-score, existing drill return. GREEN focused tests.
- [x] 3. README and changelog factual new entry, update deliberate release-marker test. Full tests, lint, types, build; local production desktop/mobile browser flows; one independent branch review. Fix validated findings, repeat only affected checks. Commit/push ready PR.
- [ ] 4. Record UTC publication time/exact head/preview; real15min review wait; paginate comments/reviews, fix valid scoped findings, reverify and allow15min after corrective pushes. Supplement unavailable bots independently without retries. Normal expected-head merge only if green/allowed; verify remote main/automatic production terminal status.

Ruling: user explicitly chose native implementation, efficient focused development and one full final verification; no extra baseline full suite or plan approval pause. Use sibling worktree to preserve all previous work. Preflight: task2 consumes task1 validator interface above; task3 documents same semantics.

Development: pure tests RED missing module → GREEN31; UI RED missing component/navigation → GREEN4 component +1 page. Page selector corrected to existing compact AP2 Kosten label. Changelog marker RED observed before content change.

Final verification before publication: 870 tests/51 files passed (165.37s), lint and type-check passed, production build passed. Independent GPT-6.1 Sol/high branch review found no remaining defects. Leading-zero parser limit caught and fixed with RED→GREEN safe-cent boundary regression; affected32 pure tests and lint passed, production build repeated for final parser. Desktop1440/mobile390 Chromium production flows passed: accessible field errors, keyboard disclosure, guest completion/no progress, local-fallback login reset, repeat cap, sticky reveal, reasoning/rubric no-score, new run, existing drill return and reload persistence. Browser harness corrected dynamic disclosure locator and authenticated reload assumption; no app defects from browser checks. No horizontal overflow/page errors. Live Supabase/hosted browser persistence remains unverified; local fallback is not production proof.

## Late review correction pass (2026-10-28)
Kilo review arrived after the initial15-minute window; bounded fixes approved. Shared auth.ts storage and legacy-history policy remain explicitly outside this pass; merge is held for that decision.

- discussion_r4396296886: confirmed answer leakage; removed graded amount/choice from reasoning example, keeping self-assessment unscored and objective eligibility unchanged. Regression RED→GREEN.
- discussion_r4396296892: confirmed context-free status messages; prefix both sections' wrong/correct/stale announcements. Regression RED→GREEN.
- discussion_r4396296911: harmless today, added noValidate to match custom-validation convention.
- discussion_r4396296916: clarified reveal applies before the first check, not retroactively.
- discussion_r4396296922: deferred hypothetical swapped-offer generalization; approved constants are fixed and difference640 is correct. Changing offers also requires new crossover/choice/example design; this is not a generic calculator.
- discussion_r4396296927: wording was not mathematically reversed, but now explicitly compares server against managed service.
- discussion_r4396296931: confirmed README overstatement about DB warning; document its guest-only warning rather than changing another trainer.
- discussion_r4396296938: removed extra blank line to preserve the existing tight Markdown list.
- discussion_r4396296941: restore historical UTC merge-date convention and explicitly mark new feature entry pending. Confirm/update date and release-marker tests before eventual merge; current PR is held and no release date is claimed verified.
- discussion_r4396296952: add populated wrong→correct retry and later-reveal regression; implementation already consumed the first attempt correctly.
- discussion_r4396296953: add negative/fractional/nonfinite/unsafe month and overflow helper regressions; guards already correct.
- discussion_r4396296955: add wrong managed/difference, inherited-only/mixed and null-prototype answer regressions; validation already correct.

Final correction verification: 49 focused tests, full882/882 across51 files, lint, types and production build passed. Desktop1440/mobile390 production-browser flows passed with contextual status and non-leaking reasoning checks, unchanged scoring/guest/login/reset behavior and local-fallback reload. Independent correction review found no confirmed defect; actual UTC release date remains a pre-merge gate. No shared persistence, schema, dependencies, security settings or PR58 changes.

## Local integration preparation after separate storage repair
Late Kilo nits r4396421058/r4396421063/r4396421070: restrict verified-date convention to new AP2 entries and retain older recorded dates; assert every inherited amount independently (not merely the choice failure); require the generic unscored reasoning example to contain neither numbers nor named choices. Focused51 tests passed before integration; local commit8b4f87c.

Prepared a local merge of repair36bcfbc (PR67) into this feature without publishing it before the prerequisite merge. README conflict resolved by retaining both the new fallback requirements/legacy retention and all six scenarios. Cost callback now uses the shared recordProgress handler; a new persistence-failure integration regression was RED→GREEN and verifies no automatic attempt retry. Changelog also records the bounded local-storage improvement without claiming hosted persistence.

Prepared integration verification:907 tests/53 files passed (190.95s), focused53 passed, lint/types/production build passed. Independent integration review found no blocking defect or repair/feature loss. Desktop1440/mobile390 real-browser flows passed guest/reveal/repeat/rubric scoring, two-account local counters, logout/relogin/reload, visible sticky write failure, no retry, legacy bytes unchanged and existing drill return. Live hosted Supabase persistence remains unverified. Intended release date28/10/2026 remains a UTC-date recheck gate immediately before merging. No PR58 changes. This local preparation is held unpublished until PR67 is permitted to land; actual main must then be integrated and tree equivalence checked before publication.

Prerequisite PR67 merged at2026-10-28 11:11:11UTC as8eb0c1808caa3ac72ffd047047c492541cc6b5bd. Integrated actual origin/main normally as5a554ce; tree0d2e22cf024cf7428a0b809bd0e2b141947b4743 exactly matches the907-test prepared integration22d9054. No application changes needed after that verification. Release date28/10/2026 checked against current UTC date before publication; removed pending-entry comment, with another UTC date check required before the final merge.

## Integrated review and plain amount correction
Integrated head6b18c72 pushed2026-10-28 11:12:35UTC; real review window completed11:27:35UTC; preview succeeded. Kilo r4399906706 correctly identified that currency-formatted solution rows used grouping separators rejected by the strict parser. Changed only row formatting to plain decimal-comma values without grouping or a redundant currency suffix (unit already in label). New regression parses every displayed row with the actual input parser: RED→GREEN. Fixed scenario arithmetic/grading/scoring unchanged; hypothetical swapped-offer generalization remains outside scope. The release date remains28/10/2026, with final UTC check before merge.

Final formatter correction verification:908 tests/53 files passed (191.62s), focused54 passed, affected lint/types/production build passed. Desktop/mobile production browser flows passed again, including plain solution-row text plus all account/scoring/error/legacy scenarios. No new hosted persistence claim. This correction receives another real15-minute review window after push.
