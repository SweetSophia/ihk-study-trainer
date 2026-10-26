import { describe, expect, it } from 'vitest';
import { SERVERS, traceServers, validateTrace, validateBoundary, type TraceAnswers } from '../algorithmTracing';
const valid=():TraceAnswers=>({rows:{A:{checked:'1',warnings:'1'},B:{checked:'1',warnings:'1'},C:{checked:'2',warnings:'1'},D:{checked:'3',warnings:'2'},E:{checked:'4',warnings:'3'}},output:'A, D, E'});
describe('storage monitoring trace',()=>{
 it('records every iteration including skipped maintenance and ordered alerts',()=>expect(traceServers(SERVERS,20)).toEqual({rows:[{id:'A',checked:1,warnings:1},{id:'B',checked:1,warnings:1},{id:'C',checked:2,warnings:1},{id:'D',checked:3,warnings:2},{id:'E',checked:4,warnings:3}],output:['A','D','E']}));
 it('includes equality and zero but excludes above-boundary and maintenance',()=>{const data=[0,19,20,21].map((freeGiB,i)=>({id:String(i),freeGiB,maintenance:false}));expect(traceServers([...data,{id:'skip',freeGiB:0,maintenance:true}],20).output).toEqual(['0','1','2']);expect(traceServers(data,0).output).toEqual(['0']);});
 it('handles empty and all-maintenance input',()=>{expect(traceServers([],20)).toEqual({rows:[],output:[]});expect(traceServers([{id:'x',freeGiB:0,maintenance:true}],20)).toEqual({rows:[{id:'x',checked:0,warnings:0}],output:[]});});
 it('does not sort or mutate input',()=>{const input=[{id:'z',freeGiB:1,maintenance:false},{id:'a',freeGiB:2,maintenance:false}];const before=JSON.stringify(input);expect(traceServers(input,20).output).toEqual(['z','a']);expect(JSON.stringify(input)).toBe(before);});
 it('accepts the complete trace and harmless numeric/output whitespace',()=>{const a=valid();a.rows.A.checked=' 01 ';a.output=' A , D,E ';expect(validateTrace(a).valid).toBe(true);});
 it.each(['','-1','1.0','1e0','1foo','NaN','Infinity','9007199254740992'])('rejects invalid counter %s',value=>{const a=valid();a.rows.B.checked=value;expect(validateTrace(a).errors['B.checked']).toBeTruthy();});
 it.each(['E,D,A','A,D,D','A,D,E,X','a,d,e','A,,D,E','[]',''])('rejects incorrect output %s',output=>{expect(validateTrace({...valid(),output}).errors.output).toBeTruthy();});
 it('finds wrong skipped-row state and missing rows',()=>{const a=valid();a.rows.B.warnings='2';delete a.rows.E;const e=validateTrace(a).errors;expect(e['B.warnings']).toBeTruthy();expect(e['E.checked']).toBeTruthy();});
 it('requires both the corrected comparator and distinguishing boundary case',()=>{expect(validateBoundary('<=','equal-active').valid).toBe(true);for(const comparator of ['','<','>=','='])expect(validateBoundary(comparator,'equal-active').errors.comparator).toBeTruthy();for(const testCase of ['','above-active','equal-maintenance','below-active','invented'])expect(validateBoundary('<=',testCase).errors.testCase).toBeTruthy();});
});
