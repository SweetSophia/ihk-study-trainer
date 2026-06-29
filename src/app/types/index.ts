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

/**
 * Configuration for a drag-to-reorder exercise. When present on a Question,
 * StudyCard renders a DragOrderExercise component instead of text inputs.
 */
export interface DragOrderConfig {
  /** Items in their initial (shuffled) display order */
  items: string[];
  /** Items in the canonical correct order */
  correctOrder: string[];
}

/**
 * Configuration for the RAID calculator module. When present on a Question,
 * StudyCard renders the RAID visualization alongside the answer inputs.
 */
export interface RaidConfig {
  level: 'RAID 0' | 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10';
  /** Total number of disks in the array */
  disks: number;
  /** Capacity of a single disk in GB */
  diskSizeGb: number;
  /** Total usable capacity for the array in GB (precomputed by the generator) */
  usableCapacityGb: number;
  /** Number of disk failures the array can tolerate */
  faultTolerance: number;
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
  direction?: 'commandToDescription' | 'descriptionToCommand';
  /**
   * Optional scenario text for modules that include situational context
   * (e.g., Cloud: describes the business/technical scenario for scenario-based questions)
   */
  scenario?: string;
  /**
   * When present, StudyCard renders a drag-to-reorder exercise instead of
   * text inputs. The user drags items into the order specified by
   * `dragOrder.correctOrder`.
   */
  dragOrder?: DragOrderConfig;
  /**
   * When present, the RAID calculator module provides the scenario used by
   * the visualization (level + disk count + disk size → usable capacity +
   * fault tolerance).
   */
  raid?: RaidConfig;
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
