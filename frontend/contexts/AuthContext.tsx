"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "@/lib/api";
import type { User, AuthState } from "@/lib/types";

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchMe = useCallback(async (token: string) => {
    try {
      const res = await authApi.me();
      setState({
        user: res.data as User,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      localStorage.removeItem("access_token");
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchMe(token);
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { access_token, user } = res.data;
    localStorage.setItem("access_token", access_token);
    setState({ user, token: access_token, isLoading: false, isAuthenticated: true });
  };

  const register = async (data: Record<string, unknown>) => {
    const res = await authApi.register(data);
    const { access_token, user } = res.data;
    localStorage.setItem("access_token", access_token);
    setState({ user, token: access_token, isLoading: false, isAuthenticated: true });
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem("access_token");
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
