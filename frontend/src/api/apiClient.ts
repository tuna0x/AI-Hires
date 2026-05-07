import axios from "axios";
import { supabase } from "@/integrations/supabase/client";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Tự động đính kèm token truy cập từ Supabase nếu có
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error("Error fetching auth session for api client:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý phản hồi và lỗi tập trung
apiClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp response body (đối tượng RestResponse chuẩn từ backend)
    return response.data;
  },
  (error) => {
    console.error("API Error Response:", error.response || error);
    return Promise.reject(error);
  }
);

export default apiClient;
