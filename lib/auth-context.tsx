"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { User, Session, login as authLogin, logout as authLogout } from "./auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (rut: string, password: string) => Promise<Session>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setUser(null);
      return;
    }
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.session.user.id)
      .single();
    if (error || !profile) {
      setUser(null);
      return;
    }
    setUser({
      id: profile.id,
      rut: profile.rut,
      role: profile.role,
      name: profile.name,
      email: profile.email,
      birthDate: profile.birth_date ?? undefined,
      diseases: profile.diseases ?? undefined,
      allergies: profile.allergies ?? undefined,
      phone: profile.phone ?? undefined,
      createdAt: profile.created_at,
    });
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));

    // Mantiene el estado sincronizado si la sesión cambia en otra pestaña
    // o expira (Supabase la refresca sola mientras la pestaña esté abierta).
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });

    return () => listener.subscription.unsubscribe();
  }, [refreshUser]);

  const login = async (rut: string, password: string): Promise<Session> => {
    const session = await authLogin(rut, password);
    setUser(session.user);
    return session;
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
