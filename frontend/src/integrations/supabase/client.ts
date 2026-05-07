// MOCK SUPABASE CLIENT - Độc lập không cần Server Supabase thật
// Giải quyết triệt để lỗi "supabaseUrl is required" mà vẫn giữ nguyên các tính năng Login/Logout/Admin cũ.

const listeners = new Set<(event: string, session: any) => void>();

const getSavedUser = () => {
  const u = localStorage.getItem("aih_user");
  return u ? JSON.parse(u) : null;
};

const getSessionObj = () => {
  const user = getSavedUser();
  return user ? { user, access_token: "mock-access-token" } : null;
};

const triggerStateChange = () => {
  const session = getSessionObj();
  listeners.forEach(cb => cb("SIGNED_IN", session));
};

export const supabase = {
  auth: {
    onAuthStateChange: (cb: (event: string, session: any) => void) => {
      listeners.add(cb);
      // Gọi callback ngay lập tức để đồng bộ hóa ban đầu
      cb("INITIAL_SESSION", getSessionObj());
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              listeners.delete(cb);
            }
          }
        }
      };
    },
    getSession: async () => {
      return { data: { session: getSessionObj() }, error: null };
    },
    setSession: async (tokens: any) => {
      return { data: { session: getSessionObj() }, error: null };
    },
    signInWithPassword: async ({ email }: { email: string }) => {
      const user = {
        id: "mock-user-123",
        email: email,
        user_metadata: { full_name: email.split("@")[0] }
      };
      localStorage.setItem("aih_user", JSON.stringify(user));
      triggerStateChange();
      return { data: { user, session: getSessionObj() }, error: null };
    },
    signUp: async ({ email }: { email: string }) => {
      const user = {
        id: "mock-user-123",
        email: email,
        user_metadata: { full_name: email.split("@")[0] }
      };
      localStorage.setItem("aih_user", JSON.stringify(user));
      triggerStateChange();
      return { data: { user, session: getSessionObj() }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem("aih_user");
      triggerStateChange();
      return { error: null };
    }
  },
  from: (table: string) => {
    return {
      select: (columns?: string) => {
        return {
          eq: (col1: string, val1: any) => {
            return {
              eq: (col2: string, val2: any) => {
                return {
                  maybeSingle: async () => {
                    const user = getSavedUser();
                    // Cho phép tài khoản chứa chữ "admin" làm quản trị viên mẫu
                    if (user && user.email?.includes("admin")) {
                      return { data: { role: "admin" }, error: null };
                    }
                    return { data: null, error: null };
                  }
                };
              }
            };
          }
        };
      }
    };
  }
} as any;

export default supabase;