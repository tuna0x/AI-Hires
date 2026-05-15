import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import apiClient from "@/api/apiClient";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  verified: boolean;
  permissions: string[];
  avatar?: string;
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
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
  hasPermission: () => false,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const SUPER_ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
  const isAdmin = useMemo(() => !!user && SUPER_ADMIN_ROLES.includes(user.role), [user]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (isAdmin) return true; // ADMIN/SUPER_ADMIN bypasses all checks
      return user.permissions?.includes(permission) ?? false;
    },
    [user, isAdmin]
  );

  // Đồng bộ session của người dùng khi ứng dụng khởi chạy
  const syncSession = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    syncSession();
  }, [syncSession]);

  const login = useCallback(async (email: string, password: string) => {
    const response: any = await apiClient.post("/api/v1/auth/login", { email, password });
    const accessToken = response?.data?.access_token;
    const loggedUser = response?.data?.user;
    if (accessToken && loggedUser) {
      localStorage.setItem("intervio_access_token", accessToken);
      setUser(loggedUser);
    } else {
      throw new Error("Thông tin phản hồi đăng nhập từ hệ thống không hợp lệ.");
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
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
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch (err) {
      console.error("Lỗi khi gọi API logout:", err);
    } finally {
      localStorage.removeItem("intervio_access_token");
      setUser(null);
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const response: any = await apiClient.post("/api/v1/auth/google", { credential });
    const accessToken = response?.data?.access_token;
    const loggedUser = response?.data?.user;
    if (accessToken && loggedUser) {
      localStorage.setItem("intervio_access_token", accessToken);
      setUser(loggedUser);
    } else {
      throw new Error("Thông tin phản hồi đăng nhập bằng Google từ hệ thống không hợp lệ.");
    }
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      isAdmin,
      hasPermission,
      login,
      register,
      loginWithGoogle,
      signOut,
      refreshUser: syncSession,
    }),
    [user, loading, isAdmin, hasPermission, login, register, loginWithGoogle, signOut, syncSession]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}