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

    // Listen for auth state changes (login/logout/token refresh)
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
    }
  };

  const register = async (data: Record<string, unknown>) => {
    const email = data.email as string;
    const password = data.password as string;
    const role = (data.role as UserRole) || "student";
    const full_name = (data.full_name as string) || "";

    setState((s) => ({ ...s, isLoading: true }));
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name },
      },
    });
    if (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw new Error(error.message);
    }

    // After signup, create the role-specific profile row
    if (signUpData.user) {
      await createProfileRow(signUpData.user.id, role, full_name, email);
    }

    if (signUpData.session) {
      const appUser = await buildUserFromSession(signUpData.session.user, signUpData.session.access_token);
      setState({ user: appUser, token: signUpData.session.access_token, isLoading: false, isAuthenticated: true });
    } else {
      // Email confirmation required — Supabase didn't auto-sign in
      setState((s) => ({ ...s, isLoading: false }));
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

async function createProfileRow(userId: string, role: UserRole, fullName: string, email: string) {
  if (role === "student") {
    await supabase.from("student_profiles").upsert({
      user_id: userId,
      full_name: fullName,
      email,
      profile_completion: 0,
    }, { onConflict: "user_id" });
  } else if (role === "university") {
    await supabase.from("university_profiles").upsert({
      user_id: userId,
      name: fullName,
      contact_email: email,
    }, { onConflict: "user_id" });
  } else if (role === "recruiter") {
    await supabase.from("recruiter_profiles").upsert({
      user_id: userId,
      company_name: fullName,
      contact_email: email,
    }, { onConflict: "user_id" });
  } else if (role === "mentor") {
    await supabase.from("mentor_profiles").upsert({
      user_id: userId,
      full_name: fullName,
    }, { onConflict: "user_id" });
  }
}
