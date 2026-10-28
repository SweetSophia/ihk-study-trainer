import { describe, expect, it } from 'vitest';
import { meetsTarget, validateTimeline, validateRestoreChain } from '../backupRecovery';
const correct={lossMinutes:'20',outageMinutes:'70',rpo:'met',rto:'met'};
describe('fixed recovery timeline',()=>{
 it('accepts equivalent whole-minute inputs and target equality',()=>{
  expect(validateTimeline({...correct,lossMinutes:' 020 '})).toEqual({valid:true,errors:{}});
  expect(meetsTarget(30,30)).toBe(true);expect(meetsTarget(31,30)).toBe(false);
 });
 it.each(['','-20','+20','2e1','20.0','20 min','２０','9007199254740992','NaN'])('rejects malformed duration %s',value=>{
  expect(validateTimeline({...correct,lossMinutes:value}).errors.lossMinutes).toBeTruthy();
 });
 it('checks both times and each classification independently',()=>{
  for(const [key,value] of [['lossMinutes','19'],['outageMinutes','69'],['rpo','missed'],['rto','missed'],['rpo','toString']]){
   const result=validateTimeline({...correct,[key]:value});expect(result.valid).toBe(false);expect(result.errors[key]).toBeTruthy();
  }
 });
 it('does not accept inherited answers or non-string values',()=>{
  expect(validateTimeline(Object.create(correct)).valid).toBe(false);
  for(const key of Object.keys(correct)){
   const mixed=Object.assign(Object.create(correct),correct);delete mixed[key];expect(validateTimeline(mixed).errors[key]).toBeTruthy();
   expect(validateTimeline({...correct,[key]:20}).errors[key]).toBeTruthy();
  }
  expect(validateTimeline(Object.assign(Object.create(null),correct)).valid).toBe(true);
 });
});
describe('restoration dependency checks',()=>{
 it.each(['F1,I1,I2',' F1 , I1 , I2 ','F2,I4'])('accepts complete latest-state alternative %s',chain=>expect(validateRestoreChain(chain)).toEqual({valid:true,errors:{}}));
 it.each(['','F1,,I1,I2','F1,I1,I2,','f1,I1,I2','F9','toString','__proto__','F1 I1 I2'])('rejects malformed or unknown chain %s',chain=>expect(validateRestoreChain(chain).valid).toBe(false));
 it.each(['I2','F1,I2','F1,I2,I1','F2,I1,I2','F1,I1,I1,I2','F1,I1,I2,I3','F1,I1,I2,F2,I4','F1','F1,I1','F2','I3','X,I3'])('rejects broken, duplicate, extra or outdated chain %s',chain=>{
  expect(validateRestoreChain(chain).errors.chain).toBeTruthy();
 });
 it('gives specific explanations for missing dependency and old state',()=>{
  expect(validateRestoreChain('F1,I2').errors.chain).toContain('I1');
  expect(validateRestoreChain('F1,I1').errors.chain).toContain('09:40');
  expect(validateRestoreChain('I3').errors.chain).toBeTruthy();
  expect(validateRestoreChain(null).valid).toBe(false);
 });
});
