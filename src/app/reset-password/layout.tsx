"use client";

export const dynamic = "force-dynamic";
export const revalidate = false;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
