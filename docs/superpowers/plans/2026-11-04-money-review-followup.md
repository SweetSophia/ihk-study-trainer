# Late money review: bounded QA follow-up

Base: main 4b002f0fbd5980de0ea7d39120fb70c23685e89c after merged #84.

The exact-cent product rule, arithmetic, hints, progress and RAID tolerance stay unchanged. This follow-up fixes verification tooling and strengthens its claims.

1. Reproduce the displayed-money oracle's negative-sign defect. Add literal signed/zero-cent and request-classification regressions, then fix sign handling for the whole cent amount. Keep browser reads local and block external reads separately from counted write attempts. Align the manual default with the README's port 3144.
2. Pin the progress fixture to the rendered question; prove an exact valid submission succeeds and a one-cent error fails, while repeated checks/reveal record only one attempt. Mutation-check that removing exact-cent validation is detected.
3. Run focused and full tests, lint, types, build and local production browser checks. Independent actual-code review before push; Ready PR, real 15-minute review window after each push, assess all findings and replace unavailable bots independently. Merge normally only under the authorized workflow and repository rules; observe automatic deployment.

Disposition of other #84 claims:
- Fractional-cent hints deliberately retain the generic row explanation. A rounded match to an alternative is not proof of the learner's method; no causal claim is added.
- A unit-bearing calculation-learning row would need unit keys in its hint validation maps. No shipped calculation-learning row has unit keys. Deferred robustness extension, not a current learner defect.
- Invalid expected cents fail closed. The shared boolean grading API has no infrastructure-error result; all generated expected amounts are checked by existing row/oracle regressions. Adding a throw or new grading result would broaden scope and is deferred.
- No mismatch of the deterministic progress fixture has been demonstrated. Positive-control and rendered-fixture assertions make the existing regression discriminating rather than assuming equivalence.

No changes to #58, real accounts, permissions, dependencies, schema or storage.

## Verification record

- Red: five helper contracts failed on original sign/classification behavior; all 14 pass after correction. Original script reproduction: -12,34 returned -1166 cents, -0,50 returned +50.
- Integration positive/one-cent cases pass; disabling exact-cent validation makes the one-cent case fail, and deliberately changing the fixture variant makes both rendered-fixture assertions fail. Both mutations were restored.
- Independent actual-code pre-push reviewer: no blockers; 14 helper contracts, 11 integration and 113 focused money/hint/generator tests pass.
- Lint has no errors and one existing AuthModal warning; explicit types and production build pass. Full-suite and fresh-server browser results recorded in the PR when complete. An initial browser run overlapped rebuilding its server assets and timed out at its third viewport; final verification uses a fresh server after build completion.

Final local verification: 1,380 Vitest tests in 77 files and 14 separate Node helper contracts pass. Types/build pass; lint has zero errors and the existing AuthModal warning. The corrected browser script passes all 320/390/1440 px flows on the completed production build at local port 3147, with zero write attempts, zero external reads and no browser errors. No application runtime files changed. Hosted interaction and live persistence remain unverified.
