"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace("/dashboard")
        return
      }
      setCheckingSession(false)
    }
    check()
  }, [router, supabase])

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <div className="animate-pulse text-sm text-ink-2">Loading…</div>
      </div>
    )
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    alert("Account created. Please check your email to verify your account.")
    router.push("/login")
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
          Create Account
        </h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="email"
            className="
              w-full px-4 py-3 rounded-md text-sm
              bg-surface-0 border border-surface-3 text-ink-0
              placeholder-ink-2
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
              placeholder-ink-2
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
            {loading ? "Creating Account…" : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-ink-2">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Log In
          </a>
        </p>
      </div>
    </div>
  )
}
