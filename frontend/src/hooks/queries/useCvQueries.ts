import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cvApi } from "@/api/cvApi";
import { cvStore } from "@/lib/store";
import { mapResumeScanToAnalysisResult } from "@/lib/cvMapper";
import { toast } from "sonner";

export function useUploadCvMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await cvApi.uploadCv(file);
      if (response.statusCode >= 400 || !response.data) {
        throw new Error(response.message || "Tai len CV that bai!");
      }
      return response.data;
    },
    onSuccess: (scan) => {
      if (scan.status === "COMPLETED" || scan.status === "FAILED") {
        const mappedResult = mapResumeScanToAnalysisResult(scan);
        cvStore.setResult(mappedResult);
      }

      queryClient.invalidateQueries({ queryKey: ["resume-scans"] });
      toast.success("Tai len ho so thanh cong! Dang tien hanh phan tich...");
    },
    onError: (error: any) => {
      console.error("Error uploading CV:", error);
      const msg = error.response?.data?.message || error.message || "Da xay ra loi khi tai len CV. Vui long thu lai!";
      toast.error(msg);
    },
  });
}
