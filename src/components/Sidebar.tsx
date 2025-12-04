"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

export default function Sidebar() {
  const path = usePathname();
  const { logout } = useUser();
  const [collapsed, setCollapsed] = useState(false);

async function handleLogout() {
  try {
    await logout()
  } catch (err) {
    console.error("Logout failed", err)
  }
}


  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Editor", href: "/editor" },
    { name: "Pricing", href: "/pricing" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <aside
      className={`
        h-screen border-r border-surface-3 bg-surface-0/70 backdrop-blur-xl
        shadow-soft flex flex-col transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between px-6 py-6">
        <h2
          className={`
            text-xl font-semibold tracking-tight transition-opacity duration-200
            text-ink-0
            ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}
          `}
        >
          UngenAI
        </h2>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-ink-2 hover:text-ink-0 transition"
        >
          {collapsed ? <span className="text-lg">›</span> : <span className="text-lg">‹</span>}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 px-4">
        {navItems.map((item) => {
          const active = path === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-200
                ${
                  active
                    ? "bg-gradient-to-r from-brand-indigo-start to-brand-pink-end text-white shadow-depth"
                    : "text-ink-1 hover:bg-surface-2"
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              {/* Dot Indicator for collapsed mode */}
              {collapsed ? (
                <div
                  className={`
                    w-2 h-2 rounded-full 
                    ${active ? "bg-white" : "bg-ink-2"}
                  `}
                />
              ) : null}

              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto pt-6 px-4 border-t border-surface-3">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-4 py-2 text-sm font-medium 
            text-red-600 rounded-md hover:bg-surface-2 transition
            ${collapsed ? "justify-center" : ""}
          `}
        >
          {collapsed ? <span className="text-lg">⎋</span> : "Logout"}
        </button>
      </div>
    </aside>
  );
}
