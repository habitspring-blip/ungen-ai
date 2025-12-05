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
  const [googleLoading, setGoogleLoading] = useState(false)

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

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        alert(error.message)
        setGoogleLoading(false)
        return
      }

      // User will be redirected to Google for authentication
      // After successful authentication, they'll be redirected back to our callback
    } catch (error) {
      console.error("Google login error:", error)
      alert("Failed to initiate Google login")
      setGoogleLoading(false)
    }
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

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-3" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-0 text-ink-2">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="
                w-full flex justify-center items-center px-4 py-3 border border-surface-3
                rounded-md shadow-sm text-sm font-medium text-ink-0 bg-surface-0
                hover:bg-surface-1 focus:outline-none focus:ring-2 focus:ring-offset-2
                focus:ring-accent disabled:opacity-40 transition
              "
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </button>
          </div>
        </div>

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
