# Account-synchronized Subnetting mistake replay

## Intent and chosen approach

The user chose account synchronization after comparing browser-local storage with an extension to the existing database. They approved the practical-check/replay package and their established independent-review, PR, bot-review and merge workflow. Build one bounded Subnetting-only release; no local substitute for account synchronization. Previous aggregate scores cannot recover old tasks, so capture begins only after this feature is available. The original practical-check report remains honest: guest desktop was tested, but authenticated production desktop/mobile acceptance had no signed-in test session.

Browser-local storage was simpler but would not follow the account to a phone or another PC. The selected design uses the existing Supabase account boundary with new narrow RPCs and separate tables. It never stores learner answer text, rewrites aggregate scores, or relies on Supabase Auth's auth.uid(), because this app uses bearer access codes instead.

## User-visible contract

- A newly checked, incorrect, normal Subnetting exercise is saved once when signed in and synchronized history is available. Opening/skipping/correct checks/guest/replay checks never capture a snapshot.
- Store and replay the exact prompt, synthetic source IP/CIDR, expected six values, solution steps and difficulty. No fabricated backfill or new randomly similar task labeled as an old error.
- Entry: “Gespeicherte Subnetting-Fehler”, separate from “Gezielt üben”. Explain future-only capture, synchronization, max 100 saved tasks, 90-day eligibility, and unchanged original progress. Empty state does not infer anything from aggregate errors.
- Replay has blank fields, a new session identity and “Wiederholung · ohne Wertung”. A dedicated callback validates it without calling normal scoring. Replay never changes attempts, correct counts, streaks, accuracy or the original record.
- “Erneut versuchen” restarts the same snapshot, “Zurück zur Fehlerliste” returns to the list; opening another list item selects another saved task. Do not silently generate a scored question from replay's Next/Skip controls.
- A successful replay without earlier solution reveal sets a monotonic “In einer Wiederholung gelöst” marker. No retry counters or detailed event archive are needed. Wrong or assisted retries leave that historical marker unchanged. Current-session feedback still shows the actual result. “everRevealed” is latched until a new replay session, even if the solution is hidden again.
- Queue inspection alone preserves the normal exercise/draft. Keep its component mounted but inactive, disable window-level keyboard shortcuts, and make hidden controls noninteractive. Entering a replay is a real module transition, using the existing AP2 run departure confirmation. Returning to normal Subnetting creates an explicitly normal question; a replay cannot become a scored normal task.
- Loading/failure/missing-migration/unsupported-version/stale-list states are explicit. Never advertise synchronization as successful after an uncertain write. No automatic resending of a score to repair missing history.
- “Gespeicherte Fehler löschen” asks once for confirmation and clears this account's replay records on all devices, never the aggregate progress. Cancel is the default focus. A successful clear invalidates outstanding old capture/resolve requests.

## Snapshot and API contract

`src/app/lib/subnettingReplay.ts` defines:
- `SubnettingSnapshotV1`: `{ version: 1, validatorVersion: 'subnetting-v1', ip: string, cidr: number, questionText: string, expectedAnswers: { networkId: string, broadcast: string, hostMin: string, hostMax: string, subnetMask: string, usableHosts: number }, solutionSteps: string[], difficulty: 'easy'|'medium'|'hard' }`.
- `SubnettingReplayRecord`: `{ id: string, sourceAttemptId: string, snapshot: SubnettingSnapshotV1, createdAt: string, resolvedAt: string|null }`.
- `SubnettingReplayState`: `{ generation: string, records: SubnettingReplayRecord[] }`.
- Snapshot creation accepts only generator-compatible synthetic 10.x.x.x IPv4, integer CIDR 17..30 and internally consistent six values. Strings are bounded (prompt 2000 chars, solution array 1..40 strings each <=1000 chars), total serialized snapshot <=16384 UTF-8 bytes. No extra keys/foreign fields. Client and server both validate. Versioned replay grading pins current strict IPv4/exact integer semantics rather than silently changing old snapshots with future validators.
- Generated theme/module are fixed on reconstruction; a replay `Question.id` is session-specific and never reused as a globally unique capture key. Use fresh UUID source-attempt identities, stable for the original normal question's first eligible check.

`src/app/lib/subnettingReplayApi.ts` wraps only these RPCs, with sanitized errors and strict response validation:
1. `get_subnetting_replays_v1(p_hash)` -> state.
2. `save_subnetting_replay_v1(p_hash, p_generation uuid, p_source_attempt_id uuid, p_snapshot jsonb)` -> `{ status: 'saved'|'duplicate'|'stale', generation: string, record: SubnettingReplayRecord|null }`.
3. `resolve_subnetting_replay_v1(p_hash, p_generation uuid, p_replay_id uuid)` -> `{ status: 'resolved'|'missing'|'stale', generation: string, record: SubnettingReplayRecord|null }`.
4. `clear_subnetting_replays_v1(p_hash, p_generation uuid)` -> `{ status: 'cleared'|'stale', generation: string }`.

API camelCase JSON fields exactly match the TypeScript shapes. `loadSubnettingReplays(hash)`, `saveSubnettingReplay(hash,generation,sourceAttemptId,snapshot)`, `resolveSubnettingReplay(hash,generation,id)` and `clearSubnettingReplays(hash,generation)` are the exported client methods. Expose `isSubnettingReplayConfigured` based on existing Supabase configuration. Missing RPC/schema is unavailable, not an empty successful queue. No durable browser cache/offline upload queue or silent local fallback.

## Server ownership, idempotence and bounds

