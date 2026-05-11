import apiClient from "./apiClient";
import { RestResponse } from "@/types/api";
import { Resume } from "@/types/cv";

export const cvApi = {
  uploadCv: async (file: File): Promise<RestResponse<Resume>> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post<any, RestResponse<Resume>>(
      "/api/v1/resumes/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
  getResumeDetails: async (id: number): Promise<RestResponse<Resume>> => {
    return apiClient.get<any, RestResponse<Resume>>(`/api/v1/resumes/${id}`);
  },
};
export default cvApi;
