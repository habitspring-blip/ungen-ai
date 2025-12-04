"use client";

import { useState, useEffect } from "react";

// -----------------------------
// TYPES
// -----------------------------
interface Stats {
  wordsUsed: number;
  totalRewrites: number;
  remainingCredits: number;
}

interface WeeklyUsage {
  day: string;
  words: number;
}

interface ModelUsage {
  name: string;
  percentage: number;
}

interface ActivityItem {
  title: string;
  model: string;
  time: string;
  words: number;
}

// -----------------------------
// COMPONENT
// -----------------------------
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyUsage[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Don't show loading spinner on background refreshes
      if (stats === null) {
        setLoading(true);
      }
      setError(null);

      const [statsRes, weeklyRes, modelsRes, activityRes] = await Promise.all([
        fetch("/api/dashboard/stats", { cache: 'no-store' }),
        fetch("/api/dashboard/weekly", { cache: 'no-store' }),
        fetch("/api/dashboard/models", { cache: 'no-store' }),
        fetch("/api/dashboard/activity", { cache: 'no-store' }),
      ]);

      if (!statsRes.ok || !weeklyRes.ok || !modelsRes.ok || !activityRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [statsData, weeklyDataRes, modelsData, activityData] =
        await Promise.all([
          statsRes.json(),
          weeklyRes.json(),
          modelsRes.json(),
          activityRes.json(),
        ]);

      setStats(statsData || null);
      setWeeklyData(Array.isArray(weeklyDataRes) ? weeklyDataRes : []);
      setModelUsage(Array.isArray(modelsData) ? modelsData : []);
      setRecentActivity(Array.isArray(activityData) ? activityData : []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const maxWords =
    weeklyData.length > 0
      ? Math.max(...weeklyData.map((d) => d.words))
      : 0;

  // -----------------------------
  // LOADING UI
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-slate-600 mt-4">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // ERROR UI
  // -----------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-8 py-12">
          <div className="bg-white rounded-2xl border-2 border-red-500/20 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // MAIN UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Your activity at a glance • Auto-refreshes every 30s
              </p>
            </div>

            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 text-sm text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

            {/* Words Used */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-indigo-600 to-pink-500" />
              <div className="relative z-10">
                <div className="text-sm text-slate-600">Words Used</div>
                <div className="text-3xl font-semibold mt-1 bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                  {stats.wordsUsed.toLocaleString()}
                </div>
                <div className="text-slate-500 text-xs mt-1">This month</div>
              </div>
            </div>

            {/* Rewrites */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-emerald-600 to-teal-500" />
              <div className="relative z-10">
                <div className="text-sm text-slate-600">Rewrites</div>
                <div className="text-3xl font-semibold mt-1 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  {stats.totalRewrites.toLocaleString()}
                </div>
                <div className="text-slate-500 text-xs mt-1">Total generated</div>
              </div>
            </div>

            {/* Credits */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-amber-500 to-orange-500" />
              <div className="relative z-10">
                <div className="text-sm text-slate-600">Remaining Credits</div>
                <div className="text-3xl font-semibold mt-1 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  {stats.remainingCredits.toLocaleString()}
                </div>
                <div className="text-slate-500 text-xs mt-1">Across all models</div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Weekly usage */}
          <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-sm">
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Weekly Usage
                </h2>
                <p className="text-sm text-slate-600">
                  Words processed over last 7 days
                </p>
              </div>
            </div>

            {weeklyData.length > 0 ? (
              <div className="flex items-end gap-3 h-48">
                {weeklyData.map((d) => {
                  const height = maxWords ? (d.words / maxWords) * 100 : 0;

                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600/30 to-pink-500/30 rounded-t-md transition-all duration-200 group-hover:shadow-lg"
                          style={{ height: `${height * 1.92}px` }}
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {d.words.toLocaleString()} words
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 mt-2">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500">
                No usage data available yet.
              </div>
            )}
          </div>

          {/* Model usage */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Model Usage
            </h2>

            {modelUsage.length > 0 ? (
              modelUsage.map((m) => (
                <div key={m.name} className="mb-5">
                  <div className="flex justify-between text-sm text-slate-900 mb-1">
                    <span>{m.name}</span>
                    <span>{m.percentage}%</span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-pink-500 rounded-md transition-all duration-300"
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8 text-sm">
                No usage data yet
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-sm">
          <div className="flex justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Activity
            </h2>
            <button className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 transition">
              View All
            </button>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="p-4 border border-slate-200 rounded-md hover:bg-slate-50 transition"
                >
                  <div className="flex justify-between">
                    <div className="font-medium text-slate-900">
                      {item.title}
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                      {item.model}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {item.time} • {item.words} words
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8 text-sm">
              No recent activity yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}