Create separate `subnetting_replay_state` (one row per user, generation UUID) and `subnetting_replays` tables. Snapshot rows contain UUID primary ID, owner FK, source-attempt UUID, immutable JSON snapshot, server creation time and nullable first resolved time. Unique `(user_id, source_attempt_id)`. User deletion cascades. No access code, raw learner answers or full account object is copied into these tables.

Enable RLS and deny direct table access to PUBLIC/anon/authenticated. Narrow SECURITY DEFINER RPCs use a fixed safe search_path and schema-qualified tables. Private validators/helpers have no PUBLIC/anon/authenticated EXECUTE grants. Public entry RPCs resolve the owner from the validated existing bearer code and uniformly reject missing/invalid accounts; never trust an owner ID supplied by the caller. A foreign record ID yields the same missing result as an absent record. Existing authentication strength is unchanged; do not claim encrypted-at-rest per-user secrecy or tamper-proof scoring.

Every mutation locks the owner's state row. A UUID generation supplied by the client must equal the locked generation. Clear rotates it atomically. Pruning/evicting records also rotates it, preventing old captured requests from resurrecting removed data; return the current generation so the client can refresh. Stale requests make no write and produce an explicit stale result.

Capture duplicate checking is before removal of the same source ID: a live identical source-attempt snapshot returns duplicate without changing any data/time. Same ID with different snapshot is invalid. If that existing source record expired, prune and rotate generation, return stale, and never reinsert it. Fresh capture may prune other expired rows and evict oldest `(created_at,id)` to remain at 100, rotate generation, then insert and return saved with the new generation. Concurrent pending clients on the previous generation get stale and must refresh. This tradeoff prefers honest missed synchronization over resurrecting cleared history; no silent automatic retries.

Expire eligibility at `created_at <= now() - interval '90 days'`; retrying never extends retention. Remove expired rows on history RPC access, except that a live identical duplicate capture is side-effect-free and does not prune unrelated expired rows. Document on-access cleanup, not guaranteed physical deletion while the account is unused. State row is constant size. No unbounded retry/event/tombstone table. Resolve updates only a live existing owned row and sets `resolved_at = coalesce(resolved_at, now())`; repeated resolve is idempotent. It never inserts/captures or modifies progress. Expired/missing records cannot be recreated by an outcome.

## Client isolation and failure behavior

Eagerly bootstrap history/generation on each authenticated account session, not only when the queue is opened. Show connection/loading/unavailable status in the replay entry. A wrong check before bootstrap succeeds is normally graded but explicitly reported as not saved for replay; do not silently queue or backfill it once loading finishes. On account/logout change invalidate all state requests, pending navigation and active replay. Guard every async result by captured account and session revision, not only hash equality (A -> B -> A must not accept old A responses). Preserve monotonic request ordering for list refreshes. Load/refresh on opening the queue and explicit refresh; no unbounded polling. A queued async write stays bound to its original account and generation, and its reply cannot populate a different/current-new session.

Capture requires known current generation/configuration. A synchronous first-check guard prevents double capture even with rapid keyboard/click events. Save failure never changes normal grading or retries normal progress. The existing progress API can return null on a failure: do not claim a captured snapshot proves the aggregate write succeeded. Once a snapshot is copied, it has no references to mutable input state.

After a save/resolve/clear, refresh the current account list with request guards. Show stale/missing status and reload rather than automatically repeating writes. Any records from corrupt or unsupported responses are not runnable; do not fall into normal scored mode. Render plain text, never HTML. Privacy copy states that generated task details, initial failure and first successful unassisted replay marker are stored with the existing provider and anyone with the access code can read them.

## Migration, release and rollback

Add `database/migrations/20261110_subnetting_replay.sql`, transactional, rerunnable with compatible existing shape, additive to existing users/progress/question_history. Do not rerun base schema or alter old scoring RPCs. Include schema cache notification. Validate normal/anon/authenticated permissions and functional behavior using installed PGlite in tests, including the real base schema and the real migration.

Add `database/rollbacks/20261110_disable_subnetting_replay.sql`: revoke entry RPC execution and notify cache, preserving replay data and every old table. Application rollback to the previous commit is safe because old code ignores new tables. Dropping records/tables is not the default rollback and requires separate explicit destructive approval. Reapplying the migration restores only intended narrow permissions.

Before any production application, identify the actual Supabase project, verify schema compatibility and backup/recovery status, inspect the exact migration, and obtain any action-time authorization required for security-sensitive grants/RLS. No service keys in chat, logs or commits. Supabase plugin was discovered as available but is not connected; no production SQL capability or project identity is established yet. Continue code/PR work and report deployment as a separate blocker instead of inventing access or bypassing restrictions.

Frontend remains safe before migration: normal training works and history reports unavailable. Do not claim the synchronized feature is live until migration and authenticated two-session read/write verification pass. Follow the user's ready-for-review PR, independent review before push, 15-minute bot review/recheck, valid-issue fixes and normal green merge workflow. A bot failure gets an independent substitute review.

## Verification

Test mathematical/snapshot boundaries, malicious/oversized shapes, UUID/schema validation, account isolation, denied direct table/helper access, foreign/missing IDs, duplicate/mismatched captures, 100-row capacity, 90-day boundary, clear/prune generations, no resurrection, resolve idempotence, unchanged aggregate rows, migration rerun and non-destructive rollback. Test same-record reset, assisted reveal-hide, queue keyboard isolation/draft preservation, AP2 cancel/confirm, account races, missing RPC/transport failures and zero normal progress writes from every replay path. Run full tests with two workers, lint, TypeScript, production build and independent whole-branch review. Real browser checks must distinguish controlled synthetic/local behavior from actual hosted synchronization; missing authenticated session remains a reported limit.
