import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateAggregationQuestion } from '../aggregation';

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((value, octet) => value * 256 + Number(octet), 0);
}

function setRandomInputs(count: number, cidr: number, secondOctet: number, thirdOctet: number) {
  vi.spyOn(Math, 'random')
    .mockReturnValueOnce((count - 2) / 3)
    .mockReturnValueOnce((cidr - 20 + 0.5) / 11)
    .mockReturnValueOnce(secondOctet / 256)
    .mockReturnValueOnce(thirdOctet / 256);
}

describe('generateAggregationQuestion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aligns a /20 base address before generating consecutive networks', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1 / 256);

    const question = generateAggregationQuestion();

    expect(question.networks).toEqual(['10.0.0.0/20', '10.0.16.0/20']);
    expect(question.expectedAnswers).toEqual({
      summaryRoute: '10.0.0.0',
      summaryCidr: 19,
      possible: true,
    });
  });

  const cases = Array.from({ length: 11 }, (_, index) => index + 20).flatMap(cidr =>
    [2, 3, 4].flatMap(count =>
      [[0, 0], [0, 1], [0, 15], [0, 16], [0, 255], [255, 255]].map(
        ([secondOctet, thirdOctet]) => ({ cidr, count, secondOctet, thirdOctet }),
      ),
    ),
  );

  it.each(cases)(
    'emits $count aligned /$cidr blocks from 10.$secondOctet.$thirdOctet.0 covered by its summary',
    ({ cidr, count, secondOctet, thirdOctet }) => {
      setRandomInputs(count, cidr, secondOctet, thirdOctet);
      const question = generateAggregationQuestion();
      const blockSize = 2 ** (32 - cidr);
      const starts = question.networks.map(network => {
        const [ip, prefix] = network.split('/');
        expect(Number(prefix)).toBe(cidr);
        const start = ipToNumber(ip);
        expect(start % blockSize).toBe(0);
        return start;
      });

      expect(starts).toHaveLength(count);
      for (let index = 1; index < starts.length; index++) {
        expect(starts[index] - starts[index - 1]).toBe(blockSize);
      }

      const { summaryRoute, summaryCidr, possible } = question.expectedAnswers;
      const summaryStart = ipToNumber(summaryRoute);
      const summarySize = 2 ** (32 - summaryCidr);
      expect(summaryStart % summarySize).toBe(0);
      expect(possible).toBe(true);
      for (const start of starts) {
        expect(start).toBeGreaterThanOrEqual(summaryStart);
        expect(start + blockSize - 1).toBeLessThan(summaryStart + summarySize);
      }
    },
  );

  it('preserves a covering supernet for three contiguous networks', () => {
    setRandomInputs(3, 24, 0, 0);

    const question = generateAggregationQuestion();

    expect(question.networks).toEqual(['10.0.0.0/24', '10.0.1.0/24', '10.0.2.0/24']);
    expect(question.expectedAnswers).toEqual({
      summaryRoute: '10.0.0.0',
      summaryCidr: 22,
      possible: true,
    });
  });
});
