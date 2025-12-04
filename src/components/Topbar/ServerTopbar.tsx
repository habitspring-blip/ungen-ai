"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ClientTopbar from "./ClientTopbar";

/*
  ServerTopbar
  Appears on all pages (except login/signup).
  Elegant, minimal, neutral surfaces with gradient active state.
*/

export default function ServerTopbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/editor", label: "Editor" },
    { href: "/history", label: "History" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <header
      className="
        w-full bg-surface-0/80 backdrop-blur-md
        border-b border-surface-2
        shadow-soft sticky top-0 z-50
      "
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold text-ink-0 tracking-tight"
        >
          UngenAI
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-2 py-1 rounded-md transition-all duration-200
                  ${
                    active
                      ? "bg-gradient-to-r from-brand-indigo-start to-brand-pink-end text-transparent bg-clip-text"
                      : "text-ink-1 hover:text-ink-0 hover:bg-surface-2"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions (Upgrade + Avatar + Dropdown) */}
        <ClientTopbar />
      </div>
    </header>
  );
}
