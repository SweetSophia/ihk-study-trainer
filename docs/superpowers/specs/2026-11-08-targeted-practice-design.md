# Targeted practice

## Intent and scope
Replace the automatic jump to the topic with the most lifetime mistakes with an explicit topic choice. Show success rate alongside the number of scored attempts, distinguish small samples, and preserve every existing exercise, grading rule, progress counter and storage contract. Use the complete saved aggregate history, not a recent window. No question replay, spaced repetition, new persistence or readiness prediction.

## Approaches
The user approved an explicit topic selection using existing aggregate history and asked for a concrete plan followed by execution. Retaining automatic selection would still hide the decision; adding per-question history would exceed this package. The implementation choice is a lightweight inline disclosure in the existing progress dashboard rather than a modal or another route. This preserves the current exercise and reuses established navigation.

## Display and navigation
The action becomes “Gezielt üben”. It opens a named region with a close button, explanatory text and selectable topics. Only active, individually scored topics with at least one saved attempt appear. Topics with perfect records remain available. Retired mixed calculation history, unknown IDs and the composite AP2 training run are not selectable; their existing dashboard totals are unchanged. Legacy IDs are normalized and merged without mutating input.

As a display choice, 1–4 attempts get a “Wenige Versuche” label and their own group after topics with at least 5 attempts. Five is not a statistical confidence or readiness threshold. Within groups sort by unrounded success rate ascending, then attempts descending, with stable catalogue order as a tie-breaker. Display the rounded percentage, correct/attempted numbers and “gewertete Versuche”. An empty list explains that no selectable topic has scored history and directs the learner to normal topic navigation.

The disclosure uses a native button with aria-expanded/controls, a named region, keyboard-focusable selection buttons, initial focus at the region heading, Escape/close returning to the opener, and no focus trap. Opening and closing must not generate questions, write progress or discard inputs. Selecting uses Home's existing navigation, including active-module preservation and AP2-run departure confirmation. The stable disclosure opener is the return target when a departure is cancelled. Mobile progress collapse/breakpoint handling remains in Home.

## Counting explanation
These are historical scored attempts, not unique questions or an assessment of exam readiness. Standard individual exercises count their scored check. In the separate SQL trainer, each graded incorrect check and the first successful check count; technical failures do not. In AP2, only the first eligible objective check per section or SQL task counts in each run; retries, self-assessment and parts revealed before checking do not. The training run credits the original topics. No counters are recomputed or corrected.

## Verification
Pin alias merging, low-sample boundaries, ratio ordering, excluded history, zero/perfect records, disclosure keyboard behavior, account reset, active-topic drafts, normal selection and cancelled/confirmed AP2 departures. Run full tests, lint, type checking, production build and local desktop/mobile browser checks. Independent review precedes push; normal PR review and deployment verification follow.
