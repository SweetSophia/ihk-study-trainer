import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  generateSubnettingQuestion,
  MAX_HOSTS_PER_CIDR,
  SUBNETTING_CIDRS,
} from '../subnetting';

describe('generateSubnettingQuestion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the canonical subnetting module id', () => {
    const question = generateSubnettingQuestion();

    expect(question.module).toBe('subnetting');
  });

  it('uses a stable id prefix without asserting the Date.now suffix shape', () => {
    const question = generateSubnettingQuestion();

    expect(question.id.startsWith('subnetting-')).toBe(true);
  });

  it('defines the correct usable host count for every supported CIDR', () => {
    for (const cidr of SUBNETTING_CIDRS) {
      expect(MAX_HOSTS_PER_CIDR[cidr]).toBe(2 ** (32 - cidr) - 2);
    }
  });

  it('emits the mapped usable host count for every supported CIDR', () => {
    const cidrCount = SUBNETTING_CIDRS.length;

    SUBNETTING_CIDRS.forEach((cidr, index) => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce((index + 0.1) / cidrCount)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0);

      const question = generateSubnettingQuestion();

      expect(question.questionText).toContain(`/${cidr}`);
      expect(question.expectedAnswers.usableHosts).toBe(MAX_HOSTS_PER_CIDR[cidr]);
      vi.restoreAllMocks();
    });
  });
});
