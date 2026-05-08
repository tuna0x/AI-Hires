import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import apiClient from "@/api/apiClient";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  verified: boolean;
  permissions: string[];
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => user?.role === "ADMIN", [user]);

  // Đồng bộ session của người dùng khi ứng dụng khởi chạy
  async function syncSession() {
    const accessToken = localStorage.getItem("intervio_access_token");
    if (accessToken) {
      try {
        const response: any = await apiClient.get("/api/v1/auth/account");
        if (response?.data?.user) {
          setUser(response.data.user);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Access token invalid, attempting silent refresh...", err);
      }
    }

    // Nếu không có access token hoặc token cũ bị lỗi, thử Silent Refresh qua Cookie refresh_token
    try {
      const response: any = await apiClient.post("/api/v1/auth/refresh");
      const newAccessToken = response?.data?.access_token;
      const loggedUser = response?.data?.user;
      if (newAccessToken && loggedUser) {
        localStorage.setItem("intervio_access_token", newAccessToken);
        setUser(loggedUser);
      } else {
        setUser(null);
        localStorage.removeItem("intervio_access_token");
      }
    } catch (err) {
      console.log("No active session or refresh token found");
      setUser(null);
      localStorage.removeItem("intervio_access_token");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    syncSession();
  }, []);

  async function login(email: string, password: string) {
    const response: any = await apiClient.post("/api/v1/auth/login", { email, password });
    const accessToken = response?.data?.access_token;
    const loggedUser = response?.data?.user;
    if (accessToken && loggedUser) {
      localStorage.setItem("intervio_access_token", accessToken);
      setUser(loggedUser);
    } else {
      throw new Error("Thông tin phản hồi đăng nhập từ hệ thống không hợp lệ.");
    }
  }

  async function register(email: string, password: string, fullName?: string) {
    // Đăng ký tài khoản mới với vai trò mặc định CANDIDATE và fullName nếu có
    const response: any = await apiClient.post("/api/v1/auth/register", {
      email,
      password,
      role: "CANDIDATE",
      fullName,
    });
    const accessToken = response?.data?.access_token;
    const loggedUser = response?.data?.user;
    if (accessToken && loggedUser) {
      localStorage.setItem("intervio_access_token", accessToken);
      setUser(loggedUser);
    } else {
      throw new Error("Thông tin phản hồi đăng ký từ hệ thống không hợp lệ.");
    }
  }

  async function signOut() {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch (err) {
      console.error("Lỗi khi gọi API logout:", err);
    } finally {
      localStorage.removeItem("intervio_access_token");
      setUser(null);
    }
  }

  async function loginWithGoogle(credential: string) {
    const response: any = await apiClient.post("/api/v1/auth/google", { credential });
    const accessToken = response?.data?.access_token;
    const loggedUser = response?.data?.user;
    if (accessToken && loggedUser) {
      localStorage.setItem("intervio_access_token", accessToken);
      setUser(loggedUser);
    } else {
      throw new Error("Thông tin phản hồi đăng nhập bằng Google từ hệ thống không hợp lệ.");
    }
  }

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      isAdmin,
      login,
      register,
      loginWithGoogle,
      signOut,
      refreshUser: syncSession,
    }),
    [user, loading, isAdmin]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}