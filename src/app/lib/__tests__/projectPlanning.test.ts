import { describe, expect, it } from 'vitest';
import { ACTIVITIES, calculateSchedule, validateProjectAnswers, type ProjectAnswers } from '../projectPlanning';
const baseline = { A:[0,2,0,2,0], B:[2,6,2,6,0], C:[2,5,3,6,1], D:[6,8,6,8,0], E:[8,10,8,10,0], F:[10,11,10,11,0] };
export function answers(): ProjectAnswers {
 return { rows:Object.fromEntries(Object.entries(baseline).map(([id,v])=>[id,Object.fromEntries(['es','ef','ls','lf','float'].map((k,i)=>[k,String(v[i])]))])),duration:'11',critical:['F','D','A','E','B'] };
}
describe('project schedule',()=>{
 it('calculates complete baseline independently of input order',()=>{
  const s=calculateSchedule([...ACTIVITIES].reverse());expect(s.duration).toBe(11);expect(s.critical.sort()).toEqual(['A','B','D','E','F']);
  for(const [id,values] of Object.entries(baseline)) expect(['es','ef','ls','lf','float'].map(k=>s.rows[id][k as keyof typeof s.rows[string]])).toEqual(values);
 });
 it('changes the critical branch when C takes five days',()=>{const s=calculateSchedule(ACTIVITIES.map(a=>a.id==='C'?{...a,duration:5}:a));expect(s.duration).toBe(12);expect(s.critical).toEqual(['A','C','D','E','F']);expect(s.rows.B.float).toBe(1);});
 it('retains both critical branches on a tie',()=>{const s=calculateSchedule(ACTIVITIES.map(a=>a.id==='C'?{...a,duration:4}:a));expect(s.critical).toEqual(['A','B','C','D','E','F']);});
 it('accepts all correct fields and order-independent activity selection',()=>expect(validateProjectAnswers(answers(),false).valid).toBe(true));
 it.each(['','-1','1.5','1e1','Infinity','NaN','11days','9007199254740992'])('rejects malformed whole-day input %s',value=>{const a=answers();a.duration=value;expect(validateProjectAnswers(a,false).errors.duration).toBeTruthy();});
 it('pinpoints a wrong row field and critical set',()=>{const a=answers();a.rows.C.float='0';a.critical=['A','B','C','D','E','F'];const r=validateProjectAnswers(a,false);expect(r.errors['C.float']).toBeTruthy();expect(r.errors.critical).toBeTruthy();});
 it('checks the changed summary without requiring baseline entries',()=>expect(validateProjectAnswers({rows:{},duration:'12',critical:['A','C','D','E','F']},true).valid).toBe(true));
 it('rejects missing and duplicate critical activities',()=>{const a=answers();a.critical=['A','B','D','E','E'];expect(validateProjectAnswers(a,false).valid).toBe(false);});
 it('rejects invalid authored graphs',()=>{expect(()=>calculateSchedule([{id:'A',label:'a',duration:1,predecessors:['A']}])).toThrow();expect(()=>calculateSchedule([{id:'A',label:'a',duration:-1,predecessors:[]}])).toThrow();});
});
