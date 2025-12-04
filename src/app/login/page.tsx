"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { setUser } = useUser()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)
  const [loading, setLoading] = useState(false)

  // Session check
  const checkSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      router.replace("/dashboard")
    } else {
      setCheckingSession(false)
    }
  }, [router, supabase])

  useEffect(() => {
    Promise.resolve().then(checkSession)
  }, [checkSession])

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <div className="animate-pulse text-sm text-ink-2">Loading…</div>
      </div>
    )
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const userData = {
        name: user.user_metadata.full_name || "User",
        email: user.email!,
        avatar:
          user.user_metadata.avatar_url ||
          "https://ui-avatars.com/api/?name=U&background=111&color=fff",
        plan: "Free",
        creditsUsed: 0,
        creditsLimit: 1000,
      }

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
    }

    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1">
      <div
        className="
          w-full max-w-md p-10 bg-surface-0 rounded-xl 
          shadow-depth border border-surface-2
        "
      >
        <h1 className="text-2xl font-semibold text-ink-0 text-center mb-8">
          Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="email"
            className="
              w-full px-4 py-3 rounded-md text-sm 
              bg-surface-0 border border-surface-3 text-ink-0 
              focus:ring-2 focus:ring-accent/20 focus:border-accent
            "
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="
              w-full px-4 py-3 rounded-md text-sm 
              bg-surface-0 border border-surface-3 text-ink-0 
              focus:ring-2 focus:ring-accent/20 focus:border-accent
            "
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 rounded-md font-medium text-white
              bg-ink-0 hover:bg-ink-1 transition 
              disabled:opacity-40
            "
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-ink-2">
          <a href="/forgot-password" className="underline">
            Forgot password?
          </a>
        </p>

        <p className="text-center text-sm mt-2 text-ink-2">
          Do not have an account?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
