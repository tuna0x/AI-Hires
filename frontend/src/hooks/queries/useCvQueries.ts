import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cvApi } from "@/api/cvApi";
import { cvStore } from "@/lib/store";
import { mapResumeToAnalysisResult } from "@/lib/cvMapper";
import { toast } from "sonner";

export function useUploadCvMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await cvApi.uploadCv(file);
      if (response.statusCode >= 400 || !response.data) {
        throw new Error(response.message || "Tải lên CV thất bại!");
      }
      return response.data;
    },
    onSuccess: (resume) => {
      // Chỉ chuyển đổi và lưu kết quả hiển thị nếu đã hoàn thành phân tích ở backend
      if (resume.parseStatus === "DONE" || resume.parseStatus === "FAILED") {
        const mappedResult = mapResumeToAnalysisResult(resume);
        cvStore.setResult(mappedResult);
      }
      
      // Refresh dữ liệu cache nếu cần thiết
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      
      toast.success("Tải lên hồ sơ thành công! Đang tiến hành phân tích...");
    },
    onError: (error: any) => {
      console.error("Error uploading CV:", error);
      const msg = error.response?.data?.message || error.message || "Đã xảy ra lỗi khi tải lên CV. Vui lòng thử lại!";
      toast.error(msg);
    },
  });
}
