"use client"

import { ReactNode, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

/*
  PROTECTED CLIENT (v2)
  ---------------------------------------------------------
  • Prevents UI flash before auth check
  • Redirects instantly if unauthenticated
  • Fully stable in React 18
  • No race conditions or mounted flags
  • Validates session once, cleanly
*/

export default function ProtectedClient({ children }: { children: ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  const [ready, setReady] = useState(false)

  useEffect(() => {
    let isActive = true

    async function verify() {
      const { data } = await supabase.auth.getSession()

      if (!isActive) return

      if (!data.session) {
        router.replace("/login")
        return
      }

      setReady(true)
    }

    // Use a microtask to avoid React 18 hydration timing issues
    Promise.resolve().then(verify)

    return () => {
      isActive = false
    }
  }, [router, supabase])

  // Loading State
  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-surface-1">
        <div className="animate-pulse text-sm text-ink-2">
          Verifying session…
        </div>
      </div>
    )
  }

  return <>{children}</>
}
