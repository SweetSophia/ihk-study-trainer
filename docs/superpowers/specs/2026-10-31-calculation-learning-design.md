# Calculation learning quality

The user approved explanatory grouped solutions, at most two cautious post-error hints and one additional variant per pure calculation mode. Navigation redesign is deferred. This document records implementation choices within that bounded approval; routine plan gates are waived by the adopted workflow.

## Approach

Retain the existing arithmetic engine, three module IDs, all 16/15/32 answer fields, rounding, strict parser, 5% tolerance, scoring callbacks and reveal behavior. Add a pure learning-content builder and a pure hint selector in `lib/calculationLearning.ts`. Optional `Question.calculationLearning` holds only in-memory row guidance and numeric pattern examples, with no backend/storage changes. StudyCard displays hints only after an objectively wrong completed check. Other modules use their existing feedback.

Each solution step groups its named percentage base (100%), direction/reason, concrete equation and rounded result. No standalone blank steps. Forward/backward explanations share builders with the two differential chains. Explain that the gross price gap is a price comparison, not actual profit; reverse reconstruction can differ by cents due to rounding.

For hints, first defer to the unchanged full validator. Never object to an accepted answer. On a wrong attempt, select at most the first two rejected rows using the same validator with a one-field expected payload. For malformed numbers give an input-format hint. Otherwise use neutral row guidance; an exact rounded numeric match to a demonstrable alternative (wrong Skonto base, subtracting VAT from gross, direct markup instead of reversing a discount, sign reversal) can select a more specific reminder. Numeric coincidence is not evidence of the learner's reasoning: never say “you used/thought/forgot”. Hints do not expose an extra check/retry or cause progress writes. Reset with the existing question lifecycle.

Bind hints to the ID of the question actually checked, so a new question cannot commit hints derived from old answer state before passive reset. Keep detailed guidance outside the atomic correctness live status, in its own named section. Pattern candidates accepted by the existing tolerance remain silent; numerical matches are neutral maths reminders, not causal diagnoses.

## Variants

Keep standard generators intact by default. Dedicated question factories additionally choose a clearly stated special profile in 25% of questions, without mixing modes; explicit optional profile arguments allow deterministic tests.
- Forward: `no-customer-skonto`, customer Skonto explicitly 0%.
- Backward: `no-supplier-rebate`, supplier rebate explicitly 0%.
- Differential: `matching-market`, market gross equals forward gross and the signed gross gap is exactly 0. Bypass rejection of equality only for this intentional profile. Standard positive/negative cases and bounded fallback remain.

All full chains/answer keys remain; zero rows still use the existing exact-zero consequence of 5% tolerance. No hidden randomized grading, learner analytics, paid AI, account access, dependencies, persistence/schema changes or new navigation controls.

## Boundaries and verification

The existing 5% tolerance can accept 3.00 instead of 3.09; hints must remain silent for accepted rows even if a number resembles a different method. Existing solution disclosure and progress policy are preserved rather than borrowing AP2 scoring rules. Original fictional task profiles, no exam reproduction or endorsement.

Prove independent cent-oracle invariants (including half-cent and 0% rows), all variants and negative/positive/zero gaps; contextual bases/divisors and solution values; strict comma/malformed inputs and tolerance boundaries; maximum hints, non-accusatory pattern wording, lifecycle reset and no additional progress calls. Full tests/lint/types/build, local production desktop/narrow Chromium and independent actual-code review before every push. Ready PR and real 15-minute windows after publication/every push. Assess bot claims; independently replace unavailable reviews. No merge/final-summary comment/formal approval without specific authority. PR58 stays held and restricted GitHub check endpoints stay restricted.
