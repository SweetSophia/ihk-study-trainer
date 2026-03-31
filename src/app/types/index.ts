/** Configuration for a single answer input pair (value + optional unit dropdown) */
export interface AnswerInputConfig {
  /** Key in expectedAnswers that holds the numeric value */
  valueKey: string;
  /** Key in expectedAnswers that holds the expected unit string */
  unitKey?: string;
  /** Options to show in the unit dropdown */
  unitOptions?: string[];
  /** Optional label shown above the value input (e.g. "Stunden", "Dateigröße") */
  label?: string;
  /** When present, the value field renders as a dropdown instead of a number input */
  valueOptions?: string[];
  /** When present, validation accepts any value in this list (order-independent multi-correct) */
  acceptedValues?: string[];
}

/** Question interface for all generators */
export interface Question {
  id: string;
  theme: string;
  module: string;
  questionText: string;
  expectedAnswers: Record<string, string | number | boolean>;
  solutionSteps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  /**
   * When present, StudyCard renders one [input + dropdown] row per entry
   * instead of the generic text-input fallback.
   */
  answerInputs?: AnswerInputConfig[];
  /**
   * Optional direction hint for modules that support multiple question modes
   * (e.g., Linux: 'commandToDescription' vs 'descriptionToCommand')
   */
  direction?: string;
}

/** User interface */
export interface User {
  id: string;
  access_hash: string;
  created_at: string;
  last_login: string | null;
}

/** Progress interface */
export interface Progress {
  id: string;
  user_id: string;
  module: string;
  questions_attempted: number;
  questions_correct: number;
  streak_days: number;
  last_session: string | null;
  created_at: string;
}

/** Question History interface */
export interface QuestionHistory {
  id: string;
  user_id: string;
  module: string;
  question_type: string;
  was_correct: boolean;
  user_answer: string;
  correct_answer: string;
  created_at: string;
}
