import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { galleryApi } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("galleryToken");
    if (!token) {
      setLoading(false);
      return;
    }

    galleryApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem("galleryToken"))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const result = await galleryApi.login({ email, password });
        localStorage.setItem("galleryToken", result.token);
        setUser(result.user);
      },
      register: async (name, email, password) => {
        const result = await galleryApi.register({ name, email, password });
        localStorage.setItem("galleryToken", result.token);
        setUser(result.user);
      },
      logout: () => {
        localStorage.removeItem("galleryToken");
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
