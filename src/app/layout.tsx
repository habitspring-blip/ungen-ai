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
            <div className="flex">
              {/* Enhanced Sidebar - shown on larger screens */}
              <div className="hidden lg:block">
                <EnhancedSidebar />
              </div>

              {/* Page Content */}
              <main className="flex-1 lg:ml-48">
                {children}
              </main>
            </div>
          </div>
        </UserProvider>

        {/* Global CortexAI Assistant - Always Visible */}
        <GlobalCortexAIAssistant />
      </body>
    </html>
  );
}
