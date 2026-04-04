import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateStructuredAnswer } from '../../answerValidation';
import { COMMAND_DATABASE, generateLinuxQuestion } from '../linux';

afterEach(() => {
  vi.restoreAllMocks();
});

function generateDescriptionQuestion(command: string) {
  const index = COMMAND_DATABASE.findIndex((entry) => entry.command === command);
  expect(index).toBeGreaterThanOrEqual(0);

  const randomSpy = vi.spyOn(Math, 'random');
  randomSpy
    .mockReturnValueOnce(index / COMMAND_DATABASE.length)
    .mockReturnValueOnce(0);

  const question = generateLinuxQuestion();
  expect(question.direction).toBe('descriptionToCommand');
  return question;
}

describe('linux generator', () => {
  it('accepts all declared firewall answers for the broad firewall prompt', () => {
    const question = generateDescriptionQuestion('iptables');
    const acceptedValues = question.answerInputs?.[0]?.acceptedValues ?? [];

    expect([...acceptedValues].sort()).toEqual(
      ['iptables', 'ufw', 'nft', 'nftables', 'firewall-cmd'].sort()
    );
    expect(question.solutionSteps.at(-1)).toBe(
      '  Gültige Antworten in dieser Aufgabe: iptables, ufw, nft, nftables, firewall-cmd'
    );
  });

  it('validates broad alternative commands for generic prompts', () => {
    const cases = [
      {
        command: 'iptables',
        accepted: ['iptables', 'ufw', 'nft', 'nftables', 'firewall-cmd'],
        rejected: ['firewalld'],
      },
      {
        command: 'useradd',
        accepted: ['useradd', 'adduser'],
        rejected: ['usermod'],
      },
      {
        command: 'userdel',
        accepted: ['userdel', 'deluser'],
        rejected: ['passwd'],
      },
      {
        command: 'groupadd',
        accepted: ['groupadd', 'addgroup'],
        rejected: ['groupdel'],
      },
      {
        command: 'groupdel',
        accepted: ['groupdel', 'delgroup'],
        rejected: ['groupadd'],
      },
      {
        command: 'nslookup',
        accepted: ['nslookup', 'dig'],
        rejected: ['ping'],
      },
      {
        command: 'traceroute',
        accepted: ['traceroute', 'tracepath', 'mtr'],
        rejected: ['ping'],
      },
      {
        command: 'fdisk',
        accepted: ['fdisk', 'gdisk', 'cfdisk', 'sfdisk', 'parted'],
        rejected: ['mkfs'],
      },
    ] as const;

    for (const testCase of cases) {
      const question = generateDescriptionQuestion(testCase.command);
      const inputs = question.answerInputs ?? [];
      const acceptedValues = question.answerInputs?.[0]?.acceptedValues ?? [];

      expect([...acceptedValues].sort()).toEqual([...testCase.accepted].sort());
      for (const answer of testCase.accepted) {
        expect(
          validateStructuredAnswer(inputs, question.expectedAnswers, { answer })
        ).toBe(true);
      }
      for (const answer of testCase.rejected) {
        expect(
          validateStructuredAnswer(inputs, question.expectedAnswers, { answer })
        ).toBe(false);
      }
    }
  });

  it('accepts firewall alternatives case-insensitively with normalized whitespace', () => {
    const question = generateDescriptionQuestion('iptables');
    const inputs = question.answerInputs ?? [];

    expect(
      validateStructuredAnswer(inputs, question.expectedAnswers, { answer: '  FIREWALL-CMD  ' })
    ).toBe(true);
  });
});
