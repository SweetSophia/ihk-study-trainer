BEGIN;

-- Disable the entry points while preserving replay and existing account data.
REVOKE ALL ON FUNCTION
  public.get_subnetting_replays_v1(text),
  public.save_subnetting_replay_v1(text, uuid, uuid, jsonb),
  public.resolve_subnetting_replay_v1(text, uuid, uuid),
  public.clear_subnetting_replays_v1(text, uuid)
  FROM PUBLIC, anon, authenticated;
NOTIFY pgrst, 'reload schema';

COMMIT;
