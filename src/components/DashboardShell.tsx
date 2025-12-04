"use client"

import Topbar from "./Topbar"
import Sidebar from "./Sidebar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 p-14">
          {children}
        </div>
      </div>
    </div>
  )
}
