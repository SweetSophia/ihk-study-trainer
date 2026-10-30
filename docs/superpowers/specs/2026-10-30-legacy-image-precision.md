# Legacy image precision repair

Repair approved audit findings M3 and M4 only, against base `3868890713be1a3fd80d557fbb2a2050a3b19c86`.

## Behavior

- `imageCalc` keeps exact intermediate conversion operands. Rounded final values use an approximation sign and the question states the existing policy: whole units for values at least 1000, two decimal places for values at least 1, otherwise four decimal places.
- `imageTransferCombo` preserves fractional seconds below 60 seconds, rounded to nine decimal places and displayed as ordinary decimals. At or above 60 seconds, retain the existing whole-second, 60-system representation. State this precision in the question and explain rounding in the solution.
- Keep the existing 10% overhead once, all selectable resolutions/depths/rates, canonical module IDs, input keys, difficulty, and historical/progress contracts. Preserve the shared validator's 5% tolerance.
- A combo-local formatter owns fractional precision. The shared bandwidth formatter and its documented hour/minute policy stay unchanged.
- Solution intermediates use unrounded operands and approximation signs wherever values are rounded.
- Describe the supplied 10% overhead as the given model; do not claim it is an official examination standard.

## Verification

Use deterministic XGA/8-bit/GB and GiB image cases, Full-HD/8-bit/100-Mbit/s transfer (preserve `0.1824768 s`), boundary tables around 0.5, 59.5 and 60 seconds, and complete 140-image/420-transfer option matrices. Check final-answer inputs and the real validator for the fractional reproduction. Record RED before implementation and GREEN afterward.

Nine decimal places are required by the existing option range: the smallest exact duration is `0.00000069206016 s`, which rounds to `0.000000692 s`. Six decimal places can exceed the unchanged 5% tolerance, as the exhaustive oracle demonstrated.

No dependencies, shared schema, security, account, config, commerce, SQL, AP2 or new question families. Work remains local and uncommitted; parent coordinates independent review, full suite, build and any external actions. Routine approval gates are waived by the supplied authorization.
