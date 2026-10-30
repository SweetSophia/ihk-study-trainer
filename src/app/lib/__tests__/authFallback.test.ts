import { createHash, webcrypto } from 'node:crypto';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const setup = vi.hoisted(() => ({ configured: false, rpc: vi.fn() }));
vi.mock('../supabase', () => ({ get isSupabaseConfigured() { return setup.configured; }, supabase: { rpc: setup.rpc } }));
import { getAllProgress, getUserByHash, updateProgress } from '../auth';
const first='LocalOnly001', second='LocalOnly002';
const key=(id:string)=>`ihk_progress_v2:${createHash('sha256').update(id).digest('hex')}`;
const legacy=' [ { "module": "subnetting", "questions_attempted": 19, "questions_correct": 12 } ] ';
// A controllable lock scheduler: production browser checks exercise real cross-tab Web Locks.
let queues: Map<string, Promise<unknown>>;
let lockNames: string[];
beforeEach(()=>{
 vi.stubGlobal('crypto',webcrypto);
 localStorage.clear();localStorage.setItem('ihk_progress',legacy);setup.configured=false;setup.rpc.mockReset();queues=new Map();lockNames=[];
 vi.stubGlobal('navigator',{locks:{request:(name:string,callback:()=>unknown)=>{lockNames.push(name);const next=(queues.get(name)??Promise.resolve()).then(callback);queues.set(name,next.catch(()=>{}));return next;}}});
});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('starts distinct accounts empty, preserves legacy bytes and retains each account on return',async()=>{
 expect(await getAllProgress(first)).toEqual([]);expect(await getAllProgress(second)).toEqual([]);
 await updateProgress(first,'subnetting',true);await updateProgress(second,'subnetting',false);
 expect((await getAllProgress(first))[0]).toMatchObject({questions_attempted:1,questions_correct:1});
 expect((await getAllProgress(second))[0]).toMatchObject({questions_attempted:1,questions_correct:0});
 await updateProgress(first,'ports',true);
 expect(await getAllProgress(first)).toHaveLength(2);expect(await getAllProgress(second)).toHaveLength(1);
 expect(localStorage.getItem('ihk_progress')).toBe(legacy);
});
it('does not read or write an account snapshot until its lock is granted',async()=>{
 let release!:()=>void;queues.set(key(first),new Promise<void>(resolve=>{release=resolve;}));
 const reads=vi.spyOn(Storage.prototype,'getItem');
 const pending=updateProgress(first,'ports',true);await vi.waitFor(()=>expect(lockNames).toEqual([key(first)]));
 expect(lockNames[0]).not.toContain(first);expect(reads).not.toHaveBeenCalledWith(key(first));
 expect(localStorage.getItem(key(first))).toBeNull();
 release();await pending;expect((await getAllProgress(first))[0].questions_attempted).toBe(1);
});
it('keeps concurrent queued checks on same and different modules',async()=>{
 await Promise.all(Array.from({length:20},(_,i)=>updateProgress(first,i%2?'ports':'subnetting',i%3===0)));
 const rows=await getAllProgress(first);expect(rows.reduce((n,r)=>n+r.questions_attempted,0)).toBe(20);
 expect(rows.reduce((n,r)=>n+r.questions_correct,0)).toBe(7);expect(rows).toHaveLength(2);
});
it('preserves corrupt account data and legacy bytes rather than overwriting',async()=>{
 for(const data of ['bad JSON','{}','[null]','[{"module":"ports","questions_attempted":-1}]']){
  localStorage.setItem(key(first),data);
  await expect(updateProgress(first,'ports',true)).rejects.toThrow('Lokaler Fortschritt konnte nicht gespeichert werden.');
  await expect(getAllProgress(first)).rejects.toThrow('Lokaler Fortschritt konnte nicht geladen werden.');
  expect(localStorage.getItem(key(first))).toBe(data);expect(localStorage.getItem('ihk_progress')).toBe(legacy);
 }
});
it('rejects denied reads and writes without claiming success or exposing the account',async()=>{
 await updateProgress(first,'ports',true);const original=localStorage.getItem(key(first));
 const write=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error(`denied ${first}`);});
 await expect(updateProgress(first,'ports',false)).rejects.toThrow('Lokaler Fortschritt konnte nicht gespeichert werden.');write.mockRestore();
 expect(localStorage.getItem(key(first))).toBe(original);
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error(`denied ${first}`);});
 await expect(getAllProgress(first)).rejects.toThrow('Lokaler Fortschritt konnte nicht geladen werden.');
});
it('does not write without cross-tab locking',async()=>{
 vi.stubGlobal('navigator',{});
 await expect(updateProgress(first,'ports',true)).rejects.toThrow('Lokaler Fortschritt konnte nicht gespeichert werden.');
 expect(localStorage.getItem(key(first))).toBeNull();expect(localStorage.getItem('ihk_progress')).toBe(legacy);

});
it('keeps hosted reads and writes on the same account-scoped RPCs without local storage or locks',async()=>{
 setup.configured=true;vi.stubGlobal('navigator',{});setup.rpc.mockResolvedValue({data:[],error:null});
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('no browser storage');});
 await getAllProgress(first);await updateProgress(first,'unitConversion',true);
 expect(setup.rpc).toHaveBeenNthCalledWith(1,'get_all_progress',{p_hash:first});
 expect(setup.rpc).toHaveBeenNthCalledWith(2,'upsert_progress',{p_hash:first,p_module:'unit-conversion',p_was_correct:true});
});
it('preserves UTC same-day streaks, increments yesterday and resets gaps',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-28T00:10:00Z'));
 try {
  for(const [last,expected]of[['2026-10-27T23:59:00Z',4],['2026-10-28T00:01:00Z',3],['2026-10-25T20:00:00Z',1]] as const){
   localStorage.setItem(key(first),JSON.stringify([{module:'ports',questions_attempted:4,questions_correct:2,streak_days:3,last_session:last}]));
   await updateProgress(first,'ports',true);expect((await getAllProgress(first))[0].streak_days).toBe(expected);
  }
 } finally {vi.useRealTimers();}
});
it('preserves bytes on count overflow, duplicate rows or invalid record values',async()=>{
 const row={module:'ports',questions_attempted:1,questions_correct:1,streak_days:1,last_session:null};
 for(const rows of [[{...row,questions_attempted:Number.MAX_SAFE_INTEGER}],[row,row],[{...row,questions_correct:2}],[{...row,last_session:'invalid'}]]){
  const bytes=JSON.stringify(rows);localStorage.setItem(key(first),bytes);
  await expect(updateProgress(first,'ports',true)).rejects.toThrow('Lokaler Fortschritt konnte nicht gespeichert werden.');
  expect(localStorage.getItem(key(first))).toBe(bytes);expect(localStorage.getItem('ihk_progress')).toBe(legacy);
 }
});
it('rejects lock acquisition failures without reading or writing progress',async()=>{
 vi.stubGlobal('navigator',{locks:{request:()=>Promise.reject(new Error(`lock denied ${first}`))}});
 await expect(updateProgress(first,'ports',true)).rejects.toThrow('Lokaler Fortschritt konnte nicht gespeichert werden.');
 expect(localStorage.getItem(key(first))).toBeNull();expect(localStorage.getItem('ihk_progress')).toBe(legacy);
});
it('does not retain reusable account IDs in progress keys or records',async()=>{
 await updateProgress(first,'ports',true);await updateProgress(second,'ports',false);
 const stored=Array.from({length:localStorage.length},(_,i)=>{const k=localStorage.key(i)!;return k+localStorage.getItem(k);}).join('');
 expect(stored).not.toContain(first);expect(stored).not.toContain(second);
});

