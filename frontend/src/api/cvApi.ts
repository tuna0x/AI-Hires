import apiClient from "./apiClient";
import { RestResponse } from "@/types/api";
import { Resume, ResumeScanResult } from "@/types/cv";

export const cvApi = {
  uploadCv: async (file: File): Promise<RestResponse<ResumeScanResult>> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post<any, RestResponse<ResumeScanResult>>(
      "/api/v1/resume-scans",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
  getScanDetails: async (id: number): Promise<RestResponse<ResumeScanResult>> => {
    return apiClient.get<any, RestResponse<ResumeScanResult>>(`/api/v1/resume-scans/${id}`);
  },
  getResumeDetails: async (id: number): Promise<RestResponse<Resume>> => {
    return apiClient.get<any, RestResponse<Resume>>(`/api/v1/resumes/${id}`);
  },
};
export default cvApi;
