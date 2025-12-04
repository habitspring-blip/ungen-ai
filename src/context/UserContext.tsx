"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface User {
  name: string
  email: string
  avatar: string
  plan: string
  creditsUsed: number
  creditsLimit: number
}

interface UserContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Convert raw Supabase session user into your User type
  const mapUser = useCallback((sbUser: any): User => {
    return {
      name: sbUser.user_metadata?.full_name || "User",
      email: sbUser.email,
      avatar:
        sbUser.user_metadata?.avatar_url ||
        "https://ui-avatars.com/api/?name=U&background=111&color=fff",
      plan: "Free",
      creditsUsed: 0,
      creditsLimit: 1000,
    }
  }, [])

  // Initial session load (only once)
  useEffect(() => {
    let active = true

    async function load() {
      const { data } = await supabase.auth.getSession()

      if (!active) return

      if (data.session?.user) {
        const mapped = mapUser(data.session.user)
        setUser(mapped)
        localStorage.setItem("user", JSON.stringify(mapped))
      } else {
        setUser(null)
        localStorage.removeItem("user")
      }

      setLoading(false)
    }

    // Make sure it does not block hydration
    Promise.resolve().then(load)

    return () => {
      active = false
    }
  }, [supabase, mapUser])

  // Subscribe to Supabase auth events (login, logout, refresh)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const mapped = mapUser(session.user)
        setUser(mapped)
        localStorage.setItem("user", JSON.stringify(mapped))
      }

      if (event === "SIGNED_OUT") {
        setUser(null)
        localStorage.removeItem("user")
        router.push("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, mapUser, router])

  // Logout handler
  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <UserContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used inside UserProvider")
  return ctx
}
