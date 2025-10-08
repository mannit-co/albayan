export type QuestionType =
  | 'SingleSelect'
  | 'MultipleSelect'
  | 'Essay'
  | "Coding"          // 👈 add this
  | 'Fillup'
  
  | 'True/False'
  | 'Yes/No'
  | 'match-following'
  | 'Image'
  | 'audio-based'
  | 'disc-ranking'
  | 'disc-behavioral'
  | 'Disc';



export type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  image?: string;
  audioUrl?: string;
  matchPairs?: { left: string; right: string }[];
  blanks?: string[];
  discStatements?: string[];
  marks: number;
  tid?: string;    // ✅ Add collection ID
  title?: string;  // ✅ Add collection title
  
  skills?: string[]; // <-- Add this line
}

export interface QuestionState {
  visited: boolean;
  answered: boolean;
  markedForReview: boolean;
  response?: any;
}

export interface ExamResponse {
  questionId: string;
  answer: any;
  timeSpent: number;
  attempts: number;
}

export interface SecurityViolation {
  type:
    | 'tab-switch'
    | 'fullscreen-exit'
    | 'camera-off'
    | 'right-click'
    | 'copy-paste'
    | 'refresh'
    | 'shortcut';
  timestamp: number;
  details?: string;
}

export interface StatusCounts {
  total: number;
  answered: number;
  notAnswered: number;
  markedForReview: number;
  notVisited: number;
}