"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const supabase = createClient();
  const search = useSearchParams();
  const router = useRouter();

  const code = search.get("code");

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // STEP 1 → Exchange reset code for Supabase session
  useEffect(() => {
    async function init() {
      if (!code) return;

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error(error);
        alert("Reset link is invalid or expired.");
        return;
      }

      setReady(true);
    }

    init();
  }, [code, supabase]);

  // Invalid link UI
  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-sm">Invalid or expired reset link.</p>
      </div>
    );
  }

  // Loading while exchanging session
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Validating reset link…</p>
      </div>
    );
  }

  // STEP 2 → Update password (now authenticated)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          Reset Your Password
        </h1>

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full mt-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-black text-white font-medium transition hover:bg-gray-900 disabled:opacity-40"
            >
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        ) : (
          <p className="text-center text-gray-700 text-base">
            Password updated successfully.
            <br />
            Redirecting…
          </p>
        )}

        <p className="text-center text-sm mt-6 text-gray-500">
          <a href="/login" className="underline hover:text-black">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
