import { expect, it } from 'vitest';
import { validateDiagnosis, validateCorrection } from '../troubleshooting';
const facts = { profile:'supported', https:'supported', dnsStopped:'unproven', unreachable:'unproven' };
it('accepts the supported diagnosis and classifications regardless of object order',()=>{
 expect(validateDiagnosis('local-override',facts).valid).toBe(true);
 expect(validateDiagnosis('local-override',Object.fromEntries(Object.entries(facts).reverse())).valid).toBe(true);
});
it.each(['','firewall','dns-down','public-dns','__proto__'])('rejects unsupported diagnosis %s',diagnosis=>expect(validateDiagnosis(diagnosis,facts).valid).toBe(false));
it.each(Object.keys(facts))('rejects missing, unknown and inverted evidence classification %s',key=>{
 for(const value of ['', 'unknown', facts[key as keyof typeof facts]==='supported'?'unproven':'supported']) expect(validateDiagnosis('local-override',{...facts,[key]:value}).errors[key]).toBeTruthy();
});
it('accepts only scoped correction and ordinary end-to-end verification',()=>{
 expect(validateCorrection('restore-profile','normal-dns-https').valid).toBe(true);
 for(const correction of ['', 'public-dns','disable-firewall','hosts','__proto__']) expect(validateCorrection(correction,'normal-dns-https').errors.correction).toBeTruthy();
 for(const verification of ['', 'ping','pinned-only','assume-fixed','__proto__']) expect(validateCorrection('restore-profile',verification).errors.verification).toBeTruthy();
});
