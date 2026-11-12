// @vitest-environment node
import { beforeAll, afterAll, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { generateSubnettingQuestion } from '../generators/subnetting';
import { createSubnettingSnapshot } from '../subnettingReplay';
const db = new PGlite();
const migration = 'database/migrations/20261110_subnetting_replay.sql';
const hash='Abcdef123456', other='Zbcdef123456';
let snapshot: ReturnType<typeof createSubnettingSnapshot>;
const rpc = async (name:string, args:unknown[]) => (await db.query<{result:unknown}>(`SELECT public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) AS result`,args)).rows[0].result as any; // eslint-disable-line @typescript-eslint/no-explicit-any
beforeAll(async () => {
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
  await db.exec(readFileSync('database/schema.sql','utf8'));
  await db.exec(readFileSync(migration,'utf8'));
  await db.query('INSERT INTO public.users(access_hash) VALUES ($1),($2)',[hash,other]);
  snapshot=createSubnettingSnapshot(generateSubnettingQuestion());
},60000);
afterAll(async () => db.close());
it('isolates owners, deduplicates and resolves without changing scores', async () => {
  const a=await rpc('get_subnetting_replays_v1',[hash]); const b=await rpc('get_subnetting_replays_v1',[other]);
  const id='22222222-2222-4222-8222-222222222222';
  const saved=await rpc('save_subnetting_replay_v1',[hash,a.generation,id,JSON.stringify(snapshot)]);
  expect(saved.status).toBe('saved');
  expect((await rpc('save_subnetting_replay_v1',[hash,a.generation,id,JSON.stringify(snapshot)])).status).toBe('duplicate');
  expect((await rpc('resolve_subnetting_replay_v1',[other,b.generation,saved.record.id])).status).toBe('missing');
  const resolved=await rpc('resolve_subnetting_replay_v1',[hash,a.generation,saved.record.id]);
  expect(resolved.status).toBe('resolved');
  expect((await rpc('resolve_subnetting_replay_v1',[hash,a.generation,saved.record.id])).record.resolvedAt).toBe(resolved.record.resolvedAt);
  expect((await db.query('SELECT * FROM public.progress')).rows).toHaveLength(0);
  await expect(rpc('get_subnetting_replays_v1',['invalid'])).rejects.toThrow();
});
it('denies direct tables and private helpers to anon while granting only entry RPCs', async () => {
  await db.exec('SET ROLE anon');
  try { await expect(db.query('SELECT * FROM public.subnetting_replays')).rejects.toThrow(/permission denied/i);
    await expect(db.query('SELECT public.subnetting_replay_owner_v1($1)',[hash])).rejects.toThrow(/permission denied/i);
    expect((await rpc('get_subnetting_replays_v1',[hash])).records).toHaveLength(1);
  } finally { await db.exec('RESET ROLE'); }
});
it('clear rotates generation and rollback preserves data while migration restores grants', async () => {
  const state=await rpc('get_subnetting_replays_v1',[hash]);
  const cleared=await rpc('clear_subnetting_replays_v1',[hash,state.generation]);
  expect(cleared.generation).not.toBe(state.generation);
  expect((await rpc('save_subnetting_replay_v1',[hash,state.generation,'22222222-2222-4222-8222-222222222222',JSON.stringify(snapshot)])).status).toBe('stale');
  await db.exec(readFileSync('database/rollbacks/20261110_disable_subnetting_replay.sql','utf8'));
  await db.exec('SET ROLE anon'); try { await expect(rpc('get_subnetting_replays_v1',[hash])).rejects.toThrow(/permission denied/i); } finally { await db.exec('RESET ROLE'); }
  await db.exec(readFileSync(migration,'utf8'));
  await db.exec('SET ROLE anon'); try { expect((await rpc('get_subnetting_replays_v1',[hash])).records).toHaveLength(0); } finally { await db.exec('RESET ROLE'); }
});

it('rejects mismatched prompt and malformed or oversized snapshots', async () => {
  const state=await rpc('get_subnetting_replays_v1',[hash]);
  const id='33333333-3333-4333-8333-333333333333';
  for (const bad of [{...snapshot,questionText:'Gegeben: IP-Adresse 10.0.0.1/24\\nwrong'}, {...snapshot, extra:'x'}, {...snapshot,solutionSteps:Array(40).fill('😀'.repeat(500))}]) {
    await expect(rpc('save_subnetting_replay_v1',[hash,state.generation,id,JSON.stringify(bad)])).rejects.toThrow(/invalid snapshot/);
  }
});
it('rotates generation at eviction and prevents a removed capture from returning', async () => {
  let state=await rpc('get_subnetting_replays_v1',[other]);
  const first='44444444-4444-4444-8444-444444444444';
  const old=await rpc('save_subnetting_replay_v1',[other,state.generation,first,JSON.stringify(snapshot)]);
  await db.query(`INSERT INTO public.subnetting_replays(user_id,source_attempt_id,snapshot,created_at)
    SELECT u.id,gen_random_uuid(),$2::jsonb,now() FROM public.users u, generate_series(1,99) WHERE u.access_hash=$1`,[other,JSON.stringify(snapshot)]);
  await db.query('UPDATE public.subnetting_replays SET created_at=now()-interval \'1 day\' WHERE id=$1',[old.record.id]);
  const added=await rpc('save_subnetting_replay_v1',[other,state.generation,'55555555-5555-4555-8555-555555555555',JSON.stringify(snapshot)]);
  expect(added.status).toBe('saved'); expect(added.generation).not.toBe(state.generation);
  expect((await rpc('save_subnetting_replay_v1',[other,state.generation,first,JSON.stringify(snapshot)])).status).toBe('stale');
  state=await rpc('get_subnetting_replays_v1',[other]); expect(state.records).toHaveLength(100); expect(state.records.some((r:{id:string})=>r.id===old.record.id)).toBe(false);
});
it('prunes an expired duplicate and blocks resurrection at the 90-day boundary', async () => {
  const state=await rpc('get_subnetting_replays_v1',[hash]);
  const id='66666666-6666-4666-8666-666666666666';
  const saved=await rpc('save_subnetting_replay_v1',[hash,state.generation,id,JSON.stringify(snapshot)]);
  await db.query("UPDATE public.subnetting_replays SET created_at=now()-interval '90 days' WHERE id=$1",[saved.record.id]);
  const expired=await rpc('save_subnetting_replay_v1',[hash,state.generation,id,JSON.stringify(snapshot)]);
  expect(expired.status).toBe('stale'); expect(expired.generation).not.toBe(state.generation);
  expect((await rpc('save_subnetting_replay_v1',[hash,state.generation,id,JSON.stringify(snapshot)])).status).toBe('stale');
  expect((await rpc('get_subnetting_replays_v1',[hash])).records).toHaveLength(0);
});
it('rejects mismatched duplicate snapshots without modifying the stored record', async () => {
  const state=await rpc('get_subnetting_replays_v1',[hash]); const id='77777777-7777-4777-8777-777777777777';
  const saved=await rpc('save_subnetting_replay_v1',[hash,state.generation,id,JSON.stringify(snapshot)]);
  await expect(rpc('save_subnetting_replay_v1',[hash,state.generation,id,JSON.stringify({...snapshot,solutionSteps:['different']})])).rejects.toThrow(/invalid snapshot/);
  const loaded=await rpc('get_subnetting_replays_v1',[hash]); expect(loaded.records[0]).toEqual(saved.record);
});
it('enforces the same compact UTF-8 byte boundary as the client', async () => {
  const {parseSubnettingSnapshot}=await import('../subnettingReplay');
  const candidate={...snapshot,solutionSteps:Array(17).fill('')};
  const base=Buffer.byteLength(JSON.stringify(candidate)); let remaining=16384-base;
  for (let i=0;i<candidate.solutionSteps.length;i++) { const n=Math.min(1000,remaining); candidate.solutionSteps[i]='x'.repeat(n); remaining-=n; }
  expect(remaining).toBe(0); expect(Buffer.byteLength(JSON.stringify(candidate))).toBe(16384);
  expect(parseSubnettingSnapshot(candidate)).toEqual(candidate);
  const state=await rpc('get_subnetting_replays_v1',[hash]);
  expect((await rpc('save_subnetting_replay_v1',[hash,state.generation,'88888888-8888-4888-8888-888888888888',JSON.stringify(candidate)])).status).toBe('saved');
  candidate.solutionSteps[16]+='x'; expect(() => parseSubnettingSnapshot(candidate)).toThrow();
  await expect(rpc('save_subnetting_replay_v1',[hash,state.generation,'99999999-9999-4999-8999-999999999999',JSON.stringify(candidate)])).rejects.toThrow(/invalid snapshot/);
});
it('denies authenticated direct access and private helpers', async () => {
  await db.exec('SET ROLE authenticated');
  try { await expect(db.query('SELECT * FROM public.subnetting_replay_state')).rejects.toThrow(/permission denied/i);
    await expect(db.query('SELECT public.subnetting_replay_valid_v1($1::jsonb)',[JSON.stringify(snapshot)])).rejects.toThrow(/permission denied/i);
    expect((await rpc('get_subnetting_replays_v1',[hash])).records.length).toBeGreaterThan(0);
  } finally { await db.exec('RESET ROLE'); }
});
it('prunes expired source attempts before judging a mismatched old capture', async () => {
  const state=await rpc('get_subnetting_replays_v1',[hash]); const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const saved=await rpc('save_subnetting_replay_v1',[hash,state.generation,id,JSON.stringify(snapshot)]);
  await db.query("UPDATE public.subnetting_replays SET created_at=now()-interval '90 days' WHERE id=$1",[saved.record.id]);
  const response=await rpc('save_subnetting_replay_v1',[hash,state.generation,id,JSON.stringify({...snapshot,solutionSteps:['different']})]);
  expect(response.status).toBe('stale'); expect(response.generation).not.toBe(state.generation);
});
it('leaves unrelated expired rows and generation untouched for a live duplicate', async () => {
  const state = await rpc('get_subnetting_replays_v1', [hash]);
  const liveId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const expiredId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const live = await rpc('save_subnetting_replay_v1', [hash, state.generation, liveId, JSON.stringify(snapshot)]);
  const expired = await rpc('save_subnetting_replay_v1', [hash, state.generation, expiredId, JSON.stringify(snapshot)]);
  await db.query("UPDATE public.subnetting_replays SET created_at=now()-interval '90 days' WHERE id=$1", [expired.record.id]);
  const before = (await db.query('SELECT id, created_at, resolved_at FROM public.subnetting_replays ORDER BY id')).rows;
  const duplicate = await rpc('save_subnetting_replay_v1', [hash, state.generation, liveId, JSON.stringify(snapshot)]);
  expect(duplicate).toEqual({status:'duplicate',generation:state.generation,record:live.record});
  expect((await db.query('SELECT id, created_at, resolved_at FROM public.subnetting_replays ORDER BY id')).rows).toEqual(before);
  const storedState = await db.query<{generation:string}>('SELECT s.generation FROM public.subnetting_replay_state s JOIN public.users u ON u.id=s.user_id WHERE u.access_hash=$1', [hash]);
  expect(storedState.rows[0].generation).toBe(state.generation);
});
it('rollback blocks every entry point and preserves nonempty state, replay, progress, and history', async () => {
  const rollbackHash = 'Rollback1234';
  await db.query('INSERT INTO public.users(access_hash) VALUES ($1)', [rollbackHash]);
  const initial = await rpc('get_subnetting_replays_v1', [rollbackHash]);
  const saved = await rpc('save_subnetting_replay_v1', [rollbackHash, initial.generation,
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd', JSON.stringify(snapshot)]);
  await db.query(`INSERT INTO public.progress(user_id,module,questions_attempted,questions_correct)
    SELECT id,'subnetting',5,3 FROM public.users WHERE access_hash=$1`, [rollbackHash]);
  await db.query(`INSERT INTO public.question_history(user_id,module,question_type,was_correct,user_answer,correct_answer)
    SELECT id,'subnetting','normal',false,'synthetic answer','synthetic expected'
    FROM public.users WHERE access_hash=$1`, [rollbackHash]);
  const tables = ['subnetting_replay_state', 'subnetting_replays', 'progress', 'question_history'];
  const readRows = async () => Promise.all(tables.map(async table =>
    (await db.query(`SELECT t.* FROM public.${table} t JOIN public.users u ON u.id=t.user_id WHERE u.access_hash=$1 ORDER BY t.user_id`, [rollbackHash])).rows));
  const before = await readRows();
  expect(before.every(rows => rows.length > 0)).toBe(true);
  const entryCalls: [string, unknown[]][] = [
    ['get_subnetting_replays_v1', [rollbackHash]],
    ['save_subnetting_replay_v1', [rollbackHash, initial.generation, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', JSON.stringify(snapshot)]],
    ['resolve_subnetting_replay_v1', [rollbackHash, initial.generation, saved.record.id]],
    ['clear_subnetting_replays_v1', [rollbackHash, initial.generation]],
  ];
  const signatures = [
    'public.get_subnetting_replays_v1(text)',
    'public.save_subnetting_replay_v1(text,uuid,uuid,jsonb)',
    'public.resolve_subnetting_replay_v1(text,uuid,uuid)',
    'public.clear_subnetting_replays_v1(text,uuid)',
  ];
  try {
    await db.exec(readFileSync('database/rollbacks/20261110_disable_subnetting_replay.sql', 'utf8'));
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      try {
        for (const [name, args] of entryCalls) await expect(rpc(name, args)).rejects.toThrow(/permission denied/i);
      } finally { await db.exec('RESET ROLE'); }
    }
    expect(await readRows()).toEqual(before);
    await db.exec(readFileSync(migration, 'utf8'));
    expect(await readRows()).toEqual(before);
    for (const role of ['anon', 'authenticated']) {
      for (const signature of signatures) {
        const grant = await db.query<{allowed:boolean}>('SELECT has_function_privilege($1,$2,\'EXECUTE\') AS allowed', [role, signature]);
        expect(grant.rows[0].allowed).toBe(true);
      }
    }
  } finally {
    await db.exec(readFileSync(migration, 'utf8'));
    await db.query('DELETE FROM public.users WHERE access_hash=$1', [rollbackHash]);
  }
});
