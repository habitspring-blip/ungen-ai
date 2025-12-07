"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalActivities: number;
  totalWords: number;
  rewriteCount: number;
  aiDetectionCount: number;
  grammarCount: number;
  recentActivities: Array<{
    id: string;
    title: string;
    type: string;
    date: string;
    words: number;
  }>;
  planInfo: {
    name: string;
    creditsUsed: number;
    creditsLimit: number;
    expires: string;
  };
}

interface HistoryItem {
  id?: string;
  title?: string;
  inputText?: string;
  type?: string;
  createdAt?: string;
  words?: number;
  wordCount?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchDashboardData();
    }
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from multiple endpoints with error handling
      const [statsResponse, historyResponse] = await Promise.all([
        fetch('/api/dashboard/stats').catch(() => ({ json: async () => ({}) })),
        fetch('/api/history').catch(() => ({ json: async () => ({}) }))
      ]);

      const [statsData, historyData] = await Promise.all([
        statsResponse.json(),
        historyResponse.json()
      ]);

      // Default payments data
      const paymentsData = { plan: 'Free', expires: 'Never' };

      // Process data with comprehensive fallbacks
      const dashboardData: DashboardStats = {
        totalActivities: statsData?.totalActivities || 0,
        totalWords: statsData?.totalWords || 0,
        rewriteCount: statsData?.rewriteCount || 0,
        aiDetectionCount: statsData?.aiDetectionCount || 0,
        grammarCount: statsData?.grammarCount || 0,
        recentActivities: [],
        planInfo: {
          name: paymentsData?.plan || 'Free',
          creditsUsed: Math.max(0, (user?.creditsLimit || 500) - (user?.credits || 500)),
          creditsLimit: user?.creditsLimit || 500,
          expires: paymentsData?.expires || 'Never'
        }
      };

      // Process history data safely
      try {
        if (historyData?.success && historyData?.history?.length > 0) {
          dashboardData.recentActivities = historyData.history.slice(0, 5).map((item: HistoryItem) => ({
            id: item.id || 'activity-' + Math.random().toString(36).substr(2, 9),
            title: item.title || item.inputText?.substring(0, 30) || 'Untitled Activity',
            type: item.type || 'unknown',
            date: item.createdAt || new Date().toISOString(),
            words: item.words || item.wordCount || 0
          }));
        }
      } catch (error) {
        console.error('Error processing history data:', error);
      }

      setStats(dashboardData);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'rewrite': 'Content Rewrite',
      'ai-detection': 'AI Detection',
      'grammar': 'Grammar Check',
      'unknown': 'Activity'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'rewrite': 'bg-indigo-100 text-indigo-700',
      'ai-detection': 'bg-purple-100 text-purple-700',
      'grammar': 'bg-emerald-100 text-emerald-700',
      'unknown': 'bg-slate-100 text-slate-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 px-4">
        <PremiumCard title="Error" gradient="from-red-50 to-red-100">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <PremiumButton
              onClick={fetchDashboardData}
              size="sm"
              className="mt-4"
            >
              Retry
            </PremiumButton>
          </div>
        </PremiumCard>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-md mx-auto mt-12 px-4">
        <PremiumCard title="No Data Yet" gradient="from-slate-50 to-slate-100">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600">Your dashboard will appear here once you start using the platform.</p>
            <PremiumButton
              onClick={() => router.push('/editor')}
              size="md"
              className="mt-4"
            >
              Start Writing
            </PremiumButton>
          </div>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Welcome back, {user?.name || 'User'}! Here's your activity overview
            </p>
          </div>

          <div className="flex items-center gap-2">
            <PremiumButton
              onClick={fetchDashboardData}
              variant="secondary"
              size="sm"
            >
              🔄 Refresh
            </PremiumButton>
            <PremiumButton
              onClick={() => router.push('/settings')}
              size="sm"
            >
              Settings
            </PremiumButton>
          </div>
        </div>
      </div>

      {/* Quick Feature Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PremiumCard
            title="Content Rewrite"
            subtitle="Transform your writing"
            gradient="from-indigo-50 to-purple-50"
            actions={
              <PremiumButton
                onClick={() => router.push('/editor')}
                size="sm"
              >
                Start Rewrite
              </PremiumButton>
            }
          >
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">Enhance your writing with AI</p>
            </div>
          </PremiumCard>

          <PremiumCard
            title="AI Detection"
            subtitle="Analyze content"
            gradient="from-purple-50 to-indigo-50"
            actions={
              <PremiumButton
                onClick={() => router.push('/ai-detection')}
                size="sm"
              >
                Detect AI
              </PremiumButton>
            }
          >
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">Analyze content for AI patterns</p>
            </div>
          </PremiumCard>

          <PremiumCard
            title="Grammar Check"
            subtitle="Improve writing"
            gradient="from-emerald-50 to-teal-50"
            actions={
              <PremiumButton
                onClick={() => router.push('/editor')}
                size="sm"
              >
                Check Grammar
              </PremiumButton>
            }
          >
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">Comprehensive grammar analysis</p>
            </div>
          </PremiumCard>
        </div>
      </div>

      {/* Utilization Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Platform Utilization</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <PremiumCard title="Rewrites" gradient="from-indigo-50 to-purple-50">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">
                {stats.rewriteCount.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">Content transformations</div>
            </div>
          </PremiumCard>

          <PremiumCard title="AI Detection" gradient="from-purple-50 to-indigo-50">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">
                {stats.aiDetectionCount.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">Content analyses</div>
            </div>
          </PremiumCard>

          <PremiumCard title="Grammar Checks" gradient="from-emerald-50 to-teal-50">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">
                {stats.grammarCount.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">Writing improvements</div>
            </div>
          </PremiumCard>

          <PremiumCard title="Total Words" gradient="from-amber-50 to-orange-50">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">
                {stats.totalWords.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">Processed content</div>
            </div>
          </PremiumCard>
        </div>
      </div>

      {/* Plan Information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Plan</h2>

        <PremiumCard title="Plan Information" gradient="from-amber-50 to-orange-50">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-900">{stats.planInfo.name} Plan</span>
              <span className={`text-sm font-medium ${
                stats.planInfo.name === 'Free' ? 'text-slate-500' :
                stats.planInfo.name === 'Pro' ? 'text-indigo-600' : 'text-purple-600'
              }`}>
                {stats.planInfo.name === 'Free' ? 'Free' :
                 stats.planInfo.name === 'Pro' ? 'Pro' : 'Enterprise'}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all"
                style={{
                  width: `${Math.min((stats.planInfo.creditsUsed / stats.planInfo.creditsLimit) * 100, 100)}%`
                }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span>{stats.planInfo.creditsUsed.toLocaleString()} used</span>
              <span>{stats.planInfo.creditsLimit.toLocaleString()} limit</span>
            </div>

            {stats.planInfo.name === 'Free' && (
              <PremiumButton
                onClick={() => router.push('/pricing')}
                size="sm"
                className="w-full mt-3"
              >
                Upgrade Plan
              </PremiumButton>
            )}
          </div>
        </PremiumCard>
      </div>

      {/* Recent Activities */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Recent Activities</h2>
          <Link href="/history" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View All →
          </Link>
        </div>

        {stats.recentActivities.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                onClick={() => router.push('/history')}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(activity.type)}`}>
                        {getTypeLabel(activity.type)}
                      </span>
                      <span className="font-medium text-slate-900 truncate">
                        {activity.title}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {activity.words.toLocaleString()} words • {new Date(activity.date).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PremiumCard title="No Recent Activities" gradient="from-slate-50 to-slate-100">
            <div className="text-center py-6 text-slate-400">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm">No recent activities yet</p>
              <p className="text-xs mt-1">Your activities will appear here</p>
            </div>
          </PremiumCard>
        )}
      </div>
    </div>
  );
}