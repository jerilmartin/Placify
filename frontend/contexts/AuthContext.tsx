"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, AuthState, UserRole } from "@/lib/types";

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // On mount, restore session from Supabase
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", session.access_token);
        }
        const appUser = await buildUserFromSession(session.user, session.access_token);
        setState({ user: appUser, token: session.access_token, isLoading: false, isAuthenticated: true });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", session.access_token);
        }
        const appUser = await buildUserFromSession(session.user, session.access_token);
        setState({ user: appUser, token: session.access_token, isLoading: false, isAuthenticated: true });
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
        }
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw new Error(error.message);
    }
    if (data.session) {
      const appUser = await buildUserFromSession(data.session.user, data.session.access_token);
      setState({ user: appUser, token: data.session.access_token, isLoading: false, isAuthenticated: true });

      // Best-effort: repair missing profile row for accounts stuck without one
      try {
        await ensureProfileExists(data.session.access_token, data.session.user);
      } catch (_) {
        // Non-fatal
      }
    }
  };

  const register = async (data: Record<string, unknown>) => {
    const email = data.email as string;
    const password = data.password as string;
    const role = (data.role as UserRole) || "student";
    const full_name = (data.full_name as string) || "";

    setState((s) => ({ ...s, isLoading: true }));

    try {
      // Step 1: Call backend /api/auth/register — uses service_role key, bypasses RLS
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name,
          role,
          university: data.university,
          student_id: data.student_id,
          course: data.course,
          graduation_year: data.graduation_year,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: "Registration failed" }));
        setState((s) => ({ ...s, isLoading: false }));
        throw new Error(errBody.detail || "Registration failed");
      }

      // Step 2: Sign in immediately to get a Supabase session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Email confirmation enabled — backend registered OK but Supabase won't give session yet
        setState((s) => ({ ...s, isLoading: false }));
        throw new Error("CHECK_EMAIL");
      }

      if (signInData.session) {
        const appUser = await buildUserFromSession(signInData.session.user, signInData.session.access_token);
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", signInData.session.access_token);
        }
        setState({ user: appUser, token: signInData.session.access_token, isLoading: false, isAuthenticated: true });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
        throw new Error("CHECK_EMAIL");
      }
    } catch (err) {
      if (err instanceof Error && err.message !== "CHECK_EMAIL") {
        setState((s) => ({ ...s, isLoading: false }));
      }
      throw err;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
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

// ── Helpers ────────────────────────────────────────────────────────────────

async function buildUserFromSession(
  supaUser: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  _token: string
): Promise<User> {
  const role = (supaUser.user_metadata?.role as UserRole) || "student";
  const full_name = (supaUser.user_metadata?.full_name as string) || supaUser.email || "";

  return {
    id: supaUser.id,
    email: supaUser.email || "",
    full_name,
    role,
    created_at: new Date().toISOString(),
  };
}

/**
 * Called after login to repair accounts that are missing their profile row
 * (e.g. accounts created before the RLS fix). The backend uses service_role.
 */
async function ensureProfileExists(
  accessToken: string,
  supaUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  const role = (supaUser.user_metadata?.role as UserRole) || "student";
  const full_name = (supaUser.user_metadata?.full_name as string) || supaUser.email || "";

  await fetch(`${API_URL}/api/auth/repair-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ role, full_name, email: supaUser.email }),
  });
}
