import type { Question } from '../types';

export interface SubnettingSnapshotV1 {
  version: 1;
  validatorVersion: 'subnetting-v1';
  ip: string;
  cidr: number;
  questionText: string;
  expectedAnswers: {
    networkId: string;
    broadcast: string;
    hostMin: string;
    hostMax: string;
    subnetMask: string;
    usableHosts: number;
  };
  solutionSteps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SubnettingReplayRecord {
  id: string;
  sourceAttemptId: string;
  snapshot: SubnettingSnapshotV1;
  createdAt: string;
  resolvedAt: string | null;
}

export interface SubnettingReplayState {
  generation: string;
  records: SubnettingReplayRecord[];
}

export class SubnettingReplayError extends Error {
  constructor(public readonly code: 'invalid' | 'unavailable' | 'transport') {
    super(`Subnetting replay ${code}`);
    this.name = 'SubnettingReplayError';
  }
}

const invalid = (): never => { throw new SubnettingReplayError('invalid'); };
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const keys = (value: Record<string, unknown>, expected: string[]) =>
  Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
export const isReplayUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const ipv4 = (value: unknown): value is string =>
  typeof value === 'string' && value.split('.').length === 4 &&
  value.split('.').every(octet => /^(0|[1-9]\d{0,2})$/.test(octet) && +octet <= 255);
const dotted = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
const answerKeys = ['networkId', 'broadcast', 'hostMin', 'hostMax', 'subnetMask', 'usableHosts'];

export function parseSubnettingSnapshot(value: unknown): SubnettingSnapshotV1 {
  if (!object(value) || !keys(value, [
    'version', 'validatorVersion', 'ip', 'cidr', 'questionText', 'expectedAnswers', 'solutionSteps', 'difficulty',
  ])) return invalid();

  const { ip, cidr, questionText, expectedAnswers, solutionSteps, difficulty } = value;
  if (
    value.version !== 1 || value.validatorVersion !== 'subnetting-v1' ||
    !ipv4(ip) || !ip.startsWith('10.') ||
    !Number.isInteger(cidr) || (cidr as number) < 17 || (cidr as number) > 30 ||
    typeof questionText !== 'string' || Array.from(questionText).length > 2000 ||
    !Array.isArray(solutionSteps) || solutionSteps.length < 1 || solutionSteps.length > 40 ||
    // Array.from visits sparse indices, unlike Array.prototype.every.
    !Array.from(solutionSteps).every(step => typeof step === 'string' && Array.from(step).length <= 1000) ||
    !['easy', 'medium', 'hard'].includes(difficulty as string) ||
    !object(expectedAnswers) || !keys(expectedAnswers, answerKeys)
  ) return invalid();

  if (!questionText.startsWith(`Gegeben: IP-Adresse ${ip}/${cidr}\n`)) return invalid();
  const n = ip.split('.').reduce((acc, octet) => acc * 256 + Number(octet), 0) >>> 0;
  const mask = (0xffffffff << (32 - (cidr as number))) >>> 0;
  const network = (n & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  const expected = [
    dotted(network), dotted(broadcast), dotted(network + 1), dotted(broadcast - 1),
    dotted(mask), 2 ** (32 - (cidr as number)) - 2,
  ];
  if (!answerKeys.every((key, i) => expectedAnswers[key] === expected[i])) return invalid();
  if (new TextEncoder().encode(JSON.stringify(value)).length > 16384) return invalid();
  return JSON.parse(JSON.stringify(value)) as SubnettingSnapshotV1;
}

export function createSubnettingSnapshot(question: Question): SubnettingSnapshotV1 {
  if (question.module !== 'subnetting') return invalid();
  const match = /^Gegeben: IP-Adresse (\d+\.\d+\.\d+\.\d+)\/(\d+)\n/.exec(question.questionText);
  if (!match) return invalid();
  return parseSubnettingSnapshot({
    version: 1,
    validatorVersion: 'subnetting-v1',
    ip: match[1],
    cidr: Number(match[2]),
    questionText: question.questionText,
    expectedAnswers: question.expectedAnswers,
    solutionSteps: question.solutionSteps,
    difficulty: question.difficulty,
  });
}

export function createReplayQuestion(snapshot: SubnettingSnapshotV1, sessionId: string): Question {
  const s = parseSubnettingSnapshot(snapshot);
  if (typeof sessionId !== 'string' || !sessionId) return invalid();
  return {
    id: `subnetting-replay-${sessionId}`,
    theme: 'Netzwerkarchitektur & Overhead',
    module: 'subnetting',
    questionText: s.questionText,
    expectedAnswers: s.expectedAnswers,
    solutionSteps: s.solutionSteps,
    difficulty: s.difficulty,
  };
}

export function validateSubnettingReplayAnswers(
  snapshot: SubnettingSnapshotV1,
  answers: Record<string, string>,
): boolean {
  const s = parseSubnettingSnapshot(snapshot);
  if (!object(answers)) return false;
  return answerKeys.every(key => {
    const answer = answers[key];
    if (typeof answer !== 'string') return false;
    const trimmed = answer.trim();
    const expected = s.expectedAnswers[key as keyof typeof s.expectedAnswers];
    return key === 'usableHosts'
      ? /^\d+$/.test(trimmed) && Number.isSafeInteger(Number(trimmed)) && Number(trimmed) === expected
      : ipv4(trimmed) && trimmed === expected;
  });
}

const timestamp = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));

export function parseSubnettingReplayRecord(value: unknown): SubnettingReplayRecord {
  if (
    !object(value) || !keys(value, ['id', 'sourceAttemptId', 'snapshot', 'createdAt', 'resolvedAt']) ||
    !isReplayUuid(value.id) || !isReplayUuid(value.sourceAttemptId) || !timestamp(value.createdAt) ||
    !(value.resolvedAt === null || timestamp(value.resolvedAt))
  ) return invalid();
  return {
    id: value.id,
    sourceAttemptId: value.sourceAttemptId,
    snapshot: parseSubnettingSnapshot(value.snapshot),
    createdAt: value.createdAt,
    resolvedAt: value.resolvedAt,
  };
}

export function parseSubnettingReplayState(value: unknown): SubnettingReplayState {
  if (
    !object(value) || !keys(value, ['generation', 'records']) || !isReplayUuid(value.generation) ||
    !Array.isArray(value.records) || value.records.length > 100
  ) return invalid();
  const records = value.records.map(parseSubnettingReplayRecord);
  if (
    new Set(records.map(record => record.id)).size !== records.length ||
    new Set(records.map(record => record.sourceAttemptId)).size !== records.length
  ) return invalid();
  return { generation: value.generation, records };
}
