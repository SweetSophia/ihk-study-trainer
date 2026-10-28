# AP2 Backup Recovery Implementation Plan

> Execute natively with TDD and independent code-inspecting review before every push. User's adopted autonomous workflow authorizes routine transitions and green normal merge; no new approval gate.

**Goal:** Original connected RPO/RTO and restoration-chain exercise.
**Architecture:** Pure fixed-model validators, dedicated React trainer, existing catalog/registry/page/progress flow.
**Tech Stack:** Existing TypeScript/React/Vitest/Playwright; no dependencies/schema changes.
**Spec:** docs/superpowers/specs/2026-10-28-ap2-backup-recovery-design.md
**Owner:** root; branch feat/ap2-backup-recovery; base7cb30857d9a8a88a5bd1c7d859e032cf5c2de9e1.

## Global constraints / review focus
- Preserve all existing IDs and progress; PR58 held, no hosted account testing or denied endpoint access.
- Potential loss is not proven actual loss; target equality passes; snapshot times are not transfer durations.
- Accept both complete latest chains; reject inherited-only answers, missing dependencies, invalid IDs and old terminal states.
- First completed check only, no repeat/reveal/rubric/guest score; identity/new-run reset and stale feedback.
- Accessible named feedback/disclosures, mobile wrapping, generic reasoning example without graded answers.

## Tasks / tracker
- [x] 1. Pure logic: failing tests in src/app/lib/__tests__/backupRecovery.test.ts; implement src/app/lib/backupRecovery.ts exports BACKUPS, RECOVERY, validateTimeline(answers), validateRestoreChain(value), meetsTarget(actual,target). Verify focused RED→GREEN.
- [x] 2. UI/integration: failing component/page/catalog tests; implement BackupRecoveryTrainer.tsx with two objective sections and rubric; wire ap2BackupRecovery in modules/registry/page. Preserve shared recordProgress failures. Verify focused RED→GREEN.
- [x] 3. README and existing changelog factual addition, retain history and sole newest Aktuell. Run full regression, lint, types, build; production desktop/mobile flows. Independent complete-branch review and fix/recheck valid findings before initial push.
- [ ] 4. Publish ready PR; record exact head/publication/deadline. Wait real15minutes; paginate reviews/comments, assess and document substantive dispositions. Independent substitute for unavailable reviewers. Every correction gets focused verification, independent review BEFORE push, fresh15minute window.
- [ ] 5. Refresh head/reviews/mergeability/permitted status evidence, normal expected-head merge if eligible, verify merged main and automatic production deployment. Update tracker. No other unimplemented slice has a concrete approved design: next novel topic needs scoping, not automatic implementation.

## Execution ledger
- Workflow read in full via Library:232lines,14119bytes. Current main7cb3085, only open PR58 held. Existing worktrees preserved; new isolated worktree/work branch.
- gh installed but auth status reports invalid GH_TOKEN; Git reads and GitHub connector work. No credentials changed. Preferred semantic-anchor/Faghan, lean-ctx, jevgrep unavailable; actual source+rg used. No repository AGENTS/SKILL found in relevant .agents locations.
- Ruling: native implementation plus independent final review; reuse installed dependencies and avoid redundant baseline full run (prior main908 tests verified). Concrete ordinary timing/catalog decisions in spec under approved autonomy.

- Task1 RED missing module; GREEN36 pure tests. Task2 RED missing trainer/page/catalog; GREEN59 focused tests across5files, including real page navigation/progress callback failures. No edits to shared storage.

- Independent complete-branch review (Sol/high): no confirmed defects; exhaustive55,986 catalogue-ID sequences accepted only the two intended chains; reviewer independently reran59 focused tests. Connected-section hints are intentional practice, not independent assessment.
- Lint, explicit tsc, production build and Chromium1440/390 passed. Browser exercised both chains, guest/repeat/reveal/rubric/new-run/identity reset, local per-account progress reload, preserved legacy bytes, write-failure warning/no retry; external requests blocked. No hosted persistence or assistive-technology claim.
- First full run949passed/1timeout: unchanged SQL database-close test exceeded its30second budget while checks overlapped. Same test unchanged passed isolated in15.96seconds. Serial full run in progress; no SQL code/config/assertions changed.

- Final serial regression:950/950tests in56files passed with unchanged assertions/configuration. Lint, explicit types, production build, desktop/mobile browser and independent source review passed. Initial timeout is disclosed; no SQL implementation change. Ready to publish after final reviewed-commit confirmation.
