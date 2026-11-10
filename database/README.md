# Database rollout: synchronized Subnetting replay

`schema.sql` describes a fresh base installation; do not rerun it over an existing installation. The additive migration is `database/migrations/20261110_subnetting_replay.sql`. The non-destructive disable script is `database/rollbacks/20261110_disable_subnetting_replay.sql`. Review the exact files and commit to be deployed before use. This runbook is not evidence that any particular database has been changed or that synchronization works there.

## Behavior and trust boundary

Only future incorrect checks on normal Subnetting questions can be captured. Existing aggregate history cannot reconstruct them. An account can hold at most 100 records; eligibility expires 90 days after creation and expired records are pruned on access. Replays and duplicate saves do not extend creation time. At capacity, the oldest record is evicted. A synchronized clear deletes the account's replay records across devices, not its normal progress. Generation checks prevent old requests from recreating records removed by clear, pruning or eviction. Failed or uncertain writes are not silently retried and there is no local replay fallback.

Each version 1 / `subnetting-v1` snapshot is at most 16384 UTF-8 bytes, with a prompt of at most 2000 characters, 1–40 solution steps of at most 1000 characters each, source 10.x.x.x and CIDR 17–30. It contains the task, expected answers and solution steps, not learner-entered answer text or the access code. Storage also includes account ownership, source attempt identity, creation time and the first unassisted successful replay time. Existing access-code authentication remains the trust boundary: someone who knows an account's code can access its records. Replay does not write aggregate score or streak. Existing progress, question history and authentication objects must remain unchanged.

## Preflight: read-only catalog checks

1. Verify the actual Supabase project backing the intended frontend from trusted deployment configuration, not a similarly named project. Use an authorized connection without pasting secrets into chat, tickets or this document. Confirm the expected client roles and existing base schema below; compare the current object definitions and privileges with the reviewed baseline. Stop on unexpected objects, schema drift, privilege differences or target uncertainty.
2. Verify current backup or point-in-time recovery **and actual restore availability** for this project using the provider's current controls and policies. A healthy or active project status is not proof of recoverability. Record the recovery method and evidence. Do not apply if recovery cannot be established.
3. Review the exact migration, deployment method and the security implications of new RLS tables and `SECURITY DEFINER` RPC grants. Record migration filename, commit and file checksum, target identity, operator and time. Obtain explicit action-specific authorization for this production database change and its security-sensitive settings. A code merge or general feature approval alone is not authorization to apply it.

Run these **catalog-only** queries against the verified target. They inspect metadata, not learner rows. Save the results as a before snapshot, including legacy definitions and privileges for postflight comparison. `public.users.id` must be a UUID primary key, `access_hash` must be compatible with the existing 12-character account lookup and unique, the `anon` and `authenticated` roles must exist, and the base objects/functions must match the reviewed application's contract. The replay objects should be absent on first application; investigate any unexpected pre-existing object rather than overwriting it.

```sql
SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') ORDER BY rolname;

SELECT c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity,
       pg_get_userbyid(c.relowner) AS owner, c.relacl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN
  ('users', 'progress', 'question_history', 'subnetting_replay_state', 'subnetting_replays')
ORDER BY c.relname;

SELECT c.relname, a.attname, format_type(a.atttypid, a.atttypmod) AS type,
       a.attnotnull, pg_get_expr(d.adbin, d.adrelid) AS default_expression
FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE n.nspname = 'public' AND c.relname IN
  ('users', 'progress', 'question_history', 'subnetting_replay_state', 'subnetting_replays')
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

SELECT c.relname, con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN
  ('users', 'progress', 'question_history', 'subnetting_replay_state', 'subnetting_replays')
ORDER BY c.relname, con.conname;

SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'
  AND tablename IN ('users', 'progress', 'question_history', 'subnetting_replay_state', 'subnetting_replays')
ORDER BY tablename, indexname;

SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer, p.proconfig, p.proacl,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND (p.proname IN
  ('check_hash_exists', 'create_user_with_hash', 'get_user_by_hash',
   'get_all_progress', 'upsert_progress', 'record_question')
  OR p.proname LIKE '%subnetting%replay%')
ORDER BY p.proname, arguments;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename IN
  ('users', 'progress', 'question_history', 'subnetting_replay_state', 'subnetting_replays')
ORDER BY tablename, policyname;
```

## Apply and postflight

Prefer database first, then deploy the matching frontend. If the frontend arrives first, it reports the synchronized list unavailable; normal exercises and progress remain separate. After the preflight and authorization, apply the reviewed `database/migrations/20261110_subnetting_replay.sql` once using the approved SQL deployment method. The file contains its own transaction and a PostgREST schema-reload notification. Record actual success or failure and the migration identity. If the outcome is uncertain, inspect the migration history (if the chosen deployment method records one) and catalog state before deciding whether a retry is appropriate; do not blindly repeat an uncertain write.

Repeat the catalog queries above and compare legacy object definitions, constraints, policies, indexes and privileges with the saved baseline. Verify that the new tables, owner/attempt uniqueness, foreign keys, owner/creation index, RLS and reviewed functions match the migration. Confirm no unexpected legacy changes. The following additional catalog-only checks show effective role access; the four entry functions should be executable by `anon` and `authenticated`, the helpers should not be, and direct access to the two tables should be denied. Inspect `proacl`/`relacl` above as well, including `PUBLIC` grants and role inheritance; do not rely on this summary alone.

```sql
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname LIKE '%subnetting%replay%'
ORDER BY p.proname, arguments;

SELECT c.relname, r.rolname,
       has_table_privilege(r.rolname, c.oid, 'SELECT') AS can_select,
       has_table_privilege(r.rolname, c.oid, 'INSERT') AS can_insert,
       has_table_privilege(r.rolname, c.oid, 'UPDATE') AS can_update,
       has_table_privilege(r.rolname, c.oid, 'DELETE') AS can_delete
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN pg_roles r
WHERE n.nspname = 'public' AND c.relname IN ('subnetting_replay_state', 'subnetting_replays')
  AND r.rolname IN ('anon', 'authenticated')
ORDER BY c.relname, r.rolname;
```

`get_subnetting_replays_v1` is **not** a read-only probe: it initializes and locks account state and prunes expired entries. Never run it or any other functional replay RPC against actual learner accounts as a blanket check. Functional acceptance requires an explicitly authorized isolated test account and synthetic data (or an isolated synthetic local database). In two sessions verify capture and exact blank replay, unassisted solved-marker synchronization, unchanged aggregate counts/streak, synchronized clear, and rejection of old-generation writes. Check desktop and mobile layout and keyboard/focus behavior. Record code deployment, migration outcome and authenticated synchronization acceptance as three separate facts; code tests or a build alone do not establish live synchronization.

## Disable and re-enable

After the appropriate production authorization, apply the reviewed `database/rollbacks/20261110_disable_subnetting_replay.sql` to revoke the four entry RPCs from `PUBLIC`, `anon` and `authenticated` and notify PostgREST to reload its schema. It preserves replay tables/data and all existing account/progress objects; it does not drop or purge them. Verify effective privileges with the catalog queries above and investigate inherited grants if access remains. The prior frontend can be redeployed independently if needed.

To re-enable, first repeat target, recovery, review and authorization checks, then reapply the reviewed `database/migrations/20261110_subnetting_replay.sql` using the approved method. It restores the intended narrow grants and reloads the PostgREST schema. Repeat catalog postflight and authorized synthetic acceptance. Record the actual outcome and inspect uncertain outcomes before retrying. Re-enabling does not by itself prove a client can synchronize.
