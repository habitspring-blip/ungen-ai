"use client";

import ProtectedClient from "../../components/ProtectedClient";
import Sidebar from "../../components/Sidebar";
import Card from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <ProtectedClient>
      <div className="min-h-screen flex bg-surface-1">
        <Sidebar />

        <main className="flex-1 py-12">
          <div className="max-w-3xl mx-auto px-6">
            
            {/* Header */}
            <header className="mb-12">
              <h1
                className="
                  text-3xl font-semibold tracking-tight 
                  bg-gradient-to-r from-brand-indigo-start to-brand-pink-end 
                  bg-clip-text text-transparent
                "
              >
                Settings
              </h1>
              <p className="text-ink-2 text-sm mt-1">
                Manage your profile and account details
              </p>
            </header>

            {/* Form Card */}
            <Card className="p-8">
              <div className="space-y-8">
                
                {/* Display Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink-1">
                    Display Name
                  </label>
                  <input
                    className="
                      w-full px-3 py-2.5 rounded-md text-sm
                      bg-surface-0 border border-surface-3 
                      text-ink-0 placeholder-ink-2
                      focus:outline-none focus:ring-2 focus:ring-accent/20
                    "
                    placeholder="Your name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink-1">
                    Email
                  </label>
                  <input
                    className="
                      w-full px-3 py-2.5 rounded-md text-sm
                      bg-surface-0 border border-surface-3
                      text-ink-0 placeholder-ink-2
                      focus:outline-none focus:ring-2 focus:ring-accent/20
                    "
                    placeholder="Email"
                  />
                </div>

              </div>
            </Card>

          </div>
        </main>
      </div>
    </ProtectedClient>
  );
}
