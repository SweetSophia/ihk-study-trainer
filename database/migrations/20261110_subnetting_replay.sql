BEGIN;

CREATE TABLE IF NOT EXISTS public.subnetting_replay_state (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  generation uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS public.subnetting_replays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_attempt_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (user_id, source_attempt_id)
);

CREATE INDEX IF NOT EXISTS subnetting_replays_owner_created_idx
  ON public.subnetting_replays (user_id, created_at, id);
ALTER TABLE public.subnetting_replay_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subnetting_replays ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subnetting_replay_state, public.subnetting_replays
  FROM PUBLIC, anon, authenticated;

-- Render JSON without separator whitespace, matching the wire-size limit.
CREATE OR REPLACE FUNCTION public.subnetting_replay_compact_v1(v jsonb)
RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE
  result text;
BEGIN
  CASE jsonb_typeof(v)
    WHEN 'object' THEN
      SELECT '{' || coalesce(
        string_agg(to_json(k)::text || ':' || public.subnetting_replay_compact_v1(val), ',' ORDER BY k),
        ''
      ) || '}' INTO result
      FROM jsonb_each(v) e(k, val);
    WHEN 'array' THEN
      SELECT '[' || coalesce(
        string_agg(public.subnetting_replay_compact_v1(val), ',' ORDER BY ord),
        ''
      ) || ']' INTO result
      FROM jsonb_array_elements(v) WITH ORDINALITY e(val, ord);
    ELSE
      result := v::text;
  END CASE;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.subnetting_replay_valid_v1(s jsonb)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE
  ip text;
  c integer;
  addr inet;
  net inet;
  bcast inet;
  mask inet;
  a jsonb;
  step jsonb;
