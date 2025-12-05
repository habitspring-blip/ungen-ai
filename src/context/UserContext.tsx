"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  name: string;
  email: string;
  avatar: string;
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const params = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Map Supabase user to your User type
  const mapUser = useCallback((sbUser: SupabaseUser): User => {
    return {
      name: (sbUser.user_metadata?.full_name as string) || "User",
      email: sbUser.email as string,
      avatar:
        (sbUser.user_metadata?.avatar_url as string) ||
        "https://ui-avatars.com/api/?name=U&background=111&color=fff",
      plan: (sbUser.user_metadata?.plan as string) || "Free",
      creditsUsed: (sbUser.user_metadata?.creditsUsed as number) || 0,
      creditsLimit: (sbUser.user_metadata?.creditsLimit as number) || 1000,
    };
  }, []);

  // Clear PKCE / magic link params from URL
  const clearAuthParams = useCallback(() => {
    const code = params.get("code");
    const token = params.get("token");
    const type = params.get("type");

    if (code || token || type) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [params]);

  // Initial session load
  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session?.user) {
        setUser(mapUser(data.session.user));
      } else {
        setUser(null);
      }

      clearAuthParams();
      setLoading(false);
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [supabase, mapUser, clearAuthParams]);

  // Auth event handling
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(mapUser(session.user));
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        router.push("/login");
      }

      clearAuthParams();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, mapUser, router, clearAuthParams]);

  // Logout
  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return ctx;
}
