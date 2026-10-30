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
      // nftables is a framework; its CLI command is nft.
      ['iptables', 'ufw', 'nft', 'firewall-cmd'].sort()
    );
    expect(question.solutionSteps.at(-1)).toBe(
      '  Gültige Antworten in dieser Aufgabe: iptables, ufw, nft, firewall-cmd'
    );
  });

  it('validates broad alternative commands for generic prompts', () => {
    const cases = [
      {
        command: 'iptables',
        accepted: ['iptables', 'ufw', 'nft', 'firewall-cmd'],
        rejected: ['firewalld', 'nftables'],
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

  it('accepts the taught mkfs.ext4 command without accepting arbitrary command prefixes or arguments', () => {
    const question = generateDescriptionQuestion('mkfs');
    const inputs = question.answerInputs ?? [];
    for (const answer of ['mkfs', 'mkfs.ext4', '  MKFS.EXT4  ']) {
      expect(validateStructuredAnswer(inputs, question.expectedAnswers, { answer })).toBe(true);
    }
    for (const answer of ['fdisk', 'mkfs.invalid', 'mkfs.ext4 /dev/sdb1']) {
      expect(validateStructuredAnswer(inputs, question.expectedAnswers, { answer })).toBe(false);
    }
  });

  it('teaches separate byte and character counts, including a UTF-8 example', () => {
    const solution = generateDescriptionQuestion('wc').solutionSteps.join('\n');
    expect(solution).toContain('Bytes (-c)');
    expect(solution).toContain('Zeichen (-m)');
    expect(solution).toMatch(/Ohne Optionen.*Zeilen.*Wörter.*Bytes/);
    expect(solution).toContain('ä');
    expect(solution).toMatch(/2 Bytes.*1 Zeichen/);
  });

  it.each(['ss', 'netstat'])('describes the -l filter in %s -tulpn as listening sockets', (command) => {
    const solution = generateDescriptionQuestion(command).solutionSteps.join('\n');
    expect(solution).toMatch(/-tulpn zeigt.*lauschenden TCP\/UDP-Sockets/);
    expect(solution).not.toContain('alle TCP/UDP-Verbindungen');
  });
});
