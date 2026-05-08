import apiClient from "./apiClient";
import { RestResponse } from "@/types/api";
import {
  InterviewSession,
  InterviewQuestion,
  InterviewReport,
  StartInterviewRequest,
  StartMockInterviewRequest,
  SubmitAnswerResponse,
} from "@/types/interview";

export const interviewApi = {
  startInterview: async (req: StartInterviewRequest): Promise<InterviewSession> => {
    const res = await apiClient.post<any, RestResponse<InterviewSession>>("/api/v1/interviews/start", req);
    return res.data;
  },

  startMockInterview: async (req: StartMockInterviewRequest): Promise<InterviewSession> => {
    const res = await apiClient.post<any, RestResponse<InterviewSession>>("/api/v1/interviews/start-mock", req);
    return res.data;
  },

  extractJdText: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post<any, RestResponse<{ text: string }>>(
      "/api/v1/interviews/extract-text",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data.text;
  },

  getSession: async (sessionId: number): Promise<InterviewSession> => {
    const res = await apiClient.get<any, RestResponse<InterviewSession>>(`/api/v1/interviews/${sessionId}`);
    return res.data;
  },

  submitAnswer: async (sessionId: number, answerText: string): Promise<SubmitAnswerResponse> => {
    const res = await apiClient.post<any, RestResponse<SubmitAnswerResponse>>(`/api/v1/interviews/${sessionId}/answer`, { answer: answerText });
    return res.data;
  },

  finishInterview: async (sessionId: number): Promise<InterviewSession> => {
    const res = await apiClient.post<any, RestResponse<InterviewSession>>(`/api/v1/interviews/${sessionId}/finish`);
    return res.data;
  },

  getQuestions: async (sessionId: number): Promise<InterviewQuestion[]> => {
    const res = await apiClient.get<any, RestResponse<InterviewQuestion[]>>(`/api/v1/interviews/${sessionId}/questions`);
    return res.data;
  },

  getReport: async (sessionId: number): Promise<InterviewReport> => {
    const res = await apiClient.get<any, RestResponse<InterviewReport>>(`/api/v1/interviews/${sessionId}/report`);
    return res.data;
  },
};

export default interviewApi;
