# AP2 Datensicherung: Wiederherstellung und RPO/RTO

Approved recovery scope (2026-10-28); routine details settled under the user's autonomous workflow. Original fictional workshop exercise, Baden-Württemberg emphasis, no official exam endorsement or source exam content.

## Fixed model and semantics
All times are on the same fictional working day, elapsed minutes, no time zones or overnight arithmetic. File service unavailable at10:00; service including acceptance checks restored at11:10 in a supplied completed recovery drill. Latest reconstructible data state09:40. RPO target maximum30minutes; RTO target maximum90minutes, measured from outage to accepted service. Equality meets a target. Potential data-loss window20minutes; outage70minutes; both targets met. This is not proof that records were actually lost or a promise about future recoveries.

Backup catalogue: F1 full08:00; I1 incremental09:00 requiresF1; I2 incremental09:40 requiresI1; I3 incremental09:55 requiresX (missing); F2 full08:30; I4 incremental09:40 requiresF2. Listed files are available and integrity-checked; X is unavailable, no alternative logs/snapshots exist. Times indicate captured data states, not job start/end. Each incremental needs its named predecessor AND that predecessor's chain. F2 is independent and does not replaceF1 as I1's base. Either F1,I1,I2 or F2,I4 reconstructs latest09:40. No unrelated extra images; chain starts with one full backup and proceeds in dependency order. Earlier reconstructible states are usable but do not answer the requested latest-state task. I3 alone does not prove09:55 recoverable. No restore duration is inferred from chain length.

## Learning flow and grading
1. Enter potential loss and outage in whole minutes, and separately classify RPO/RTO met/missed. Trimmed ASCII digits only, safe nonnegative integers; no units, signs, decimal or exponent. Field-specific accessible feedback; correct methods accepted through results.
2. Enter an ordered comma-separated chain of catalogue IDs. Trim whitespace per token, case-sensitive exact IDs, no duplicates/empty/unknown tokens. Validate availability, full start, exact dependencies and target state; accept both valid alternatives, show actionable field feedback. No generic backup planner.
3. Explain isolation, integrity/application/permissions checks and acceptance responsibilities using session-only written reasoning and rubric. No correctness or score for prose. Generic reasoning example must not disclose objective results or chain IDs.

First completed objective check per section/run only (including blank/wrong), max2. Reveal before checking makes only that section unscored, sticky after hiding; repeated checks, later reveals, rubric and reasoning never add points. Edits clear stale feedback. Guest checks never persist; keyed identity reset and explicit warning; new run resets all draft/reveal/rubric state. Preserve existing module IDs/progress; new ap2BackupRecovery ID. Reuse dedicated trainer/page recordProgress callback and existing failure display. No schema/dependencies, learner command execution, network actions or live-data migration.

## Approach
Use a dedicated trainer with pure fixed-scenario validators, like the existing AP2 cost exercise. Extending random drills loses connected two-section flow; a general restoration simulator adds unapproved complexity. No interpreter or broad backup engine.

## Verification and limits
Pure tests for exact values, equality targets, malformed/unsafe/prototype inputs, both chains, gaps/order/duplicates/unknown/old states. Component/integration tests for accessibility, stale reset, wrong/repeat/reveal/guest/login/new-run and persistence failure. Full tests/lint/types/build plus local production desktop/mobile browser. Independent source review before every push. Ready PR, real15minute windows after publication/every push, assess feedback and substitute unavailable bots independently; normal expected-head merge and automatic deployment verification if green. PR58 untouched. Hosted browser/live Supabase persistence remain separate and unverified; no denied-route retries.
