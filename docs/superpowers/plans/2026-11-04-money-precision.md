# Money Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native implementation, with independent actual-code review before every push under the adopted workflow.

**Goal:** Grade monetary answers in the three pure calculation drills to the exact cent without altering other numeric grading.
**Architecture:** Opt-in input metadata + a small exact-decimal cent parser shared by validation and hint precision feedback. Existing calculation and persistence code stays intact.
**Tech Stack:** Existing TypeScript/React/Vitest/Playwright; no new dependencies.
**Spec:** docs/superpowers/specs/2026-11-04-money-precision-design.md

## Global Constraints
Only three pure calculation factories opt in. Preserve IDs, answer keys16/15/32, history, progress/reveal rules, AP2, existing arithmetic and other numeric policies. RAID tolerance and PR58 unchanged.

## Review Focus
- Fractional-cent text and underflow cannot be rounded or parsed into a correct answer.
- Scientific notation, comma and trailing-zero equivalents remain valid.
- Every monetary intermediate is checked; legacy mixed/other modules stay unchanged.
- Hints use the same per-field acceptance and never accuse an accepted row.
- A wrong check/reveal/navigation must not duplicate progress callbacks.

### Task1: Exact cent parsing and validation
Files: new src/app/lib/moneyPrecision.ts and lib/__tests__/moneyPrecision.test.ts; types/index.ts and lib/answerValidation.ts.
Interface: parseMoneyCents(raw?:string|null):number|null, safe integer cents; AnswerInputConfig.numericRule?:'moneyCents'.
- [x] Write/run red validator-level1000/1040,±1cent,sub-cent/negative/zero tests before code.
- [x] Implement grammar-preserving exact decimal scaling with bounded expansion; configure monetary input comparison only when opted in.
- [x] Cover malformed/exponent/range cases; run focused green.

### Task2: Scoped generator and hint integration
Files: generators/handelskalkulation.ts, lib/calculationLearning.ts; dedicated integration tests, existing independent cent-oracle suite and StudyCard tests.
Interface: private buildQuestion option moneyPrecision?:'cents', passed by exactly three dedicated factories; tag all their answerInputs. Hints read the row's config and use parseMoneyCents for neutral precision feedback.
- [x] Red tests for exact registry scope, full16/15/32field coverage, row-by-row±1cent rejection, negative/zero variants, half-cent expected row, legacy/non-calculation tolerance retention and hints.
- [x] Implement metadata/copy/hint changes with no arithmetic or persistence edits.
- [x] Component regression for wrong-result feedback, one callback, reveal/reset and accepted values; focused green.

### Task3: Documentation, final verification and review workflow
Files: README.md, lib/changelog.ts with existing release tests; new scripts/check-money-precision.mjs.
- [x] State rule clearly, retain history and only newest badge; use actual UTC release date before merge.
- [x] Production guest checks at desktop/narrow widths: exact/comma,4%wrong,subcent,negative gap,theme/navigation retention, old-feedback reset and no writes.
- [x] Run full suite, lint, explicit types, production build, independent actual-code review; fix validated issues.
- [ ] Commit/push/Ready PR; exactremote SHA+preview; real15min after every push, inspect all bot feedback and independently replace unavailable bots. No formal approval reviews. Stop/report any actual denied operation.

Self-review: opt-in field metadata avoids global tolerance changes; legacy mixed path is tested separately. Exact decimal normalization avoids binary cent noise and silent rounding. Existing oracle verifies chain rather than new parser mirroring generator math. No unresolved new product decision within approved scope.

Final local evidence:1,379tests/77files pass, plus46focused scope cases after the final test-only legacy assertion. Lint0errors/1unchanged AuthModal warning; explicit types and production build pass. Browser320/390/1440 passes with independent displayed-givens integer oracle,4%andfractional-cent rejection, comma/negative/zero, fresh feedback, theme/draft retention and no account/progress writes. Independent actual-code review:100,000parser samples,600questions/12,600rows and113focusedtests pass, no blockers. RAID tolerance was verified unchanged; future exact theoretical capacity comparison requires separate approval.
