import { supabase, isSupabaseConfigured } from './supabase';
import { isValidAccessHash } from './auth';
import {
  isReplayUuid,
  parseSubnettingSnapshot,
  parseSubnettingReplayRecord,
  parseSubnettingReplayState,
  SubnettingReplayError,
  type SubnettingSnapshotV1,
  type SubnettingReplayRecord,
} from './subnettingReplay';

export const isSubnettingReplayConfigured = () => isSupabaseConfigured;

type ChangeResult<S extends string> = { status: S; generation: string; record: SubnettingReplayRecord | null };
type ClearResult = { status: 'cleared' | 'stale'; generation: string };

const invalid = (): never => { throw new SubnettingReplayError('invalid'); };

function check(hash: string, ...ids: string[]) {
  if (!isValidAccessHash(hash) || !ids.every(isReplayUuid)) invalid();
  if (!isSupabaseConfigured) throw new SubnettingReplayError('unavailable');
}

async function call(name: string, args: Record<string, unknown>): Promise<unknown> {
  let response: unknown;
  try {
    response = await supabase.rpc(name, args);
  } catch {
    throw new SubnettingReplayError('transport');
  }
  if (
    !response || typeof response !== 'object' || Array.isArray(response) ||
    !Object.hasOwn(response, 'data') || !Object.hasOwn(response, 'error')
  ) throw new SubnettingReplayError('transport');

  const envelope = response as Record<string, unknown>;
  if (envelope.error !== null) {
    const error = envelope.error;
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    throw new SubnettingReplayError(
      code === 'PGRST202' || code === '42883' || code === 'PGRST205' || code === '42501' || code === '42P01'
        ? 'unavailable' : code === 'P0001' ? 'rejected' : 'transport',
    );
  }
  return envelope.data;
}

function result<S extends string>(value: unknown, statuses: readonly S[], needsRecord: S): ChangeResult<S> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const response = value as Record<string, unknown>;
  if (
    Object.keys(response).length !== 3 || !statuses.includes(response.status as S) ||
    !isReplayUuid(response.generation) || !Object.hasOwn(response, 'record')
  ) return invalid();
  const record = response.record === null ? null : parseSubnettingReplayRecord(response.record);
  if (((response.status === needsRecord) || response.status === 'duplicate') !== (record !== null)) return invalid();
  return { status: response.status as S, generation: response.generation, record };
}

// Compare semantic fields, not JSON object key order (JSONB can reorder keys).
function sameSnapshot(a: SubnettingSnapshotV1, b: SubnettingSnapshotV1): boolean {
  return a.version === b.version && a.validatorVersion === b.validatorVersion &&
    a.ip === b.ip && a.cidr === b.cidr && a.questionText === b.questionText &&
    a.difficulty === b.difficulty &&
    a.solutionSteps.length === b.solutionSteps.length &&
    a.solutionSteps.every((step, index) => step === b.solutionSteps[index]) &&
    (Object.keys(a.expectedAnswers) as Array<keyof SubnettingSnapshotV1['expectedAnswers']>)
      .every(key => a.expectedAnswers[key] === b.expectedAnswers[key]);
}

export async function loadSubnettingReplays(hash: string) {
  check(hash);
  return parseSubnettingReplayState(await call('get_subnetting_replays_v1', { p_hash: hash }));
}

export async function saveSubnettingReplay(
  hash: string,
  generation: string,
  sourceAttemptId: string,
  snapshot: SubnettingSnapshotV1,
) {
  check(hash, generation, sourceAttemptId);
  const valid = parseSubnettingSnapshot(snapshot);
  const response = result(await call('save_subnetting_replay_v1', {
    p_hash: hash,
    p_generation: generation,
    p_source_attempt_id: sourceAttemptId,
    p_snapshot: valid,
  }), ['saved', 'duplicate', 'stale'] as const, 'saved');
  if (response.record && (
    response.record.sourceAttemptId.toLowerCase() !== sourceAttemptId.toLowerCase() ||
    !sameSnapshot(response.record.snapshot, valid)
  )) return invalid();
  return response;
}

export async function resolveSubnettingReplay(hash: string, generation: string, id: string) {
  check(hash, generation, id);
  const response = result(await call('resolve_subnetting_replay_v1', {
    p_hash: hash, p_generation: generation, p_replay_id: id,
  }), ['resolved', 'missing', 'stale'] as const, 'resolved');
  if (response.record && (
    response.record.id.toLowerCase() !== id.toLowerCase() || response.record.resolvedAt === null
  )) return invalid();
  return response;
}

export async function clearSubnettingReplays(hash: string, generation: string): Promise<ClearResult> {
  check(hash, generation);
  const value = await call('clear_subnetting_replays_v1', { p_hash: hash, p_generation: generation });
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const response = value as Record<string, unknown>;
  if (
    Object.keys(response).length !== 2 ||
    (response.status !== 'cleared' && response.status !== 'stale') ||
    !isReplayUuid(response.generation)
  ) return invalid();
  return { status: response.status, generation: response.generation };
}
