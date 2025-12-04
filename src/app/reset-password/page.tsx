"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function ResetPasswordForm() {
  const supabase = createClient()
  const params = useSearchParams()
  const router = useRouter()

  const accessToken = params.get("access_token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)

  // Ensure token exists
  useEffect(() => {
    if (!accessToken) return
    setReady(true)
  }, [accessToken])

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <div className="text-ink-1 text-sm">Invalid or expired reset link.</div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (password !== confirm) {
      alert("Passwords do not match.")
      return
    }

    setLoading(true)

    // Update the password
    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setDone(true)

    setTimeout(() => {
      router.push("/login")
    }, 1500)
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <div className="animate-pulse text-sm text-ink-2">Loading…</div>
      </div>
    )
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
          Reset Your Password
        </h1>

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="password"
              className="
                w-full px-4 py-3 rounded-md text-sm
                bg-surface-0 border border-surface-3 text-ink-0
                placeholder-ink-2
                focus:ring-2 focus:ring-accent/20 focus:border-accent
              "
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        ) : (
          <p className="text-center text-base text-ink-1">
            Password updated successfully.
            <br />
            Redirecting to login…
          </p>
        )}

        <p className="text-center text-sm mt-6 text-ink-2">
          <a href="/login" className="underline">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <div className="animate-pulse text-sm text-ink-2">Loading…</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}