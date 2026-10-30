# Signed input and fresh browser verdict follow-up

Execute natively with TDD and independent actual-code review before push. This is a bounded follow-up to the approved decimal input contract: preserve comma/point/exponent strings, unchanged parser/5%/integer/base/scoring behavior; no accounts, dependencies or schema changes.

- Write component RED for absence of a restrictive decimal hint on general signed inputs and actual input-focused Enter with -17,09.
- Preserve type=text; omit the blanket numeric keyboard hint. This selects the ordinary text-input keyboard contract without pretending to verify a real Android/iOS layout.
- Add a test-script-only blocked-submission probe: it must expose the previous stale-verdict false success, then fail with the repaired fresh-state guard. The committed browser script retains all11numeric cases. Negative acceptance is permanently covered by the real-component/validator input-Enter test; an additional local diagnostic on the combined six-head build exercises a generated negative Differenz task with the existing independent cent oracle.
- Require reset/empty old feedback, and a new checked/disabled-input state after submission before inspecting verdict text. Enter regression must focus the input. Preserve separate native-button coverage in the blocked-click probe.
- Focused/full tests, lint/types/build, actual local desktop/narrow Chromium (not real soft keyboard), independent review/exact SHA ACK, normal push to existing Ready PR75, real15-minute review window. Fresh substitute for unavailable bots, no public comments/merge.
- Rehearse all six final PR heads together again; preserve other public heads and all holds.

Ruling: seed installation and module dispatch execute in the same browser turn to prevent asynchronous animation draws from consuming the fixture between automation calls. This keeps the existing fallback policy, without a generator interface change or broad RNG redesign.

## Pre-push verification record

Component RED: two expected failures at the restrictive hint; GREEN70focused tests. Full branch regression1051/1051 in62files passed316.42s. Lint, explicit types and build passed; after the final script-only seed-dispatch adjustment, targeted script lint passed again. Actual local production3137 Chromium at1440/390 passed all11decimal cases per width with input-focused Enter and fresh checked-state assertions. These are desktop/narrow Chromium checks, not a physical soft-keyboard result.

Old guard probe: a first seeded-fixture run timed out; a diagnostic rerun recorded all six intended fixtures and incorrectly succeeded despite deliberately blocking the last submission. After the guard repair the same mutation mode fails at the missing checked/disabled state (3000ms), as required. Its expected failure is not an application failure. Independent actual-code review found no defect. The generated negative-Differenz diagnostic and combined final verification follow after this branch head is committed; post-push real15-minute review remains required. No merge/public summary authorized.
