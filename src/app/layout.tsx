import "./globals.css";
import { Inter } from "next/font/google";
import { UserProvider } from "../context/UserContext";
import EnhancedTopbar from "@/components/navigation/EnhancedTopbar";
import EnhancedSidebar from "@/components/navigation/EnhancedSidebar";
import GlobalCortexAIAssistant from "@/components/ui/GlobalCortexAIAssistant";
import "../styles/design-tokens.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "UngenAI - Enterprise AI Writing Platform",
  description: "Advanced AI writing, detection, and analysis platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`
          ${inter.variable}
          antialiased
          bg-slate-50
          text-slate-900
          transition-all duration-300 ease-premium
        `}
      >
        <UserProvider>
          <div className="relative min-h-screen">
            {/* Enhanced Navigation System */}
            <EnhancedTopbar />

            {/* Main Content Area */}
            <div className="flex min-h-[calc(100vh-4rem)]">
              {/* Enhanced Sidebar - shown on larger screens */}
              <div className="hidden lg:flex lg:flex-col">
                <EnhancedSidebar />
              </div>

              {/* Page Content */}
              <main className="flex-1">
                {children}
              </main>
            </div>

            {/* Footer */}
            <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2 mb-1 md:mb-0">
                    <div className="w-5 h-5 bg-gradient-brand rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-white">U</span>
                    </div>
                    <span className="font-medium">UngenAI</span>
                    <span className="text-xs">© 2024</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <a href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Privacy</a>
                    <a href="/terms" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Terms</a>
                    <a href="/support" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Support</a>
                    <a href="/status" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Status</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </UserProvider>

        {/* Global CortexAI Assistant - Always Visible */}
        <GlobalCortexAIAssistant />
      </body>
    </html>
  );
}
