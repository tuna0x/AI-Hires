import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  withCredentials: true, // Kích hoạt tự động gửi cookie chéo nguồn (refresh_token HttpOnly)
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Tự động đính kèm access token từ localStorage
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("intervio_access_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag để kiểm soát việc đang refresh token nhằm tránh lặp vô hạn
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Trả về dữ liệu trực tiếp và xử lý Silent Refresh khi gặp lỗi 401
apiClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp phần dữ liệu chính của RestResponse từ Backend
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và không phải là yêu cầu refresh token và chưa từng được thử lại (retry)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/refresh")) {
      if (isRefreshing) {
        // Nếu đang trong quá trình refresh, xếp hàng các yêu cầu API khác lại
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Loại bỏ dấu gạch chéo cuối của baseURL (nếu có) để tránh tạo ra double slash (//)
        const base = apiClient.defaults.baseURL || "";
        const cleanBaseURL = base.endsWith("/") ? base.slice(0, -1) : base;

        const refreshResponse = await axios.post(
          `${cleanBaseURL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.access_token;
        if (newAccessToken) {
          localStorage.setItem("intervio_access_token", newAccessToken);
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error("No access token returned from refresh endpoint");
        }
      } catch (refreshError) {
        // Nếu refresh thất bại (hết hạn cookie), xóa token cũ và đẩy ra trang đăng nhập
        localStorage.removeItem("intervio_access_token");
        processQueue(refreshError, null);
        
        // Chỉ chuyển hướng nếu đang ở trang riêng tư, tránh quấy rầy trang chủ
        if (window.location.pathname !== "/" && window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Không log lỗi "API Error Response" đối với lỗi 401 từ endpoint /auth/refresh (xảy ra bình thường khi khách vãng lai chưa đăng nhập)
    if (error.response?.status === 401 && originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    console.error("API Error Response:", error.response || error);
    return Promise.reject(error);
  }
);

export default apiClient;
