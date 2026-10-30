# Precision locale assertions follow-up

Execute natively with TDD and independent review before push. Scope is tests only: preserve all numerical expected values, display policy and tolerance from the image precision design.

- [ ] Reproduce existing intermediate assertion failures under deterministic en-US/de-DE/fr-FR/ru-RU number formatting.
- [ ] Normalize only the known locale's group/decimal separators in test text; assert every expected intermediate operation/result is matched, including 0/2/4/6 lines for image targets and all six combo operand/result checks.
- [ ] Exercise missing/corrupt intermediate detection, retain final-answer and independent mathematical checks across140/420 cases per locale. No production changes.
- [ ] Focused tests, full verification and independent actual-code review; commit/push this branch only, real15-minute review window. No merge/public summary.

Ruling: no new locale input policy or numerical changes in this PR; the shared decimal-control correction belongs only to #75. Keep other optional nits deferred.

## Verification record

The locale-expanded tests first failed6cases/passed2cases against the previous assertions. After the assertion repair all42focusedtests pass, including a second run with LANG=fr_FR.UTF-8. A disposable test-only probe removed MiB intermediates; the new count assertion correctly failed (2matches instead of4). Probe removed after execution. Lint, explicit type-check and production build passed. No production values or formatting changed. Fresh independent actual-code review found no issue. Final combined six-head verification and post-push review remain required; no merge/public summary authorized.
