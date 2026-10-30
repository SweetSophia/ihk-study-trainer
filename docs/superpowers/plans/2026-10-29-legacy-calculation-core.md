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

## Late Kilo review disposition (2026-10-30)

Reviewed all conversation comments (6), inline comments (9) and review submissions (3) on PR72; page2 was empty for all three endpoints. All three Kilo reviews were COMMENTED against f622b2353dd3c25899df3d91c7783e894b999c86. This local follow-up is uncommitted; no push, external comment or merge is authorized for its implementer. All merges remain paused while renewed approval for the published head is pending. No PR58 or other repair branch is included.

Ruling: Preserve the existing arithmetic, parameter ranges, answer keys/counts, module/progress contracts and 5% tolerance. Apply only the bounded text/docs/test cleanup requested after evidence-based triage. The parent coordinates full verification, browser checks and a fresh independent actual-code review before any push; every push restarts the real 15-minute review window. No duplicate heavy suites in this local task.

| Review claim | Verified disposition and bounded response |
| --- | --- |
| [Two different LEP values](https://github.com/SweetSophia/ihk-study-trainer/pull/72#discussion_r4419190628) | Teaching clarification, not contradictory arithmetic: existing sections already distinguish forward from market-price reversal. Clarified the given net LEP versus market-derived net LEP in Differenz prompt, input labels and solution, including why they can differ. Kept all 32 fields and values. |
| [No half-cent ties in five seeds](https://github.com/SweetSophia/ihk-study-trainer/pull/72#discussion_r4419190634) | False as a blanket claim: existing Differenz comparisons already exercise ties. Seed .98765 backward LEP is 14978200/80 = 187227.5 cents -> 1872.28 euros. Seed .999999 backward Kundenskonto is 1621050/100 = 16210.5 cents -> 162.11 euros; LEP is 15208200/80 = 190102.5 cents -> 1901.03 euros. Added a named forward 100.50 euros / 13% rebate fixture (13.07 euros) and seed .25 covering supplier skonto2% / customer skonto3%. These are characterization/coverage additions; no rounding fix or artificial RED is claimed. |
| [Stale gross-LEP research documentation](https://github.com/SweetSophia/ihk-study-trainer/pull/72#issuecomment-6511556973) | Confirmed old purchase-VAT rows and incorrect reverse-percentage guidance in IHK_TOPICS_RESEARCH.md; corrected the commerce section to the implemented net convention, factors, ranges and meaning of Differenz. The assertion that it was the only written description was false: the new design spec already documented the correct convention. |
| [Unhandled backward exception](https://github.com/SweetSophia/ihk-study-trainer/pull/72#discussion_r4419190639) | Deferred future robustness concern: throw is unhandled, but current ranges keep BEP positive. A targeted 256 parameter-boundary probe found minimum BEP76.80 euros; rounding-error bounds also retain a large positive margin. No retry or shared UI exception handling added for an unreachable current condition. |
| [Redundant forward LEP answer](https://github.com/SweetSophia/ihk-study-trainer/pull/72#discussion_r4419191384) | Intentional preserved answer contract/task-design tradeoff: copying the given starting row is redundant, but removing it would change answer keys and counts. Kept the row and explicitly labelled it net/given. |
| [Oracle not independent](https://github.com/SweetSophia/ihk-study-trainer/pull/72#discussion_r4419191390) | Rejected as stated: rational-cent oracle imports no production helpers; an identical rounding policy does not make implementations dependent. Production changes do not automatically rewrite the oracle. A literal complete midpoint fixture already pins all backward rows; added the named forward half-cent fixture as additional independent evidence. |
| [Text test does not prove modes](https://github.com/SweetSophia/ihk-study-trainer/pull/72#discussion_r4419191397) | Narrow coverage gap: other tests already cover mixed Differenz inputs and dedicated mode contracts, but this text test lacked explicit mode assertions. Added exact Vorwaerts/Rueckwaerts/Differenz mode checks for seeds .1/.5/.9. |
| [5% tolerance masks nearby wrong answers](https://github.com/SweetSophia/ihk-study-trainer/pull/72#issuecomment-6511556973) | Existing scoring policy, not a defect introduced here. It can accept near answers but does not correct a wrong chain. Preserved the explicitly approved 5% policy; no broader scoring revision. |
| [Stale shared-chain comment](https://github.com/SweetSophia/ihk-study-trainer/pull/72#discussion_r4419191992) | Confirmed stale wording; changed the comment to state that Differenz uses the shared backward routine. |
| [Dead gross fallback in oracle](https://github.com/SweetSophia/ihk-study-trainer/pull/72#discussion_r4419191998) | Confirmed unnecessary fallback; oracle now requires g.lepNetto directly. |
| [Given procurement cost in grading payload](https://github.com/SweetSophia/ihk-study-trainer/pull/72#discussion_r4419192007) | Minor test precision gap: extra supplied bezugskosten was ignored by validation. Filtered the independently known midpoint values to requested keys and asserted that bezugskosten is absent from answer inputs. Did not derive test answer values from expectedAnswers. |

### Local follow-up verification

- RED: focused generator run, 3 expected label/prompt/solution failures and 20 passes; log /tmp/pr72-late-red.log. Half-cent/interior-rate characterizations passed against unchanged arithmetic.
- GREEN: focused generator run, 23/23 passes; log /tmp/pr72-late-green.log. Both market-undercoverage and market-above-price scenarios retain forward LEP800 and backward LEP714.97 / 863.77 respectively, with32answer inputs and32expected keys.
- Targeted ESLint for generator/test exited0 (/tmp/pr72-late-eslint.log); git diff --check clean. AST declaration comparison against f622 confirmed both schemas and all12selected arithmetic/parameter/calculation functions unchanged (14declarations total).
- Full suite/build/browser and fresh independent whole-branch review remain for the parent after this local handoff. The historical verification above applies to the original published snapshot, not automatically to this follow-up.

### Final follow-up verification
Root full suite1024/1024 in61files passed209.54s; full lint, explicit types and production build passed. Fresh production server3132 passed all three existing commerce modes at1440/390 with independent cent answers from displayed givens, Enter submission, complete solutions, net/rounding text and no overflow/page errors/account-progress writes. The diagnostic parser was updated only to recognize the clearer 'netto, gegeben' prompt label; old3125server was not used as final-code evidence.

Fresh independent actual-code review found no actionable issue. It checked3000 calculation comparisons against f622,66000 BigInt monetary rows and3000 question-contract comparisons;14 arithmetic/generation declarations remain identical. Thus this correction changes presentation/docs and regression precision, not arithmetic or historical scoring. Final exact-commit acknowledgement is required before push; that push restarts the real15-minute review window. All merges and denied public assessment-comment retries remain paused. Earlier F622-specific pending approval cannot be silently applied to a changed head.
