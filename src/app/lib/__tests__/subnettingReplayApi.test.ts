import { beforeEach, expect, it, vi } from 'vitest';
const setup = vi.hoisted(() => ({ configured: true, rpc: vi.fn() }));
vi.mock('../supabase', () => ({ get isSupabaseConfigured() { return setup.configured; }, supabase: { rpc: setup.rpc } }));
import { loadSubnettingReplays, saveSubnettingReplay, clearSubnettingReplays } from '../subnettingReplayApi';
import { createSubnettingSnapshot } from '../subnettingReplay';
import { generateSubnettingQuestion } from '../generators/subnetting';
const hash='Abcdef123456', generation='11111111-1111-4111-8111-111111111111', attempt='22222222-2222-4222-8222-222222222222';
beforeEach(() => { setup.configured=true; setup.rpc.mockReset(); });
it('uses the exact load and save RPC contracts', async () => {
  setup.rpc.mockResolvedValueOnce({data:{generation,records:[]},error:null});
  expect(await loadSubnettingReplays(hash)).toEqual({generation,records:[]});
  expect(setup.rpc).toHaveBeenCalledWith('get_subnetting_replays_v1',{p_hash:hash});
  const snapshot=createSubnettingSnapshot(generateSubnettingQuestion());
  setup.rpc.mockResolvedValueOnce({data:{status:'stale',generation,record:null},error:null});
  expect(await saveSubnettingReplay(hash,generation,attempt,snapshot)).toEqual({status:'stale',generation,record:null});
  expect(setup.rpc).toHaveBeenLastCalledWith('save_subnetting_replay_v1',{p_hash:hash,p_generation:generation,p_source_attempt_id:attempt,p_snapshot:snapshot});
});
it('fails closed for invalid input, missing configuration, bad response and transport errors without leaking credentials', async () => {
  await expect(loadSubnettingReplays('bad')).rejects.toMatchObject({code:'invalid'}); expect(setup.rpc).not.toHaveBeenCalled();
  setup.configured=false; await expect(loadSubnettingReplays(hash)).rejects.toMatchObject({code:'unavailable'});
  setup.configured=true; setup.rpc.mockResolvedValueOnce({data:null,error:{code:'PGRST202',message:hash}});
  await expect(loadSubnettingReplays(hash)).rejects.toMatchObject({code:'unavailable'});
  setup.rpc.mockRejectedValueOnce(new Error(hash)); await expect(loadSubnettingReplays(hash)).rejects.toMatchObject({code:'transport'});
  setup.rpc.mockResolvedValueOnce({data:{status:'cleared',generation,unexpected:1},error:null});
  await expect(clearSubnettingReplays(hash,generation)).rejects.toMatchObject({code:'invalid'});
});
it('rejects impossible status and record combinations', async () => {
  const snapshot=createSubnettingSnapshot(generateSubnettingQuestion());
  setup.rpc.mockResolvedValueOnce({data:{status:'duplicate',generation,record:null},error:null});
  await expect(saveSubnettingReplay(hash,generation,attempt,snapshot)).rejects.toMatchObject({code:'invalid'});
});
it('resolves through the exact RPC and rejects malformed returned records', async () => {
  const {resolveSubnettingReplay}=await import('../subnettingReplayApi');
  setup.rpc.mockResolvedValueOnce({data:{status:'missing',generation,record:null},error:null});
  expect(await resolveSubnettingReplay(hash,generation,attempt)).toEqual({status:'missing',generation,record:null});
  expect(setup.rpc).toHaveBeenCalledWith('resolve_subnetting_replay_v1',{p_hash:hash,p_generation:generation,p_replay_id:attempt});
  setup.rpc.mockResolvedValueOnce({data:{status:'resolved',generation,record:{id:attempt}},error:null});
  await expect(resolveSubnettingReplay(hash,generation,attempt)).rejects.toMatchObject({code:'invalid'});
});
it('rejects a valid response for a different replay than requested', async () => {
  const {resolveSubnettingReplay}=await import('../subnettingReplayApi');
  const snapshot=createSubnettingSnapshot(generateSubnettingQuestion());
  setup.rpc.mockResolvedValueOnce({data:{status:'resolved',generation,record:{id:'33333333-3333-4333-8333-333333333333',sourceAttemptId:attempt,snapshot,createdAt:'2026-11-10T00:00:00Z',resolvedAt:'2026-11-10T00:01:00Z'}},error:null});
  await expect(resolveSubnettingReplay(hash,generation,attempt)).rejects.toMatchObject({code:'invalid'});
});
it.each(['saved', 'duplicate'] as const)('rejects a %s response with different snapshot content', async status => {
  const snapshot = createSubnettingSnapshot(generateSubnettingQuestion());
  setup.rpc.mockResolvedValueOnce({data:{status,generation,record:{id:'33333333-3333-4333-8333-333333333333',sourceAttemptId:attempt,snapshot:{...snapshot,solutionSteps:['changed']},createdAt:'2026-11-10T00:00:00Z',resolvedAt:null}},error:null});
  await expect(saveSubnettingReplay(hash,generation,attempt,snapshot)).rejects.toMatchObject({code:'invalid'});
});
it.each([null, {}, {data:null}, {data:null,error:undefined}])('sanitizes malformed RPC envelope %#', async envelope => {
  setup.rpc.mockResolvedValueOnce(envelope);
  await expect(loadSubnettingReplays(hash)).rejects.toMatchObject({name:'SubnettingReplayError',code:'transport'});
});
it('accepts an equal snapshot when JSONB has reordered object keys', async () => {
  const snapshot = createSubnettingSnapshot(generateSubnettingQuestion());
  const reordered = Object.fromEntries(Object.entries({
    ...snapshot, expectedAnswers: Object.fromEntries(Object.entries(snapshot.expectedAnswers).reverse()),
  }).reverse());
  setup.rpc.mockResolvedValueOnce({data:{status:'saved',generation,record:{id:'33333333-3333-4333-8333-333333333333',sourceAttemptId:attempt,snapshot:reordered,createdAt:'2026-11-10T00:00:00Z',resolvedAt:null}},error:null});
  expect((await saveSubnettingReplay(hash,generation,attempt,snapshot)).status).toBe('saved');
});
