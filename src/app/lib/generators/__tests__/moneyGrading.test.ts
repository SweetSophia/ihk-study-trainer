import {afterEach, expect, it, vi} from 'vitest';
import {generateVorwaertsKalkulationQuestion, generateRueckwaertsKalkulationQuestion, generateDifferenzKalkulationQuestion} from '../handelskalkulation';
import {validateQuestionAnswers} from '../../answerValidation';
import {getCalculationHints} from '../../calculationLearning';

afterEach(()=>vi.restoreAllMocks());
const factories=[
  ['forward',()=>generateVorwaertsKalkulationQuestion('standard'),16],
  ['forward0',()=>generateVorwaertsKalkulationQuestion('no-customer-skonto'),16],
  ['backward',()=>generateRueckwaertsKalkulationQuestion('standard'),15],
  ['backward0',()=>generateRueckwaertsKalkulationQuestion('no-supplier-rebate'),15],
  ['diff',()=>generateDifferenzKalkulationQuestion('standard'),32],
  ['diff0',()=>generateDifferenzKalkulationQuestion('matching-market'),32],
] as const;
for(const seed of[0,.12345,.5,.999999]) {
  it.each(factories)('requires the exact cent in every %s row at seed'+seed,(_name,generate,count)=>{
    vi.spyOn(Math,'random').mockReturnValue(seed);
    const q=generate();
    const answers=Object.fromEntries(Object.entries(q.expectedAnswers).map(([key,value])=>[key,String(value).replace('.',',')]));
    expect(q.answerInputs).toHaveLength(count);
    expect(validateQuestionAnswers(q,answers)).toBe(true);
    expect(getCalculationHints(q,answers)).toEqual([]);
    const snapshot=JSON.stringify(q.expectedAnswers);
    for(const config of q.answerInputs!) {
      const cents=Math.round(Number(q.expectedAnswers[config.valueKey])*100);
      for(const delta of[-1,1]) {
        const altered={...answers,[config.valueKey]:((cents+delta)/100).toFixed(2)};
        expect(validateQuestionAnswers(q,altered),config.valueKey).toBe(false);
        expect(getCalculationHints(q,altered).map(h=>h.valueKey)).toEqual([config.valueKey]);
      }
    }
    expect(JSON.stringify(q.expectedAnswers)).toBe(snapshot);
  });
}
it('grades a real half-cent row after rounding to cents, not before',()=>{
  vi.spyOn(Math,'random').mockReturnValueOnce(50.5/140001).mockReturnValue(.5);
  const q=generateVorwaertsKalkulationQuestion('standard');
  expect(q.expectedAnswers).toMatchObject({lep:100.50,rabatt:13.07,zep:87.43});
  const answers=Object.fromEntries(Object.entries(q.expectedAnswers).map(([k,v])=>[k,String(v)]));
  expect(validateQuestionAnswers(q,answers)).toBe(true);
  expect(validateQuestionAnswers(q,{...answers,rabatt:'13.065'})).toBe(false);
  expect(validateQuestionAnswers(q,{...answers,rabatt:'13.06'})).toBe(false);
});
it('keeps negative differential sign and exact zero rather than accepting relative or sub-cent errors',()=>{
  let calls=0;
  const random=vi.spyOn(Math,'random').mockImplementation(()=>calls++<8?.5:0);
  const q=generateDifferenzKalkulationQuestion('standard');
  expect(Number(q.expectedAnswers.differenz)).toBeLessThan(0);
  const answers=Object.fromEntries(Object.entries(q.expectedAnswers).map(([k,v])=>[k,String(v)]));
  expect(validateQuestionAnswers(q,answers)).toBe(true);
  expect(validateQuestionAnswers(q,{...answers,differenz:String(-Number(q.expectedAnswers.differenz))})).toBe(false);
  random.mockReturnValue(.5);
  const zero=generateDifferenzKalkulationQuestion('matching-market');
  const zeroAnswers=Object.fromEntries(Object.entries(zero.expectedAnswers).map(([k,v])=>[k,String(v)]));
  expect(validateQuestionAnswers(zero,{...zeroAnswers,differenz:'-0,000'})).toBe(true);
  expect(validateQuestionAnswers(zero,{...zeroAnswers,differenz:'1e-400'})).toBe(false);
});
