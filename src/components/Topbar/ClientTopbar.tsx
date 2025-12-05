"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "../ui/Button";
import { useUser } from "@/context/UserContext";

export default function ClientTopbar() {
  const { logout, user } = useUser();
  
  const [menuOpen, setMenuOpen] = useState(false);

  const toggle = () => setMenuOpen(!menuOpen);

  const avatarLetter = user?.name?.[0]?.toUpperCase() || "U";

  const isFreePlan = user?.plan === "Free";

  return (
    <div className="relative flex items-center gap-3">

      {/* Upgrade CTA only when logged in & free plan */}
      {user && isFreePlan && (
        <Button
          variant="primary"
          className="hidden sm:flex px-3 py-1.5 text-sm rounded-md shadow-soft"
        >
          Upgrade
        </Button>
      )}

      {/* Avatar Icon (always visible) */}
      <button
        onClick={toggle}
        className="
          w-9 h-9 rounded-full 
          bg-surface-2 text-ink-0 
          flex items-center justify-center 
          font-medium shadow-soft
        "
      >
        {avatarLetter}
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div
          className="
            absolute right-0 top-12 
            bg-surface-0 border border-surface-3 
            shadow-soft rounded-md w-56 py-2 z-50
          "
        >
          {/* If not logged in – show sign in only */}
          {!user && (
            <Link
              href="/login"
              className="
                block px-4 py-2 text-sm 
                text-ink-1 hover:text-ink-0 hover:bg-surface-2
              "
            >
              Sign In
            </Link>
          )}

          {/* Logged-in menu */}
          {user && (
            <>
              {/* User info block */}
              <div className="px-4 py-2 border-b border-surface-2">
                <p className="text-sm font-medium text-ink-0">
                  {user.name}
                </p>
                <p className="text-xs text-ink-2">{user.email}</p>
              </div>

              {/* Dashboard */}
              <Link
                href="/dashboard"
                className="
                  block px-4 py-2 text-sm 
                  text-ink-1 hover:text-ink-0 hover:bg-surface-2
                "
              >
                Dashboard
              </Link>

              {/* Account Preferences */}
              <Link
                href="/account"
                className="
                  block px-4 py-2 text-sm 
                  text-ink-1 hover:text-ink-0 hover:bg-surface-2
                "
              >
                Account Preferences
              </Link>

              {/* Theme */}
              <Link
                href="/theme"
                className="
                  block px-4 py-2 text-sm 
                  text-ink-1 hover:text-ink-0 hover:bg-surface-2
                "
              >
                Theme
              </Link>

              {/* Upgrade – only for free plan */}
              {isFreePlan && (
                <Link
                  href="/pricing"
                  className="
                    block px-4 py-2 text-sm 
                    text-ink-1 hover:text-ink-0 hover:bg-surface-2
                  "
                >
                  Upgrade
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                className="
                  w-full text-left px-4 py-2 text-sm 
                  text-red-600 hover:bg-surface-2
                "
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
