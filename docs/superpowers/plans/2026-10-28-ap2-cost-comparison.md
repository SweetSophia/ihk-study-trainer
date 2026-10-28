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
