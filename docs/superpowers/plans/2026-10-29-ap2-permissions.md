# AP2 Permissions Implementation Plan

> Use superpowers:executing-plans inline and TDD; independent actual-code review before EVERY push.

**Goal:** Apply supplied additive group rights to a small original business case and select a narrow correction with meaningful verification.
**Architecture:** Pure fixed-model helper/validators; dedicated trainer, existing page/progress/catalog; original training run unchanged.
**Tech stack:** Existing React/Next/TypeScript/Vitest/Chromium, no dependencies.
**Spec:** `docs/superpowers/specs/2026-10-29-ap2-permissions-design.md`.
**Base:** d473cd3186b0533e7241b6332c4a5d2bfd3158fd, isolatedfeat/ap2-permissions worktree/workspace/ihk-ap2-permissions.

## Constraints / review focus

No real permissions/security/config/backend/schema/account action, credentials, exam-source content, official-equivalence claims or PR58 changes. Preserve prior IDs/progress and run trio. Check overlaps, absent grants, inherited-only/mixed/malformed answer values, correction preserving other users, positive/negative verification, first/reveal/retry/guest/identity/reset, generic reasoning examples and accessible mobile feedback.

## Task1 — pure model (accessControl.ts + lib tests)

Exports PEOPLE/FOLDERS/GROUPS and choice catalogues; effectiveAccess(groups,folder), validateEffectiveAccess(answers), validateCorrection(answers), result{valid,errors}. Exact choice values none/read/edit; fixed two-section selectors. Strict learner answer validation and own-property checks.
- [x] Write pure tests RED; implement model/validators GREEN. Independent hand-derived six-cell expectations, overlaps/duplicates/default-denial/invalid IDs, both validators and unsafe plans.

## Task2 — trainer/integration/content

CreateAccessControlTrainer.tsx/componenttests; addap2AccessControl to modules/registry exclusions/page identity key and original progress callback. Add pageintegrationtests with onlyauth/worker/animations mocked; preserve real navigation/forms. Update README and lib/changelog.ts/existing StudyCard tests.
- [x] Write UI/page RED tests; implement two sections, reasoning rubric and safeguards GREEN.
- [x] Update factual documentation/changelog counts/date and newest-only badge; verify affected tests.

## Task3 — final gates/publication

- [x] Focused tests then one full regression without competing heavy verification jobs; lint, explicittypes, production build; desktop/mobile keyboard/field-error/retry/reveal/guest/identity/reset/changelog/cardbounds flows, synthetic/local only.
- [x] Independent whole-branch actual-source review, fix valid findings viaRED→GREEN and affected verification; commit and push only after review.
- [ ] READY PR, exacthead/UTCtimestamp/preview; real15minute reviewwindow after initialready and EVERYpush. Read all paginated feedback; fix valid scoped findings, independent beforepush and fresh15min. Fresh independent substitute for unavailable reviewers; no quota retry loops or formal GitHubapprovalreviews. Document dispositions.
- [ ] Refreshhead/base/reviews/permittedstatuses; normal expectedheadmerge onlyifgreen/allowed. Verifymergedstate/remotemain and automaticproductiondeployment terminal outcome. No bypass/manualdeploy/auto-merge/#58 changes.

## Ledger

Currentremote main verifiedd473cd3; priorworktreeclean. No relevant repoAGENTS/local skills found. User approved this package including merge/publication specifically; ordinary design choices delegated. Seven existing scenarios and training run are complete; this package adds only permissions. Prior verified978 baseline is reused rather than rerun before TDD; one full final regression remains required. Tests/build output redirected to private/tmp logs; no credentials.

Task1 RED16failures/7existingdefaultcases→GREEN23puretests. Task2 RED8UI failures and3integration/changelog failures→GREEN78focusedtests across6files. Builder check confirmed six-cell fixture and narrow correction. Independent complete-source review found no confirmed defect and verified unchanged trainingrun. Compact newcard descriptor uses one short word to avoid fixed-card overflow, to be measured in browser.

Final verification: 1011/1011 tests across61files passed via `npm test -- --maxWorkers=2` (197.49s), no competing heavy verification jobs, no failures or timeout changes. Lint, explicittypes and production build exit0. Local production Chromium1440×900/390×844 passed cardbounds, newest-only full changelog, field errors/stale reset, keyboard, guest/no writes, reveal/rubric/newrun, localidentityreset, reload/leave, unchanged curatedtrio and exactly2attempts/2correct after repeated checks. All external browser requests blocked; no account code read/logged and no live cloud/physicalscreenreader claim. Both screenshots inspected before publication. No security/schema/dependency/sharedauth change.