it('allows another account to complete while the first account lock is held',async()=>{
 let release!:()=>void;queues.set(key(first),new Promise<void>(r=>{release=r;}));
 const pending=updateProgress(first,'ports',true);await vi.waitFor(()=>expect(lockNames).toContain(key(first)));
 await updateProgress(second,'ports',false);expect((await getAllProgress(second))[0].questions_attempted).toBe(1);
 expect(localStorage.getItem(key(first))).toBeNull();expect(lockNames).toEqual([key(first),key(second)]);
 release();await pending;
});
it.each(['invalid','LocalOnly0!!','has space12','LocalOnly001\n'])('rejects malformed account %s before progress access or fallback login',async id=>{
 await expect(updateProgress(id,'ports',true)).rejects.toThrow('Lokaler Fortschritt konnte nicht gespeichert werden.');
 await expect(getAllProgress(id)).rejects.toThrow('Lokaler Fortschritt konnte nicht geladen werden.');
 expect(lockNames).toEqual([]);expect(await getUserByHash(id)).toBeNull();
});

it('writes the dedicated differential counter without touching mixed or split calculation history', async () => {
 const rows = [
  {module:'handelskalkulation',questions_attempted:20,questions_correct:5,streak_days:1,last_session:null},
  {module:'handelskalkulation-vorwaerts',questions_attempted:3,questions_correct:2,streak_days:1,last_session:null},
  {module:'handelskalkulation-rueckwaerts',questions_attempted:4,questions_correct:3,streak_days:1,last_session:null},
 ];
 localStorage.setItem(key(first),JSON.stringify(rows));
 await updateProgress(first,'handelskalkulationDifferenz',true);
 const stored=JSON.parse(localStorage.getItem(key(first))!);
 expect(stored.slice(0,3)).toEqual(rows);
 expect(stored[3]).toMatchObject({module:'handelskalkulationDifferenz',questions_attempted:1,questions_correct:1});
 const loaded=await getAllProgress(first);
 expect(loaded.map(r=>r.module)).toEqual(['handelskalkulation','handelskalkulationVorwaerts','handelskalkulationRueckwaerts','handelskalkulationDifferenz']);
 expect(loaded[0]).toMatchObject(rows[0]);
 expect(localStorage.getItem('ihk_progress')).toBe(legacy);
});
