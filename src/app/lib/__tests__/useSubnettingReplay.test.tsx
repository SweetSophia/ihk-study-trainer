import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useSubnettingReplay } from '../useSubnettingReplay';
import * as api from '../subnettingReplayApi';
import { GENERATORS } from '../generators/registry';
vi.mock('../subnettingReplayApi', () => ({ isSubnettingReplayConfigured: vi.fn(() => true), loadSubnettingReplays: vi.fn(), saveSubnettingReplay: vi.fn(), resolveSubnettingReplay: vi.fn(), clearSubnettingReplays: vi.fn() }));
const state = { generation: '11111111-1111-4111-8111-111111111111', records: [] };
const deferred = <T,>() => { let resolve!: (value:T) => void; const promise = new Promise<T>(r => {resolve=r}); return {promise,resolve}; };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.isSubnettingReplayConfigured).mockReturnValue(true); });
it('bootstraps eagerly and reports an early wrong attempt unsaved without backfill', async () => {
 const load = deferred<typeof state>(); vi.mocked(api.loadSubnettingReplays).mockReturnValue(load.promise);
 const { result } = renderHook(() => useSubnettingReplay('account-a'));
 expect(api.loadSubnettingReplays).toHaveBeenCalledWith('account-a');
 act(() => result.current.capture(GENERATORS.subnetting(), crypto.randomUUID()));
 expect(result.current.message).toMatch(/nicht.*gespeichert/);
 await act(async () => {load.resolve(state); await load.promise;});
 expect(result.current.status).toBe('ready');
 expect(api.saveSubnettingReplay).not.toHaveBeenCalled();
});
it('rejects a delayed A response after A to B to A session changes', async () => {
 const old = deferred<typeof state>();
 vi.mocked(api.loadSubnettingReplays).mockReturnValueOnce(old.promise).mockResolvedValueOnce(state).mockResolvedValueOnce({...state, generation:'22222222-2222-4222-8222-222222222222'});
 const {result,rerender} = renderHook(({hash})=>useSubnettingReplay(hash), {initialProps:{hash:'A'}});
 rerender({hash:'B'}); rerender({hash:'A'});
 await waitFor(()=>expect(result.current.generation).toBe('22222222-2222-4222-8222-222222222222'));
 await act(async()=>{old.resolve(state); await old.promise;});
 expect(result.current.generation).toBe('22222222-2222-4222-8222-222222222222');
});
it('keeps the displayed record during refresh but removes it when the server reports it gone', async () => {
 const record = { id:'record', sourceAttemptId:'attempt', snapshot:{} as never, createdAt:'2026-11-10T00:00:00Z', resolvedAt:null };
 const load = deferred<typeof state>();
 vi.mocked(api.loadSubnettingReplays).mockResolvedValueOnce({...state, records:[record]}).mockReturnValueOnce(load.promise);
 const {result} = renderHook(()=>useSubnettingReplay('A'));
 await waitFor(()=>expect(result.current.records).toHaveLength(1));
 act(()=>{void result.current.refresh()});
 expect(result.current.status).toBe('loading'); expect(result.current.records).toHaveLength(1);
 await act(async()=>{load.resolve(state);await load.promise;});
 expect(result.current.records).toHaveLength(0);
});
it('ignores delayed writes from a previous A session after A to B to A', async () => {
 const pending = deferred<Awaited<ReturnType<typeof api.saveSubnettingReplay>>>();
 vi.mocked(api.loadSubnettingReplays).mockResolvedValue(state);
 vi.mocked(api.saveSubnettingReplay).mockReturnValue(pending.promise);
 const {result,rerender} = renderHook(({hash})=>useSubnettingReplay(hash),{initialProps:{hash:'A'}});
 await waitFor(()=>expect(result.current.status).toBe('ready'));
 act(()=>result.current.capture(GENERATORS.subnetting(),crypto.randomUUID()));
 rerender({hash:'B'}); rerender({hash:'A'}); await waitFor(()=>expect(result.current.status).toBe('ready'));
 const calls = vi.mocked(api.loadSubnettingReplays).mock.calls.length;
 await act(async()=>{pending.resolve({status:'stale',generation:state.generation,record:null});await pending.promise;});
 expect(api.loadSubnettingReplays).toHaveBeenCalledTimes(calls);
 expect(result.current.message).toBeNull();
});
it('never requests remote history when it is unconfigured', async () => {
 vi.mocked(api.isSubnettingReplayConfigured).mockReturnValue(false);
 const {result} = renderHook(()=>useSubnettingReplay('A'));
 expect(result.current.status).toBe('unavailable');
 act(()=>result.current.capture(GENERATORS.subnetting(),crypto.randomUUID()));
 expect(result.current.message).toMatch(/nicht.*gespeichert/);
 expect(api.loadSubnettingReplays).not.toHaveBeenCalled(); expect(api.saveSubnettingReplay).not.toHaveBeenCalled();
});
it('refreshes once on stale writes without retrying the write', async () => {
 vi.mocked(api.loadSubnettingReplays).mockResolvedValue(state);
 vi.mocked(api.saveSubnettingReplay).mockResolvedValue({status:'stale',generation:state.generation,record:null});
 const {result}=renderHook(()=>useSubnettingReplay('A'));
 await waitFor(()=>expect(result.current.status).toBe('ready'));
 act(()=>result.current.capture(GENERATORS.subnetting(),crypto.randomUUID()));
 await waitFor(()=>expect(api.loadSubnettingReplays).toHaveBeenCalledTimes(2));
 expect(api.saveSubnettingReplay).toHaveBeenCalledTimes(1);
 expect(result.current.message).toMatch(/nicht gespeichert/);
});
it('does not retry an uncertain write or claim it succeeded', async () => {
 vi.mocked(api.loadSubnettingReplays).mockResolvedValue(state);
 vi.mocked(api.saveSubnettingReplay).mockRejectedValue(new Error('network'));
 const {result}=renderHook(()=>useSubnettingReplay('A'));
 await waitFor(()=>expect(result.current.status).toBe('ready'));
 act(()=>result.current.capture(GENERATORS.subnetting(),crypto.randomUUID()));
 await waitFor(()=>expect(result.current.message).toMatch(/nicht bestätigt/));
 expect(api.saveSubnettingReplay).toHaveBeenCalledTimes(1); expect(api.loadSubnettingReplays).toHaveBeenCalledTimes(1);
});
it('invalidates in-flight writes immediately at an account transition', async () => {
 const pending=deferred<Awaited<ReturnType<typeof api.saveSubnettingReplay>>>();
 vi.mocked(api.loadSubnettingReplays).mockResolvedValue(state); vi.mocked(api.saveSubnettingReplay).mockReturnValue(pending.promise);
 const {result}=renderHook(()=>useSubnettingReplay('A'));
 await waitFor(()=>expect(result.current.status).toBe('ready'));
 act(()=>result.current.capture(GENERATORS.subnetting(),crypto.randomUUID()));
 act(()=>result.current.invalidate());
 await act(async()=>{pending.resolve({status:'stale',generation:state.generation,record:null});await pending.promise;});
 expect(api.loadSubnettingReplays).toHaveBeenCalledTimes(1);
 expect(result.current.message).toBeNull();
});
it('rebootstraps even when a new session uses the same account', async () => {
 vi.mocked(api.loadSubnettingReplays).mockResolvedValue(state);
 const {result,rerender}=renderHook(({session})=>useSubnettingReplay('A',session),{initialProps:{session:1}});
 await waitFor(()=>expect(result.current.status).toBe('ready'));
 rerender({session:2}); await waitFor(()=>expect(api.loadSubnettingReplays).toHaveBeenCalledTimes(2));
 await waitFor(()=>expect(result.current.status).toBe('ready'));
});
it('invalidates an older capture reply after a successful clear', async () => {
 const pending=deferred<Awaited<ReturnType<typeof api.saveSubnettingReplay>>>();
 vi.mocked(api.loadSubnettingReplays).mockResolvedValue(state);
 vi.mocked(api.saveSubnettingReplay).mockReturnValue(pending.promise);
 vi.mocked(api.clearSubnettingReplays).mockResolvedValue({status:'cleared',generation:'22222222-2222-4222-8222-222222222222'});
 const {result}=renderHook(()=>useSubnettingReplay('A')); await waitFor(()=>expect(result.current.status).toBe('ready'));
 act(()=>{result.current.capture(GENERATORS.subnetting(),crypto.randomUUID());result.current.clear();});
 await waitFor(()=>expect(result.current.message).toMatch(/wurden gelöscht/));
 const count=vi.mocked(api.loadSubnettingReplays).mock.calls.length;
 await act(async()=>{pending.resolve({status:'stale',generation:state.generation,record:null});await pending.promise;});
 expect(api.loadSubnettingReplays).toHaveBeenCalledTimes(count);
 expect(result.current.message).toMatch(/wurden gelöscht/);
});
it.each(['unavailable','invalid'] as const)('does not expose records when bootstrap returns %s', async code => {
 const {SubnettingReplayError}=await import('../subnettingReplay');
 vi.mocked(api.loadSubnettingReplays).mockRejectedValue(new SubnettingReplayError(code));
 const {result}=renderHook(()=>useSubnettingReplay('A'));
 await waitFor(()=>expect(result.current.status).toBe('unavailable'));
 expect(result.current.records).toEqual([]);
 act(()=>result.current.capture(GENERATORS.subnetting(),crypto.randomUUID()));
 expect(result.current.message).toMatch(/nicht.*gespeichert/); expect(api.saveSubnettingReplay).not.toHaveBeenCalled();
});
it('reports an unsaved attempt if a secure source identity is unavailable', async () => {
 vi.mocked(api.loadSubnettingReplays).mockResolvedValue(state);
 const {result}=renderHook(()=>useSubnettingReplay('A')); await waitFor(()=>expect(result.current.status).toBe('ready'));
 act(()=>result.current.capture(GENERATORS.subnetting(),null));
 expect(result.current.message).toMatch(/nicht.*gespeichert/); expect(api.saveSubnettingReplay).not.toHaveBeenCalled();
});

