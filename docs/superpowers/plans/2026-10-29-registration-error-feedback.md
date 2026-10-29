# Registration error feedback plan

**Approved scope:** Small AuthModal feedback repair; prepare and review a ready PR. Scope initially stopped before merge; explicit new user approval at2026-10-29 10:03:20UTC now authorizes normal green merge and automatic deployment verification. No auto-merge, manual deployment, database/config/security changes, live credentials, PR58 or training-run work.
**Base/owner:** main59bd38f4c983c7b19b47499fea817904ec57abe6; root; fix/registration-error-feedback.
**Design:** Keep existing callback contracts, sanitized messages and success flow. Move the existing error panel outside the mode-specific branch so create-code failures and post-creation login failures are visible. Give it role=alert and a stable ID; associate login errors with the existing input. Clear obsolete errors when explicitly switching views. No automatic request retry or backend-detail rendering. A backend outage and this missing feedback are separate concerns.
**Approach:** One shared alert covers all three existing views; separate duplicated panels risk drift, broader auth refactoring is unnecessary. Routine implementation choices are covered by the user's adopted autonomous workflow, without reopening approval gates.

## Tracker
- [x] Write failing AuthModal regressions: null/thrown registration failure; sanitized exception; successful registration/login; created-code retention on failed login; existing login error association; view-change/reopen reset; no automatic retries.
- [x] Minimal shared-alert implementation, focused RED→GREEN.
- [x] Full regression, lint/types/build, synthetic local desktop/mobile browser checks. Independent actual-source review before initial/every push; fix validated scoped findings.
- [ ] Push and publish READY PR; exact head/UTC timestamp; summary; actual15minute window after ready/every subsequent push. Assess all paginated comments/reviews and automatic preview; fresh independent substitute for unavailable bots. After final green review/window, normal expected-head merge and verify automatic production deployment under the new explicit approval. Never bypass protections.

## Verification limits / ledger
- Fresh main and clean source worktree checked; earlier worktrees and held PR58 preserved. No repository AGENTS/SKILL found in relevant .agents paths; installed dependencies reused, no dependency edits.
- Prior diagnosis reproduced hidden null/rejected registration errors and hidden post-creation login errors in-memory without network/account writes. Supabase restored and same-browser A/B acceptance passed separately per parent; cross-device remains unverified. This fix uses synthetic fixtures only.
- Native TDD plus independent review; one final full suite, repeat affected checks only if subsequent changes justify it. No broader implementation started.

- TDD RED:5 new regressions fail on missing alert;9existing/success tests pass. Minimal shared alert + login error association + obsolete-view error clearing implemented next.
- Authorization update: explicit user question/answer10:03:20UTC permits merging this fix after successful tests/reviews and observing its normal automatic publication; initial no-merge boundary superseded for this fix only, PR58 still held.

- Independent prepush review found stale async login failure after Back; reproduced3deferred regressions (oldloginfailure; oldregistrationfailure/success acrossclose/reopen) RED while14other tests stayedgreen. Modal view-generation guard now ignores obsolete modal completions while preserving busy state until the callback settles. It does not cancel callbacks or their parent/backend side effects; no automatic retry or account action added.
- Initial explicit typecheck caught a test-only Testing Library option mismatch (exact on getByRole); removed the unsupported option (string role names already match exactly).

- Review follow-up caught that clearing busy state during a pending parent login could enable overlapping parent auth effects. New serialization regression and reopen-busy assertions RED; removed busy resets on view changes/reopen and preserved unconditional original pending-completion cleanup. Obsolete modal results remain guarded, but a second auth submission stays disabled until the first callback settles. No parent/auth API changes.

- Final focused check exposed a test selector expecting Anmelden while the correctly disabled pending button says Anmeldung läuft.... Corrected that selector, retaining serialization assertions. Premature full run interrupted; no passing suite claimed from it.

- Final focused18/18passed; premature full process explicitly interrupted(exit130), clean final regression started after confirmed GREEN. No product assertion weakened.

- Final verification:960/960regression tests(56files,170.32s); final18/18AuthModal tests after behavior-preserving ref-object capture (removes React DOM-ref cleanup lint false positive without suppressing lint). Final lint clean, explicit types and production build pass. Final production Chromium1440/390 synthetic failure/sanitization/keyboard/error association/view reset/local fallback success pass; external requests blocked, no live accounts or IDs logged. Independent reviewer rechecked final three-file patch and both resolved P2 findings; no remaining blockers.
