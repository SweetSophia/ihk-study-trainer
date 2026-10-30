# Decimal input follow-up implementation plan

> Execute natively with Superpowers TDD, verification and a fresh independent review before push.

Goal: preserve the existing strict comma/point/exponent parser contract at the browser input boundary. Spec: `../specs/2026-10-30-legacy-input-contracts-design.md`.

Architecture: numeric structured answers use text controls with a decimal keyboard hint; explicit structured text (IPv4) keeps its text behavior. Validation alone decides whether a decimal, integer or base-specific answer is valid. No grouping inference, rounding, tolerance, module-ID or scoring changes.

- [ ] Add actual local Chromium regression for typed 0,75/0.75, exponents and malformed complete strings; observe comma corruption before fixing.
- [ ] Add real-component/validator regressions. Change the shared numeric control to preserve strings; keep explicit text and generic/base inputs intact.
- [ ] Run focused contracts, full tests, lint/types/build and desktop/mobile regression against the final build.
- [ ] Fresh independent actual-code review; commit/push only this branch, verify exact remote head and ready status. Wait a real15minutes, classify feedback; no merge/public review summary.

Review focus: comma must never become 75; malformed suffix/mixed/grouped/nonfinite values must remain rejectable; exponent acceptance and integer/base restrictions survive; no keyboard scoring duplication; mobile keyboard hint does not narrow parser syntax.

Ruling: no routine approval gate—the parent explicitly approved this bounded repair and native workflow. Preserve other late optional nits and all external-action holds.

## Verification record

Actual pre-fix production Chromium failed at the first comma input: typed0,75 became075. Real-component RED:10failed/1passed (31unrelatedskipped). After the minimal control repair,69focusedtests and the entire1050-test/62-file suite passed (364.17s), plus lint, explicit type-check and production build. Final production3135 Chromium1440/390 passed11typed cases per width (comma, point, two exponent forms, malformed suffixes/mixed separators/grouping/overflow), keyboard submission, no overflow/page errors or account-progress writes. The committed browser script is the same behavioral regression used for RED/GREEN, converted to native ESM to satisfy repository lint. Initial script lint failure (CommonJS imports) was corrected before final verification. Fresh independent actual-code review found no issue. Final combined integration and post-push review remain required; merge/public review summaries remain held.
