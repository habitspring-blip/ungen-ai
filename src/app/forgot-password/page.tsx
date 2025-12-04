"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setSent(true)
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
          Reset Password
        </h1>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="email"
              className="
                w-full px-4 py-3 rounded-md text-sm
                bg-surface-0 border border-surface-3 text-ink-0
                placeholder-ink-2
                focus:ring-2 focus:ring-accent/20 focus:border-accent
              "
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <p className="text-center text-base text-ink-1 leading-relaxed">
            A password reset link has been sent to your email.
            <br />
            Please check your inbox.
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