it('clears an obsolete load failure after a successful explicit refresh', async () => {
 vi.mocked(api.loadSubnettingReplays).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(state);
 const {result}=renderHook(()=>useSubnettingReplay('A'));
 await waitFor(()=>expect(result.current.status).toBe('unavailable'));
 expect(result.current.message).toBe('Fehlerliste konnte nicht geladen werden.');
 await act(async()=>{await result.current.refresh();});
 expect(result.current.status).toBe('ready');
 expect(result.current.message).toBeNull();
});
it('preserves an uncertain-write warning across a successful explicit refresh', async () => {
 vi.mocked(api.loadSubnettingReplays).mockResolvedValue(state);
 vi.mocked(api.saveSubnettingReplay).mockRejectedValue(new Error('network'));
 const {result}=renderHook(()=>useSubnettingReplay('A'));
 await waitFor(()=>expect(result.current.status).toBe('ready'));
 act(()=>result.current.capture(GENERATORS.subnetting(),crypto.randomUUID()));
 await waitFor(()=>expect(result.current.message).toMatch(/nicht bestätigt/));
 const warning=result.current.message;
 await act(async()=>{await result.current.refresh();});
 expect(result.current.status).toBe('ready');
 expect(result.current.message).toBe(warning);
 expect(api.saveSubnettingReplay).toHaveBeenCalledTimes(1);
});
