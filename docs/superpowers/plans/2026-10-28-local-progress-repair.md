# Local Progress Repair Implementation Plan

> Native executing-plans/TDD; one independent whole-branch review before publication.

**Goal:** Isolate local account progress and serialize concurrent increments while preserving legacy bytes.
**Architecture:** Account-keyed validated localStorage and exclusive browser Web Locks inside existing auth fallback. Current-identity page error feedback; hosted RPC path unchanged.
**Tech Stack:** Existing TypeScript/React/Vitest/Playwright; native Web Locks, no dependencies.
**Spec:** docs/superpowers/specs/2026-10-28-local-progress-repair.md

## Constraints and review focus
Legacy ihk_progress is never read/written/deleted. Separate fresh account keys; no automatic attribution or migration. Serialize entire update across tabs, not just writes. Corrupt/unavailable storage must fail without overwriting; no-lock writes fail closed. Errors never include account IDs and cannot leak across identity changes. Preserve Supabase call behavior, module IDs, counts/streaks and existing first-attempt semantics. PR58 untouched.

## Tasks / ledger
- [x] 1. RED auth fallback tests: two identities, unchanged legacy bytes, preserved other modules, held lock delays read/write, queued updates total correctly, corrupt/read/write/no-lock/invalid-account failures; hosted RPC path untouched. Implement keyed helpers/locking/validation and observe GREEN focused tests.
- [x] 2. RED page integration error tests; show accessible current-identity error without resetting successful history, clear on new account/success. Document fallback isolation, retained unassigned legacy and HTTPS/Web Locks requirement. No general auth redesign.
- [ ] 3. Focused and full tests/lint/types/build, desktop/mobile production browser flows with two accounts/signout/relogin/parallel tabs/controlled lock contention/failures/legacy preservation. Independent branch review; fix valid bounded issues. Commit/push ready PR, verify SHA/preview and real15min review window; address valid findings without retrying unavailable bots.
- [ ] 4. Merge repair normally if green/allowed and verify main/automatic production. Merge main into PR66 without force, validate late tests/date wording, focused/full integration as affected, push and real15min review window; merge66 only if green/allowed and verify production. Stop/report denials without bypass.

Ruling: user approved repair and unchanged legacy retention; implementation decisions above stay within that scope. Old history remains retained and unassigned, not displayed as new account progress. One final full verification per resulting code state; repeat only affected checks after small corrections.

Implementation evidence: fallback RED6 failures/1 hosted-path pass → GREEN; page write-failure RED→GREEN. Independent review caught prior streak retention after failed account load, fixed with an actual stale7-versus0 RED→GREEN regression. Initial dashboard test incorrectly queried a hidden logged-out dashboard; corrected to assert its absence and verify zero only after next login. Added UTC streak/overflow/duplicate/corruption/lock-rejection coverage. Browser harness waits for asynchronous alert clearing after persisted counts, rather than assuming UI and storage commit in the same instant. Final verification:846 tests/50 files passed (165.63s); focused13 passed, lint/types/production build passed. Real Chromium desktop1440/mobile390 passed two accounts, signout/relogin, same-account cross-tab lock contention and parallel increments across same/different modules, independent active tab identities, quota/no-lock/corrupt-record failures and byte-exact legacy retention. Browser harness was scoped to the app alert because Next also supplies an empty route-announcer alert. No application change needed for that harness correction. Independent review finding fixed with RED→GREEN stale-streak test; no other confirmed defect. Hosted Supabase persistence unverified.
