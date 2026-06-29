import { Question } from '../../types';
import { type ModuleId } from '../modules';
import { generateBandwidthQuestion } from './bandwidth';
import { generateImageCalcQuestion } from './imageCalc';
import { generateImageTransferComboQuestion } from './imageTransferCombo';
import { generateOverheadQuestion } from './overhead';
import { generateSubnettingQuestion } from './subnetting';
import { generateUnitConversionQuestion } from './unitConversion';
import { generateBinaryQuestion } from './binary';
import { generateHexQuestion } from './hex';
import { generateHexBinaryQuestion } from './hexBinary';
import { generateSubnetMaskQuestion } from './subnetMask';
import { generateAggregationQuestion } from './aggregation';
import { generatePortQuestion } from './ports';
import { generateOsiQuestion, generateOsiOrderQuestion } from './osi';
import { generateCableQuestion, CABLE_TYPES, ALL_CABLE_PROS } from './cables';
import { generateLinuxQuestion } from './linux';
import { generateCloudQuestion } from './cloud';
import {
  generateHandelskalkulationQuestion,
  generateVorwaertsKalkulationQuestion,
  generateRueckwaertsKalkulationQuestion,
} from './handelskalkulation';
import { generateRaidQuestion } from './raid';

/**
 * Module IDs that have a registered generator. Excludes `'sql'` because
 * the SQL module's exercises come from an AI server action, not a local
 * generator. Deriving this from `ModuleId` (instead of hardcoding the
 * 18 keys) means a missing generator becomes a compile error.
 */
export type RegistryModuleId = Exclude<ModuleId, 'sql'>;

/**
 * Generate a unique question id with a stable module prefix.
 * The prefix lets tests assert on the id namespace and keeps logs grep-able.
 * Falls back to a timestamp + random suffix when `crypto.randomUUID` is
 * unavailable (older browsers, jsdom).
 */
export function createQuestionId(module: ModuleId): string {
  const uniqueId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${module}-${uniqueId}`;
}

/**
 * Module ID → generator function.
 *
 * The SQL module is intentionally absent (its exercises come from an AI
 * server action and have their own UI flow in `SqlTrainer`).
 *
 * Wrappers that build `answerInputs` (cables, ports, osi, linux, cloud) or
 * stamp a fresh id + module name live here so the underlying generators
 * stay pure: they return typed content, this layer adapts it to a
 * `Question` ready for the `StudyCard` component.
 *
 * The `Record<RegistryModuleId, …>` type forces every base module to
 * have a generator and forbids stray keys — `tsc` is the source of
 * truth for coverage.
 */
export const GENERATORS: Record<RegistryModuleId, () => Question> = {
  bandwidth: generateBandwidthQuestion,
  imageCalc: generateImageCalcQuestion,
  imageTransferCombo: generateImageTransferComboQuestion,
  overhead: generateOverheadQuestion,
  subnetting: generateSubnettingQuestion,
  unitConversion: generateUnitConversionQuestion,
  binary: () => {
    const q = generateBinaryQuestion();
    return {
      id: createQuestionId('binary'),
      theme: q.theme,
      module: 'binary',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'easy',
    };
  },
  hexBinary: () => {
    const q = generateHexBinaryQuestion();
    return {
      id: createQuestionId('hexBinary'),
      theme: q.theme,
      module: 'hexBinary',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: q.difficulty,
    };
  },
  hex: () => {
    const q = generateHexQuestion();
    return {
      id: createQuestionId('hex'),
      theme: q.theme,
      module: 'hex',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'easy',
    };
  },
  subnetMask: () => {
    const q = generateSubnetMaskQuestion();
    return {
      id: createQuestionId('subnetMask'),
      theme: q.theme,
      module: 'subnetMask',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'medium',
    };
  },
  aggregation: () => {
    const q = generateAggregationQuestion();
    return {
      id: createQuestionId('aggregation'),
      theme: q.theme,
      module: 'aggregation',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'hard',
    };
  },
  ports: () => {
    const q = generatePortQuestion();
    return {
      id: createQuestionId('ports'),
      theme: q.theme,
      module: 'ports',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'easy',
      answerInputs: q.answerInputs,
    };
  },
  osi: () => {
    // 50/50 split between the classic "item → layer" assignment and the
    // new drag-to-reorder exercise. Keeps the module fresh without retiring
    // the existing question style.
    if (Math.random() < 0.5) {
      const q = generateOsiQuestion();
      return {
        id: createQuestionId('osi'),
        theme: q.theme,
        module: 'osi',
        questionText: q.questionText,
        expectedAnswers: q.expectedAnswers,
        solutionSteps: q.solutionSteps,
        difficulty: 'medium',
        answerInputs: q.answerInputs,
      };
    }
    const q = generateOsiOrderQuestion();
    return {
      id: createQuestionId('osi'),
      theme: q.theme,
      module: 'osi',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'medium',
      dragOrder: q.dragOrder,
    };
  },
  cables: () => {
    const q = generateCableQuestion();
    const reasonInputs = Array.from({ length: q.reasonCount }, (_, i) => ({
      valueKey: `reason${i + 1}`,
      label: `Vorteil ${i + 1}`,
      valueOptions: ALL_CABLE_PROS,
      acceptedValues: q.correctPros,
    }));
    return {
      id: createQuestionId('cables'),
      theme: q.theme,
      module: 'cables',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'medium',
      answerInputs: [
        {
          valueKey: 'cableType',
          label: 'Kabeltyp',
          valueOptions: CABLE_TYPES.map((c) => c.type),
          acceptedValues: [String(q.expectedAnswers.cableType)],
        },
        ...reasonInputs,
      ],
    };
  },
  linux: () => {
    const q = generateLinuxQuestion();
    return {
      id: createQuestionId('linux'),
      theme: q.theme,
      module: 'linux',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: q.difficulty,
      answerInputs: q.answerInputs,
      direction: q.direction,
    };
  },
  cloud: () => {
    const q = generateCloudQuestion();
    return {
      id: createQuestionId('cloud'),
      theme: q.theme,
      module: 'cloud',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: q.difficulty,
      answerInputs: q.answerInputs,
      scenario: q.scenario,
    };
  },
  handelskalkulation: generateHandelskalkulationQuestion,
  handelskalkulationVorwaerts: generateVorwaertsKalkulationQuestion,
  handelskalkulationRueckwaerts: generateRueckwaertsKalkulationQuestion,
  raid: () => {
    const q = generateRaidQuestion();
    return {
      id: createQuestionId('raid'),
      theme: q.theme,
      module: 'raid',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: q.difficulty,
      answerInputs: q.answerInputs,
      raid: q.raid,
    };
  },
};

/**
 * Every module ID that has a registered generator. Useful for tests and
 * for asserting coverage from the module list. Derived from the keyof the
 * registry so it stays in sync with `Record<RegistryModuleId, …>`.
 */
export const GENERATOR_MODULE_IDS: readonly RegistryModuleId[] = Object.keys(
  GENERATORS,
) as readonly RegistryModuleId[];
