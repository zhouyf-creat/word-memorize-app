export interface EbbinghausStage {
  id: string;
  name: string;
  label: string;
  offsetHours: number;
}

export const EBBINGHAUS_STAGES: EbbinghausStage[] = [
  { id: 'stage0', name: '第1遍', label: '立刻(0h)', offsetHours: 0 },
  { id: 'stage1', name: '1h', label: '1小时后', offsetHours: 1 },
  { id: 'stage2', name: '1天', label: '1天后', offsetHours: 24 },
  { id: 'stage3', name: '2天', label: '2天后', offsetHours: 48 },
  { id: 'stage4', name: '6天', label: '6天后', offsetHours: 144 }, // 6 * 24
  { id: 'stage5', name: '14天', label: '14天后', offsetHours: 336 }, // 14 * 24
  { id: 'stage6', name: '30天', label: '30天后', offsetHours: 720 }, // 30 * 24
];

export interface WordCheckState {
  status: 'pending' | 'due' | 'completed' | 'failed';
  dueTime: string; // ISO date string
  completedAt?: string; // ISO date string
}

export interface Word {
  id: string;
  word: string;
  translation: string;
  example?: string;
  exampleTranslation?: string;
  createdAt: string; // ISO date string
  checks: Record<string, WordCheckState>; // Key: stageId ('stage0', 'stage1', etc.)
}

export interface QuizQuestion {
  id: string;
  wordId: string;
  word: string;
  type: 'en-zh' | 'zh-en';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface Quiz {
  id: string;
  createdAt: string;
  questions: QuizQuestion[];
  completed: boolean;
  score?: number;
}
