"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import NavigationItem from '@/components/ui/NavigationItem';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalActivities: number;
  totalWords: number;
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
  featureHighlights: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickAction, setQuickAction] = useState<'rewrite' | 'ai-detect' | 'grammar' | null>(null);

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

      // Fetch data from multiple endpoints
      const [statsResponse, historyResponse, paymentsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/history'),
        fetch('/api/payments/create-checkout')
      ]);

      const [statsData, historyData, paymentsData] = await Promise.all([
        statsResponse.json(),
        historyResponse.json(),
        paymentsResponse.json()
      ]);

      // Combine and format data
      const dashboardData: DashboardStats = {
        totalActivities: statsData.totalActivities || 0,
        totalWords: statsData.totalWords || 0,
        recentActivities: [],
        planInfo: {
          name: paymentsData.plan || 'Free',
          creditsUsed: statsData.creditsUsed || 0,
          creditsLimit: statsData.creditsLimit || 1000,
          expires: paymentsData.expires || 'Never'
        },
        featureHighlights: [
          {
            title: 'AI Detection',
            description: 'Advanced AI content detection using multiple models',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
            link: '/ai-detection'
          },
          {
            title: 'Content Rewrite',
            description: 'Transform your writing with advanced AI models',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            link: '/editor'
          },
          {
            title: 'Grammar Check',
            description: 'Comprehensive grammar and style analysis',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            link: '/editor'
          },
          {
            title: 'Activity History',
            description: 'View all your past activities and results',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            link: '/history'
          }
        ]
      };

      // Add recent activities from history
      if (historyData.success && historyData.history) {
        dashboardData.recentActivities = historyData.history.slice(0, 5).map((item: { id: string; title?: string; type?: string; createdAt: string; words?: number }) => ({
          id: item.id,
          title: item.title || 'Untitled Activity',
          type: item.type || 'unknown',
          date: item.createdAt,
          words: item.words || 0
        }));
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

  const handleQuickAction = (action: 'rewrite' | 'ai-detect' | 'grammar') => {
    setQuickAction(action);
    // Navigate to appropriate page
    if (action === 'ai-detect') {
      router.push('/ai-detection');
    } else {
      router.push('/editor');
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-8 py-12">
          <div className="bg-white rounded-2xl border-2 border-red-500/20 p-6 shadow-sm max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <PremiumButton onClick={fetchDashboardData} size="md">
              Retry
            </PremiumButton>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-8 py-12">
          <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-sm max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Dashboard Data
            </h3>
            <p className="text-slate-600 mb-4">Your dashboard will appear here once you start using the platform.</p>
            <PremiumButton onClick={() => router.push('/editor')} size="md">
              Start Writing
            </PremiumButton>
          </div>
        </div>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <PremiumCard
          title="Total Activities"
          gradient="from-indigo-50 to-purple-50"
        >
          <div className="text-3xl font-bold text-slate-900">
            {stats.totalActivities.toLocaleString()}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {stats.totalActivities > 0 ? (
              <>Across all features</>
            ) : (
              <>Get started with your first activity</>
            )}
          </div>
        </PremiumCard>

        <PremiumCard
          title="Total Words"
          gradient="from-emerald-50 to-teal-50"
        >
          <div className="text-3xl font-bold text-slate-900">
            {stats.totalWords.toLocaleString()}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            Processed across all activities
          </div>
        </PremiumCard>

        <PremiumCard
          title="Current Plan"
          gradient="from-amber-50 to-orange-50"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-900">{stats.planInfo.name}</span>
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

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickAction('rewrite')}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                quickAction === 'rewrite'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Rewrite
            </button>
            <button
              onClick={() => handleQuickAction('ai-detect')}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                quickAction === 'ai-detect'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              AI Detect
            </button>
            <button
              onClick={() => handleQuickAction('grammar')}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                quickAction === 'grammar'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Grammar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PremiumCard
            title="Content Rewrite"
            subtitle="Transform your writing"
            gradient="from-indigo-50 to-purple-50"
            actions={
              <PremiumButton
                onClick={() => handleQuickAction('rewrite')}
                size="sm"
              >
                Start Rewrite
              </PremiumButton>
            }
          >
            <div className="text-center py-8">
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
            subtitle="Detect AI content"
            gradient="from-purple-50 to-indigo-50"
            actions={
              <PremiumButton
                onClick={() => handleQuickAction('ai-detect')}
                size="sm"
              >
                Detect AI
              </PremiumButton>
            }
          >
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">Analyze content for AI generation</p>
            </div>
          </PremiumCard>

          <PremiumCard
            title="Grammar Check"
            subtitle="Improve your writing"
            gradient="from-emerald-50 to-teal-50"
            actions={
              <PremiumButton
                onClick={() => handleQuickAction('grammar')}
                size="sm"
              >
                Check Grammar
              </PremiumButton>
            }
          >
            <div className="text-center py-8">
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

      {/* Recent Activity */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
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
            <div className="text-center py-8 text-slate-400">
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

      {/* Feature Highlights */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Feature Highlights</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.featureHighlights.map((feature, index) => (
            <div
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(feature.link)}
            >
              <PremiumCard
                title={feature.title}
                subtitle={feature.description}
                gradient="from-white to-slate-50"
              >
              <div className="text-center py-4">
                <div className="w-8 h-8 mx-auto mb-2 text-indigo-600">
                  {feature.icon}
                </div>
                <PremiumButton
                  variant="text"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(feature.link);
                  }}
                >
                  Explore →
                </PremiumButton>
              </div>
            </PremiumCard>
          </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Navigation</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NavigationItem href="/editor" icon="✍️">
            Editor
          </NavigationItem>
          <NavigationItem href="/ai-detection" icon="🔍">
            AI Detection
          </NavigationItem>
          <NavigationItem href="/history" icon="📊">
            History
          </NavigationItem>
          <NavigationItem href="/pricing" icon="💰">
            Pricing
          </NavigationItem>
          <NavigationItem href="/settings" icon="⚙️">
            Settings
          </NavigationItem>
          <NavigationItem href="/tools" icon="🧰">
            Tools
          </NavigationItem>
          <NavigationItem href="/dashboard" icon="🏠">
            Dashboard
          </NavigationItem>
        </div>
      </div>
    </div>
  );
}