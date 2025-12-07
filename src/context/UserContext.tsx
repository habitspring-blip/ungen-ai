"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  name: string;
  email: string;
  avatar: string;
  plan: string;
  credits: number;
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

// Inner component that uses useSearchParams
function UserProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const params = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Map Supabase user to your User type - NOW FETCHES FROM DATABASE
  const mapUser = useCallback(async (sbUser: SupabaseUser): Promise<User> => {
    // Fetch actual credits from public.users table
    const { data: userData } = await supabase
      .from('users')
      .select('credits, credits_limit, name')
      .eq('id', sbUser.id)
      .single();

    return {
      name: userData?.name || (sbUser.user_metadata?.full_name as string) || "User",
      email: sbUser.email as string,
      avatar:
        (sbUser.user_metadata?.avatar_url as string) ||
        "https://ui-avatars.com/api/?name=U&background=111&color=fff",
      plan: (sbUser.user_metadata?.plan as string) || "Free",
      credits: userData?.credits || 500, // FROM DATABASE, not cached metadata
      creditsUsed: (sbUser.user_metadata?.creditsUsed as number) || 0,
      creditsLimit: userData?.credits_limit || 500, // FROM DATABASE
    };
  }, [supabase]);

  // Clear PKCE / magic link params from URL
  const clearAuthParams = useCallback(() => {
    const code = params.get("code");
    const token = params.get("type");
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
        const mappedUser = await mapUser(data.session.user); // Now async
        setUser(mappedUser);
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
    } = supabase.auth.onAuthStateChange(async (event, session) => { // Now async
      if (event === "SIGNED_IN" && session?.user) {
        const mappedUser = await mapUser(session.user); // Now async
        setUser(mappedUser);
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

// Outer component that wraps the inner one in Suspense
export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProviderInner>{children}</UserProviderInner>
    </Suspense>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used inside UserProvider");
  }
  return ctx;
}