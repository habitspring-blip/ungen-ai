"use client"

import EnhancedTopbar from "./navigation/EnhancedTopbar"
import EnhancedSidebar from "./navigation/EnhancedSidebar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <EnhancedTopbar />
      <div className="flex flex-1">
        <EnhancedSidebar />
        <div className="flex-1 p-14">
          {children}
        </div>
      </div>
    </div>
  )
}
