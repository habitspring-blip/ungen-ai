// src/app/layout.tsx

import "./globals.css";
import { Inter } from "next/font/google";
import { UserProvider } from "../context/UserContext";
import Topbar from "@/components/Topbar";
import "../styles/design-tokens.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "UngenAI",
  description: "Human-grade rewriting engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable}
          antialiased
          bg-surface-1 
          text-ink-0
          transition-all duration-300 ease-premium
        `}
      >
        <UserProvider>
          <div className="relative min-h-screen">

            {/* Ambient Hybrid Lighting: Subtle, Neutral + Brand */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
              {/* Soft bright neutral glow */}
              <div className="absolute top-[-25%] left-[-15%] w-[520px] h-[520px] 
                bg-surface-0/60 blur-[140px] rounded-full"></div>

              {/* Subtle brand accent glow */}
              <div className="absolute bottom-[-20%] right-[-10%] w-[520px] h-[520px] 
                bg-gradient-to-br from-brand-indigo-start/15 to-brand-pink-end/10 
                blur-[160px] rounded-full"></div>
            </div>

            {/* Foreground shell */}
            <div className="relative z-10">

              {/* Global Navigation */}
              <Topbar />

              {/* Page content container */}
              <main className="pt-4 pb-10">
                {children}
              </main>
            </div>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
