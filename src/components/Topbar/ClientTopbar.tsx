"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import { useUser } from "@/context/UserContext";

export default function ClientTopbar() {
  const { logout, user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-3">

      {/* Upgrade CTA */}
      <Button
        variant="primary"
        className="hidden sm:flex px-3 py-1.5 text-sm rounded-md shadow-soft"
      >
        Upgrade
      </Button>

      {/* Avatar */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="
          w-9 h-9 rounded-full 
          bg-surface-2 text-ink-0 
          flex items-center justify-center 
          font-medium shadow-soft
        "
      >
        {user?.name?.[0] || "U"}
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          className="
            absolute right-0 top-12 
            bg-surface-0 border border-surface-3 
            shadow-soft rounded-md w-40 py-2 z-50
          "
        >
          <button
            onClick={logout}
            className="
              w-full text-left px-4 py-2 text-sm 
              text-red-600 hover:bg-surface-2
            "
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
