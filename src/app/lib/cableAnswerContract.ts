import type { AnswerInputConfig, Question } from '../types';

/** Resolve selected-medium accepted advantages while retaining catalogue distractors. */
export function getCableAnswerInputs(question: Question, answers: Record<string, string>): AnswerInputConfig[] | undefined {
  if (question.module !== 'cables' || !question.cableChoices) return question.answerInputs;
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
  const selected = question.cableChoices.find(choice => normalize(choice.type) === normalize(answers.cableType ?? ''));
  return question.answerInputs?.map(cfg => /^reason\d+$/.test(cfg.valueKey)
    ? { ...cfg, valueOptions: selected ? cfg.valueOptions : [], acceptedValues: selected?.pros ?? [] }
    : cfg);
}
