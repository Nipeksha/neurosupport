export enum UserMode {
  DEFAULT = 'DEFAULT',
  DYSLEXIA = 'DYSLEXIA',
  AUTISM = 'AUTISM'
}

export enum SensoryTheme {
  BALANCED = 'BALANCED',
  CALM = 'CALM',
  FOCUS = 'FOCUS',
  OVERWHELMED = 'OVERWHELMED'
}

export type AvatarExpression = 
  | 'Friendly'    // Soft smile / friendly happiness
  | 'Excited'     // Open-mouth excited expression
  | 'Sad'         // Sad / about to cry look
  | 'Nervous'     // Nervous / unsure half-smile
  | 'Shy'         // Embarrassed / shy smile
  | 'Worried';    // Worried / concerned expression

export interface AssessmentResult {
  date: string;
  overallLikelihood: 'Low' | 'Medium' | 'High';
  domains: {
    social: number;       // 0-100
    sensory: number;      // 0-100
    communication: number;// 0-100
    routine: number;      // 0-100
    cognitive?: number;   // 0-100
    behavioral?: number;  // 0-100
  };
  summary: string;
  recommendations: string[];
  suggestedTheme: SensoryTheme;
}

export interface UserProfile {
  name: string;
  mode: UserMode;
  sensoryTheme: SensoryTheme;
  fontScale: number;
  useDyslexicFont: boolean;
  gameScores: {
    memory: number;
    sorting: number;
  };
  assessmentResult?: AssessmentResult;
  writingStats?: {
      lettersPracticed: number;
      avgAccuracy: number;
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface AnalysisResult {
  probability: number;
  observations: string[];
  recommendations: string[];
}
