"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const path = usePathname();
  const active = path === href;

  return (
    <Link
      href={href}
      className={`
        px-2 py-1 rounded-md transition-all duration-200 
        ${active
          ? "text-ink-0 bg-surface-2"
          : "text-ink-1 hover:text-ink-0 hover:bg-surface-2"
        }
      `}
    >
      {label}
    </Link>
  );
}
