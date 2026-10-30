# Original SQL feedback repair

## Scope

Repair audit findings SQL-1, SQL-3 and SQL-5 in the original standalone SQL trainer: visible accessible feedback, fair treatment of technical failures, and retention of the current exercise/query until a replacement succeeds. No new task families, grader numeric semantics, worker/resource architecture, generation preflight, dependencies, backend, schema or account changes. Preserve AP2 behavior and module/progress IDs. PR #58 stays held.

## Behavior

- Call the existing `gradeSqlAnswer` option `{ rejectInfrastructureErrors: true }` only from this trainer. SQL learner errors remain unsuccessful attempts. Engine/fixture failures remain retryable without either scoring callback. Preserve successful-first-only scoring and existing incorrect-retry policy.
- Render a permanent polite, atomic status region outside exercise/loading conditions. Announce loading/checking and the final result. Keep new technical-failure messages generic; do not expose private engine/provider details.
- Keep the old exercise, query and completed guard while requesting a replacement. Disable grading and query editing during that request. Replace exercise, clear query and reset the guard only on a current successful response; retain them on failure.
- Continue invalidating stale requests/checks on new requests, identity changes and unmount. Associate feedback with its identity so old feedback is hidden immediately after a transition.

## Verification

Regressions cover initial/replacement rejection, rate-limit feedback without an exercise, draft retention, completed-guard retention, successful replacement reset, strict infrastructure classification, unscored technical failures, learner syntax failures, pending/final status, repetition and identity transitions.

Browser acceptance uses the actual component with synthetic action/grading fixtures in a private local harness, plus the final production stylesheet. This permits error/retry/identity checks without creating accounts or contacting AI/Supabase. Distinguish this harness from real production service acceptance. Full regression, lint, explicit types, production build and independent code inspection precede publication.
