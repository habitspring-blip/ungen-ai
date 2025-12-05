"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const search = useSearchParams();
  const router = useRouter();

  const token = search.get("token"); // token_hash
  const type = search.get("type");

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1 — Verify token_hash from Supabase recovery link
  useEffect(() => {
    async function init() {
      if (!token || type !== "recovery") return;

      const { error } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: token, // ✔ FIXED PARAM
      });

      if (error) {
        console.error(error);
        alert("Reset link is invalid or expired.");
        return;
      }

      setReady(true);
    }

    init();
  }, [token, type]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-sm">Invalid or expired reset link.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Validating reset link…</p>
      </div>
    );
  }

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
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-2 px-4 py-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                required
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full mt-2 px-4 py-3 border rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white rounded-lg"
            >
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        ) : (
          <p className="text-center text-gray-700">
            Password updated successfully. Redirecting…
          </p>
        )}
      </div>
    </div>
  );
}
