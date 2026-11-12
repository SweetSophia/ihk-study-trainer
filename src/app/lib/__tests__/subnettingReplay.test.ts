import { describe, expect, it } from 'vitest';
import { generateSubnettingQuestion } from '../generators/subnetting';
import { createSubnettingSnapshot, parseSubnettingSnapshot, createReplayQuestion, validateSubnettingReplayAnswers } from '../subnettingReplay';

describe('versioned subnetting replay', () => {
  it('copies an exact generated snapshot and grades six strict fields independently of normal scoring', () => {
    const q = generateSubnettingQuestion(); const s = createSubnettingSnapshot(q);
    expect(s.expectedAnswers).toEqual(q.expectedAnswers); expect(s.solutionSteps).toEqual(q.solutionSteps);
    q.solutionSteps[0] = 'changed'; expect(s.solutionSteps[0]).not.toBe('changed');
    const answers = Object.fromEntries(Object.entries(s.expectedAnswers).map(([k,v]) => [k, String(v)]));
    expect(validateSubnettingReplayAnswers(s, answers)).toBe(true);
    expect(validateSubnettingReplayAnswers(s, {...answers, networkId: '010.0.0.0'})).toBe(false);
    expect(validateSubnettingReplayAnswers(s, {...answers, usableHosts: `${answers.usableHosts}.0`})).toBe(false);
    expect(createReplayQuestion(s, 'first').id).not.toBe(createReplayQuestion(s, 'second').id);
  });
  it('rejects foreign keys, inconsistent values and excess text or UTF-8 bytes', () => {
    const s = createSubnettingSnapshot(generateSubnettingQuestion());
    for (const bad of [ {...s, extra: 1}, {...s, expectedAnswers: {...s.expectedAnswers, networkId: '10.0.0.1'}}, {...s, cidr: 16}, {...s, questionText: 'Gegeben: IP-Adresse 10.0.0.1/24\nwrong source'}, {...s, questionText: 'x'.repeat(2001)}, {...s, solutionSteps: Array(40).fill('😀'.repeat(500))} ]) {
      expect(() => parseSubnettingSnapshot(bad)).toThrow();
    }
  });
});
it('accepts /17 and /30 boundary examples and rejects invalid sources', () => {
  for (const [cidr, expectedAnswers] of [[17,{networkId:'10.1.128.0',broadcast:'10.1.255.255',hostMin:'10.1.128.1',hostMax:'10.1.255.254',subnetMask:'255.255.128.0',usableHosts:32766}],[30,{networkId:'10.1.200.4',broadcast:'10.1.200.7',hostMin:'10.1.200.5',hostMax:'10.1.200.6',subnetMask:'255.255.255.252',usableHosts:2}]] as const) {
    const s={version:1,validatorVersion:'subnetting-v1',ip:'10.1.200.6',cidr,questionText:`Gegeben: IP-Adresse 10.1.200.6/${cidr}\nTest`,expectedAnswers,solutionSteps:['solution'],difficulty:'easy'};
    expect(parseSubnettingSnapshot(s).cidr).toBe(cidr);
    expect(() => parseSubnettingSnapshot({...s,ip:'10.01.200.6'})).toThrow();
    expect(() => parseSubnettingSnapshot({...s,expectedAnswers:{...expectedAnswers,extra:'x'}})).toThrow();
  }
});
it('throws a sanitized typed error for cyclic invalid payloads', () => {
  const s=createSubnettingSnapshot(generateSubnettingQuestion());
  const cycle: Record<string,unknown>={}; cycle.self=cycle;
  expect(() => parseSubnettingSnapshot({...s,expectedAnswers:{...s.expectedAnswers,networkId:cycle}})).toThrowError(expect.objectContaining({name:'SubnettingReplayError',code:'invalid'}));
});
it('rejects sparse solution arrays rather than serializing holes as null', () => {
  const snapshot = createSubnettingSnapshot(generateSubnettingQuestion());
  expect(() => parseSubnettingSnapshot({ ...snapshot, solutionSteps: new Array(1) })).toThrowError(
    expect.objectContaining({ name: 'SubnettingReplayError', code: 'invalid' }),
  );
});
