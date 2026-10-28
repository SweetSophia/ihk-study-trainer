import { describe, expect, it } from 'vitest';
import { costAtMonth, parseEuroCents, validateCostAnswers } from '../costComparison';

describe('exact euro inputs', () => {
 it.each(['9120', '9120.00', '9120,00', ' 09120,0 '])('accepts %s without float tolerance', value => expect(parseEuroCents(value)).toBe(912000));
 it('accepts harmless leading zeroes without weakening the safe-cent bound', () => {
  expect(parseEuroCents('000000000000000000009120,00')).toBe(912000);
  expect(parseEuroCents('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
  expect(parseEuroCents('90071992547409.92')).toBeNull();
 });
 it('preserves a single cent', () => expect(parseEuroCents('0,01')).toBe(1));
 it.each(['', ' ', '-1', '+1', '1e3', '1.000', '9.120,00', '9,120.00', '9120€', '12x', 'Infinity', 'NaN', '.5', '1,234', '9007199254740991'])('rejects %s', value => expect(parseEuroCents(value)).toBeNull());
});
const comparison = { own:'9120', managed:'9760', difference:'640', cheaper:'own' };
const crossover = { month:'32', own31:'8520', managed31:'8460', own32:'8640', managed32:'8720' };
it('calculates initial, 31st, 32nd and 36th completed month costs in cents', () => {
 expect(costAtMonth('own',0)).toBe(480000);
 expect(costAtMonth('managed',0)).toBe(40000);
 expect([31,32,36].map(m => [costAtMonth('own',m),costAtMonth('managed',m)])).toEqual([[852000,846000],[864000,872000],[912000,976000]]);
});
it('accepts both complete reference sections', () => {
 expect(validateCostAnswers('comparison',comparison)).toEqual({valid:true,errors:{}});
 expect(validateCostAnswers('crossover',crossover)).toEqual({valid:true,errors:{}});
});
it('rejects a cent difference, wrong direction and unsupported choices', () => {
 expect(validateCostAnswers('comparison',{...comparison,own:'9120.01',cheaper:'managed'}).errors).toHaveProperty('own');
 for(const cheaper of ['managed','constructor','toString','']) expect(validateCostAnswers('comparison',{...comparison,cheaper}).errors).toHaveProperty('cheaper');
});
it.each(['31','31.43','32.0','3.2e1','', '-32', '9007199254740992'])('requires first strictly cheaper whole month, rejects %s', month => expect(validateCostAnswers('crossover',{...crossover,month}).valid).toBe(false));
it('reports every missing field and incorrect boundary cost', () => {
 expect(Object.keys(validateCostAnswers('crossover',{}).errors)).toHaveLength(5);
 expect(validateCostAnswers('crossover',{...crossover,own31:'8460',managed32:'8640'}).errors).toHaveProperty('own31');
});