BEGIN
  IF jsonb_typeof(s) <> 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(s)) <> 8
    OR NOT (s ?& ARRAY[
      'version', 'validatorVersion', 'ip', 'cidr', 'questionText',
      'expectedAnswers', 'solutionSteps', 'difficulty'
    ]) THEN
    RETURN false;
  END IF;

  IF s->'version' <> '1'::jsonb
    OR s->'validatorVersion' <> '"subnetting-v1"'::jsonb
    OR jsonb_typeof(s->'ip') <> 'string'
    OR jsonb_typeof(s->'cidr') <> 'number'
    OR s->>'cidr' !~ '^(1[7-9]|2[0-9]|30)$'
    OR jsonb_typeof(s->'questionText') <> 'string'
    OR char_length(s->>'questionText') > 2000
    OR jsonb_typeof(s->'difficulty') <> 'string'
    OR s->>'difficulty' NOT IN ('easy', 'medium', 'hard')
    OR octet_length(public.subnetting_replay_compact_v1(s)) > 16384 THEN
    RETURN false;
  END IF;

  ip := s->>'ip';
  c := (s->>'cidr')::integer;
  IF left(s->>'questionText', char_length('Gegeben: IP-Adresse ' || ip || '/' || c || E'\n'))
    <> 'Gegeben: IP-Adresse ' || ip || '/' || c || E'\n' THEN
    RETURN false;
  END IF;
  IF ip !~ '^10\.(0|[1-9][0-9]{0,2})\.(0|[1-9][0-9]{0,2})\.(0|[1-9][0-9]{0,2})$' THEN
    RETURN false;
  END IF;
  BEGIN
    addr := ip::inet;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;
  net := network(set_masklen(addr, c));
  bcast := broadcast(set_masklen(addr, c));
  mask := netmask(set_masklen(addr, c));
  a := s->'expectedAnswers';

  IF jsonb_typeof(a) <> 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(a)) <> 6
    OR NOT (a ?& ARRAY['networkId', 'broadcast', 'hostMin', 'hostMax', 'subnetMask', 'usableHosts']) THEN
    RETURN false;
  END IF;
  IF a->'networkId' <> to_jsonb(host(net))
    OR a->'broadcast' <> to_jsonb(host(bcast))
    OR a->'hostMin' <> to_jsonb(host(net + 1))
    OR a->'hostMax' <> to_jsonb(host(bcast - 1))
    OR a->'subnetMask' <> to_jsonb(host(mask))
    OR a->'usableHosts' <> to_jsonb((2 ^ (32 - c) - 2)::integer) THEN
    RETURN false;
  END IF;
  IF jsonb_typeof(s->'solutionSteps') <> 'array' THEN RETURN false; END IF;
  IF jsonb_array_length(s->'solutionSteps') NOT BETWEEN 1 AND 40 THEN RETURN false; END IF;
  FOR step IN SELECT value FROM jsonb_array_elements(s->'solutionSteps') LOOP
    IF jsonb_typeof(step) <> 'string' OR char_length(step #>> '{}') > 1000 THEN
      RETURN false;
    END IF;
  END LOOP;
  RETURN true;
EXCEPTION WHEN others THEN
  RETURN false;
END $$;

CREATE OR REPLACE FUNCTION public.subnetting_replay_owner_v1(h text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  u uuid;
BEGIN
  IF h IS NULL OR h !~ '^[A-Za-z0-9]{12}$' THEN RAISE EXCEPTION 'invalid account'; END IF;
  SELECT id INTO u FROM public.users WHERE access_hash = h;
  IF u IS NULL THEN RAISE EXCEPTION 'invalid account'; END IF;
  INSERT INTO public.subnetting_replay_state(user_id) VALUES (u) ON CONFLICT DO NOTHING;
  PERFORM 1 FROM public.subnetting_replay_state WHERE user_id = u FOR UPDATE;
  RETURN u;
END $$;

CREATE OR REPLACE FUNCTION public.subnetting_replay_prune_v1(u uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  n integer;
BEGIN
  DELETE FROM public.subnetting_replays
    WHERE user_id = u AND created_at <= now() - interval '90 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n > 0 THEN
    UPDATE public.subnetting_replay_state SET generation = gen_random_uuid() WHERE user_id = u;
  END IF;
  RETURN n > 0;
END $$;

CREATE OR REPLACE FUNCTION public.subnetting_replay_record_v1(r public.subnetting_replays)
RETURNS jsonb
LANGUAGE sql STABLE SET search_path = pg_catalog AS $$
  SELECT jsonb_build_object(
    'id', r.id, 'sourceAttemptId', r.source_attempt_id, 'snapshot', r.snapshot,
    'createdAt', r.created_at, 'resolvedAt', r.resolved_at
  )
$$;

CREATE OR REPLACE FUNCTION public.get_subnetting_replays_v1(p_hash text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  u uuid;
  g uuid;
  records jsonb;
BEGIN
  u := public.subnetting_replay_owner_v1(p_hash);
  PERFORM public.subnetting_replay_prune_v1(u);
  SELECT generation INTO g FROM public.subnetting_replay_state WHERE user_id = u;
  SELECT coalesce(
    jsonb_agg(public.subnetting_replay_record_v1(r) ORDER BY r.created_at DESC, r.id DESC),
    '[]'::jsonb
  ) INTO records FROM public.subnetting_replays r WHERE r.user_id = u;
  RETURN jsonb_build_object('generation', g, 'records', records);
END $$;

CREATE OR REPLACE FUNCTION public.save_subnetting_replay_v1(
  p_hash text, p_generation uuid, p_source_attempt_id uuid, p_snapshot jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  u uuid;
  g uuid;
  r public.subnetting_replays;
  had boolean;
  removed boolean;
BEGIN
  u := public.subnetting_replay_owner_v1(p_hash);
  SELECT generation INTO g FROM public.subnetting_replay_state WHERE user_id = u;
  IF p_generation IS NULL OR p_source_attempt_id IS NULL THEN RAISE EXCEPTION 'invalid input'; END IF;
  IF p_generation <> g THEN
    RETURN jsonb_build_object('status', 'stale', 'generation', g, 'record', NULL);
  END IF;
  IF NOT coalesce(public.subnetting_replay_valid_v1(p_snapshot), false) THEN
    RAISE EXCEPTION 'invalid snapshot';
  END IF;

  SELECT * INTO r FROM public.subnetting_replays
    WHERE user_id = u AND source_attempt_id = p_source_attempt_id;
  had := FOUND;
  -- A live duplicate is strictly side-effect-free, even if other rows expired.
  IF had AND r.created_at > now() - interval '90 days' THEN
    IF r.snapshot <> p_snapshot THEN RAISE EXCEPTION 'invalid snapshot'; END IF;
    RETURN jsonb_build_object(
      'status', 'duplicate', 'generation', g, 'record', public.subnetting_replay_record_v1(r)
    );
  END IF;

  removed := public.subnetting_replay_prune_v1(u);
  SELECT generation INTO g FROM public.subnetting_replay_state WHERE user_id = u;
  IF had THEN
    RETURN jsonb_build_object('status', 'stale', 'generation', g, 'record', NULL);
  END IF;
  IF (SELECT count(*) FROM public.subnetting_replays WHERE user_id = u) >= 100 THEN
    DELETE FROM public.subnetting_replays WHERE id = (
      SELECT id FROM public.subnetting_replays WHERE user_id = u ORDER BY created_at, id LIMIT 1
    );
    IF NOT removed THEN
      UPDATE public.subnetting_replay_state SET generation = gen_random_uuid()
        WHERE user_id = u RETURNING generation INTO g;
    END IF;
  END IF;
  INSERT INTO public.subnetting_replays(user_id, source_attempt_id, snapshot)
    VALUES (u, p_source_attempt_id, p_snapshot) RETURNING * INTO r;
  RETURN jsonb_build_object(
    'status', 'saved', 'generation', g, 'record', public.subnetting_replay_record_v1(r)
  );
END $$;

CREATE OR REPLACE FUNCTION public.resolve_subnetting_replay_v1(
  p_hash text, p_generation uuid, p_replay_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  u uuid;
  g uuid;
  r public.subnetting_replays;
BEGIN
  u := public.subnetting_replay_owner_v1(p_hash);
  SELECT generation INTO g FROM public.subnetting_replay_state WHERE user_id = u;
  IF p_generation IS NULL OR p_replay_id IS NULL THEN RAISE EXCEPTION 'invalid input'; END IF;
  IF p_generation <> g THEN
    RETURN jsonb_build_object('status', 'stale', 'generation', g, 'record', NULL);
  END IF;
  IF public.subnetting_replay_prune_v1(u) THEN
    SELECT generation INTO g FROM public.subnetting_replay_state WHERE user_id = u;
    RETURN jsonb_build_object('status', 'stale', 'generation', g, 'record', NULL);
  END IF;
  UPDATE public.subnetting_replays SET resolved_at = coalesce(resolved_at, now())
    WHERE user_id = u AND id = p_replay_id RETURNING * INTO r;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'missing', 'generation', g, 'record', NULL);
  END IF;
  RETURN jsonb_build_object(
    'status', 'resolved', 'generation', g, 'record', public.subnetting_replay_record_v1(r)
  );
END $$;

CREATE OR REPLACE FUNCTION public.clear_subnetting_replays_v1(p_hash text, p_generation uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  u uuid;
  g uuid;
BEGIN
  u := public.subnetting_replay_owner_v1(p_hash);
  SELECT generation INTO g FROM public.subnetting_replay_state WHERE user_id = u;
  IF p_generation IS NULL THEN RAISE EXCEPTION 'invalid input'; END IF;
  IF p_generation <> g THEN RETURN jsonb_build_object('status', 'stale', 'generation', g); END IF;
  DELETE FROM public.subnetting_replays WHERE user_id = u;
  UPDATE public.subnetting_replay_state SET generation = gen_random_uuid()
    WHERE user_id = u RETURNING generation INTO g;
  RETURN jsonb_build_object('status', 'cleared', 'generation', g);
END $$;

REVOKE ALL ON FUNCTION
  public.subnetting_replay_compact_v1(jsonb),
  public.subnetting_replay_valid_v1(jsonb),
  public.subnetting_replay_owner_v1(text),
  public.subnetting_replay_prune_v1(uuid),
  public.subnetting_replay_record_v1(public.subnetting_replays)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION
  public.get_subnetting_replays_v1(text),
  public.save_subnetting_replay_v1(text, uuid, uuid, jsonb),
  public.resolve_subnetting_replay_v1(text, uuid, uuid),
  public.clear_subnetting_replays_v1(text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.get_subnetting_replays_v1(text),
  public.save_subnetting_replay_v1(text, uuid, uuid, jsonb),
  public.resolve_subnetting_replay_v1(text, uuid, uuid),
  public.clear_subnetting_replays_v1(text, uuid)
  TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
