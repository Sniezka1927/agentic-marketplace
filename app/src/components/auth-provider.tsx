"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { api } from "@/lib/api";
import { tokenStore } from "@/lib/token-store";
import type { AuthResponse, User } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  login(email: string, password: string): Promise<User>;
  register(input: { email: string; password: string; displayName: string }): Promise<User>;
  logout(): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const subscribeNoop = () => () => {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const token = useSyncExternalStore(
    tokenStore.subscribe,
    tokenStore.get,
    tokenStore.getServerSnapshot,
  );

  const me = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => api<User>("/auth/me"),
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  const user = token ? (me.data ?? null) : null;
  const status: AuthStatus = !hydrated || (token && me.isPending)
    ? "loading"
    : user
      ? "authenticated"
      : "anonymous";

  const signIn = (response: AuthResponse) => {
    queryClient.setQueryData(["auth", "me", response.token], response.user);
    tokenStore.set(response.token);
    return response.user;
  };

  const value: AuthContextValue = {
    status,
    user,
    login: async (email, password) =>
      signIn(await api<AuthResponse>("/auth/login", { method: "POST", body: { email, password } })),
    register: async (input) =>
      signIn(await api<AuthResponse>("/auth/register", { method: "POST", body: input })),
    logout: () => {
      tokenStore.set(null);
      queryClient.clear();
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
