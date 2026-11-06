import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateQuestionAnswers, validateStructuredAnswer } from '../answerValidation';
import { generateRaidQuestion } from '../generators/raid';
import { GENERATORS } from '../generators/registry';

const inputs=[{valueKey:'capacity',unitKey:'unit',unitOptions:['GB','TB'],numericRule:'decimalStorageBytes' as const}];
const check=(value:string,unit='TB',expected='4',expectedUnit='TB')=>validateStructuredAnswer(inputs,{capacity:expected,unit:expectedUnit},{capacity:value,unit});
afterEach(()=>vi.restoreAllMocks());

describe('exact decimal RAID capacity',()=>{
 it.each([['4','TB'],['4000','GB'],['4,0000','tb'],['4.0000','TB'],['4e3','GB'],['+4e0','TB'],[' 4000 ',' GB '],['.5','TB','500','GB'],['250','GB','0.25','TB']])('accepts equivalent capacity %s %s',(value,unit,expected='4',expectedUnit='TB')=>expect(check(value,unit,expected,expectedUnit)).toBe(true));
 it.each([['3.9','TB'],['4.1','TB'],['3999','GB'],['4001','GB'],['4096','GB'],['-4','TB'],['0','TB'],['4.0000000000000001','TB'],['4.0000000000001','TB'],['4000.0000000001','GB']])('rejects a distinct amount %s %s',(value,unit)=>expect(check(value,unit)).toBe(false));
 it.each(['','4xyz','4 TB','4,0.0','4,000,000','NaN','Infinity','1e1000000000','1e-1000000000'])('rejects incomplete/malformed/unsafe %s',value=>expect(check(value)).toBe(false));
 it.each(['','GiB','TiB','MB','constructor','__proto__','toString'])('rejects missing or unsupported unit %s',unit=>expect(check('4',unit)).toBe(false));
 it('requires a valid expected unit and amount',()=>{
  expect(check('4','TB','4','')).toBe(false);
  expect(check('4','TB','4','constructor')).toBe(false);
  expect(check('4','TB','NaN','TB')).toBe(false);
 });
 it('never underflows nonzero input to zero or rounds sub-byte differences away',()=>{
  expect(check('1e-400','GB','0','GB')).toBe(false);
  expect(check('0e1000000000','GB','0','GB')).toBe(true);
  expect(check('-0,000','TB','0','GB')).toBe(true);
  expect(check('1.0000000001','GB','1','GB')).toBe(false);
 });
 it('compares individual bytes and enforces the safe integer byte range',()=>{
  expect(check('1e-12','TB','1e-9','GB')).toBe(true);
  expect(check('64000','GB','64','TB')).toBe(true);
  expect(check('64000.000000001','GB','64','TB')).toBe(false);
  expect(check('9007199.254740991','GB','9007199.254740991','GB')).toBe(true);
  expect(check('9007199.254740992','GB','9007199.254740992','GB')).toBe(false);
  expect(validateStructuredAnswer([{valueKey:'capacity',numericRule:'decimalStorageBytes'}],{capacity:4},{capacity:'4'})).toBe(false);
 });
 it('preserves tolerance for untagged conversion fields and exact money rules',()=>{
  expect(validateStructuredAnswer([{valueKey:'capacity',unitKey:'unit',unitOptions:['GB','TB']}],{capacity:4,unit:'TB'},{capacity:'3.9',unit:'TB'})).toBe(true);
  expect(validateStructuredAnswer([{valueKey:'amount',numericRule:'moneyCents'}],{amount:1000},{amount:'1040'})).toBe(false);
 });
 it('only tags the generated RAID capacity, retaining exact failure choices',()=>{
  vi.spyOn(Math,'random').mockReturnValue(.5);
  for(const [id,generate] of Object.entries(GENERATORS)){
   const q=generate();const tagged=q.answerInputs?.filter(c=>c.numericRule==='decimalStorageBytes')??[];
   expect(tagged.map(c=>c.valueKey)).toEqual(id==='raid'?['usableCapacity']:[]);
  }
  const q=generateRaidQuestion();
  expect(q.questionText).toContain('1 TB = 1000 GB');
  expect(q.questionText).toContain('theoretische');
  expect(q.solutionSteps.join('\n')).toContain('10^9');
  expect(q.answerInputs.find(c=>c.valueKey==='faultTolerance')?.acceptedValues).toEqual([String(q.raid.faultTolerance)]);
 });
 it.each([0,.2,.4,.6,.8])('grades both units across generated level selection %s',level=>{
  const random=vi.spyOn(Math,'random');
  for(const size of [0,.2,.4,.6,.8,.99]){
   random.mockReturnValueOnce(level).mockReturnValueOnce(.5).mockReturnValueOnce(size);
   const q=generateRaidQuestion();const {disks,diskSizeGb}=q.raid;
   const factor=q.raid.level==='RAID 1'?1:q.raid.level==='RAID 5'?disks-1:q.raid.level==='RAID 6'?disks-2:q.raid.level==='RAID 10'?disks/2:disks;
   const gb=factor*diskSizeGb;
   const question={...q,id:'raid-generated',module:'raid',difficulty:'medium' as const};
   const answer={usableCapacity:String(gb),unit:'GB',faultTolerance:String(q.raid.faultTolerance)};
   expect(validateQuestionAnswers(question,answer)).toBe(true);
   expect(validateQuestionAnswers(question,{...answer,usableCapacity:String(gb/1000).replace('.',','),unit:'TB'})).toBe(true);
   expect(validateQuestionAnswers(question,{...answer,usableCapacity:String(gb-1)})).toBe(false);
   expect(validateQuestionAnswers(question,{...answer,faultTolerance:String(q.raid.faultTolerance+1)})).toBe(false);
  }
 });
});
