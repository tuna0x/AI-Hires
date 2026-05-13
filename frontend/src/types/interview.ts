export interface AnswerScore {
  id: number;
  criteria: "RELEVANCE" | "DEPTH" | "STRUCTURE" | "COMMUNICATION";
  score: number; // 0-10
  comment: string;
}

export interface InterviewEvaluation {
  id: number;
  score: number; // 0-10
  feedback: string;
}

export interface InterviewAnswer {
  id: number;
  answerText: string;
  answeredAt: string;
  responseTimeSeconds?: number;
  interviewEvaluation?: InterviewEvaluation;
  answerScores?: AnswerScore[];
}

export interface InterviewQuestion {
  id: number;
  questionText: string;
  questionType: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionOrder: number;
  cvContext?: string;
  jdContext?: string;
  canReuse?: boolean;
  interviewAnswer?: InterviewAnswer | null;
}

export interface InterviewSession {
  id: number;
  status: "IN_PROGRESS" | "REPORT_GENERATING" | "COMPLETED" | "CANCELLED";
  interviewType: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD" | "ADAPTIVE";
  totalQuestions: number;
  maxQuestions: number;
  startTime: string;
  endTime?: string;
  jobTitle?: string;
  jobDescription?: string;
  resumeId?: number;
  scanId?: number;
}

export interface InterviewInsight {
  id: number;
  type: "STRENGTH" | "WEAKNESS";
  title: string;
  displayOrder: number;
}

export interface InterviewReport {
  id: number;
  finalScore: number;
  decision: "PASS" | "CONSIDER" | "FAIL";
  summary: string;
  insights: InterviewInsight[];
}

export interface InterviewReportResponse {
  status: "PROCESSING" | "COMPLETED";
  report: InterviewReport | null;
}

export interface StartInterviewRequest {
  applicationId: number;
  targetLevel?: string;
}

export interface StartMockInterviewRequest {
  resumeId?: number;
  scanId?: number;
  targetRole: string;
  jobDescription: string;
  targetLevel?: string;
}

export interface ScoreStatus {
  questionId: number;
  questionOrder: number;
  status: "unanswered" | "pending" | "completed";
  score?: number;
  feedback?: string;
}

export interface ScoreStatusResponse {
  scores: ScoreStatus[];
}

export interface SubmitAnswerResponse {
  evaluation: InterviewEvaluation | null;
  nextQuestion: InterviewQuestion | null;
  isFinished: boolean;
  scoreStatus?: "pending" | "completed";
}
