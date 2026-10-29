import { expect, it } from 'vitest';
import { effectiveAccess, validateEffectiveAccess, validateCorrection } from '../accessControl';
const correct = { 'lea.orders':'edit', 'lea.personnel':'none', 'tom.orders':'read', 'tom.personnel':'edit', 'mira.orders':'none', 'mira.personnel':'edit' };
it('combines positive grants, includes reading in editing and defaults to no access',()=>{
 expect(effectiveAccess(['workshop','dispatch'],'orders')).toBe('edit');
 expect(effectiveAccess(['dispatch','workshop'],'orders')).toBe('edit');
 expect(effectiveAccess(['workshop','workshop'],'orders')).toBe('read');
 expect(effectiveAccess(['dispatch'],'orders')).toBe('edit');
 expect(effectiveAccess([], 'orders')).toBe('none');
 expect(effectiveAccess(['workshop'], 'personnel')).toBe('none');
 expect(effectiveAccess(['personnel'], 'orders')).toBe('none');
});
it('grades the six current rights from supplied memberships, not desired future rights',()=>{
 expect(validateEffectiveAccess(correct)).toEqual({valid:true,errors:{}});
 const future={...correct,'tom.personnel':'none'};expect(validateEffectiveAccess(future).errors['tom.personnel']).toBeTruthy();
 for(const [key,value]of Object.entries(correct)){
  const bad={...correct,[key]:value==='edit'?'read':'edit'};
  expect(Object.keys(validateEffectiveAccess(bad).errors)).toEqual([key]);
 }
});
it.each([null,undefined,[],0,'edit',{},Object.create(correct)])('rejects missing/non-record/inherited-only matrix input %s',(value)=>{
 expect(validateEffectiveAccess(value).valid).toBe(false);
});
it.each(['EDIT',' edit','read\n','write','toString','constructor','__proto__',true,2,null,undefined])('rejects malformed choice %s with the other cells correct',(value)=>{
 expect(validateEffectiveAccess({...correct,'lea.orders':value}).errors['lea.orders']).toBeTruthy();
});
it('requires own fields even when mixed with valid inherited values',()=>{
 const mixed=Object.assign(Object.create({'lea.orders':'edit'}),correct);delete mixed['lea.orders'];
 expect(Object.keys(validateEffectiveAccess(mixed).errors)).toEqual(['lea.orders']);
});
it('accepts only the scoped one-step correction and complete normal-user verification',()=>{
 expect(validateCorrection({plan:'remove-personnel',verification:'all-users-both-folders'})).toEqual({valid:true,errors:{}});
 for(const plan of ['remove-workshop','remove-both','change-grants','add-dispatch','','constructor','__proto__',null]){
  expect(Object.keys(validateCorrection({plan,verification:'all-users-both-folders'}).errors)).toEqual(['plan']);
 }
 for(const verification of ['only-read','admin','assume','','toString',true]){
  expect(Object.keys(validateCorrection({plan:'remove-personnel',verification}).errors)).toEqual(['verification']);
 }
});
it('does not accept inherited correction choices, including mixed own/inherited answers',()=>{
 const complete={plan:'remove-personnel',verification:'all-users-both-folders'};
 expect(validateCorrection(Object.create(complete)).valid).toBe(false);
 expect(validateCorrection(Object.assign(Object.create({plan:complete.plan}),{verification:complete.verification})).errors.plan).toBeTruthy();
 expect(validateCorrection(Object.assign(Object.create({verification:complete.verification}),{plan:complete.plan})).errors.verification).toBeTruthy();
});
