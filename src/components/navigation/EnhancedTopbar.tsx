"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import PremiumButton from '@/components/ui/PremiumButton';
import ToolsDropdown from '@/components/ui/ToolsDropdown';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';

export default function EnhancedTopbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Main navigation items
  const mainNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/editor', label: 'Editor' },
    { href: '/ai-detection', label: 'AI Detection' },
    { href: '/history', label: 'History' },
  ];

  // Feature navigation items
  const featureNavItems = [
    { href: '/pricing', label: 'Pricing' },
    { href: '/settings', label: 'Settings' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600 transition"
            aria-label="Open mobile menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo and Main Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <span className="text-xl font-semibold text-slate-900 hidden sm:inline">UngenAI</span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                    pathname === item.href
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side - Search and User Menu */}
          <div className="flex items-center gap-4">
            {/* Search */}
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features, history..."
                  className="w-64 px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute -right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="text-lg">×</span>
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-slate-400 hover:text-slate-600 transition"
                aria-label="Open search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {/* Feature Navigation Dropdown */}
            <div className="hidden lg:flex items-center gap-1">
              {featureNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                    pathname === item.href
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
    
              {/* Tools Dropdown */}
              <ToolsDropdown />
            </div>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="p-2 text-slate-400 hover:text-slate-600 transition relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* User Profile */}
                <Link href="/settings" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-slate-900">
                    {user.name || 'Account'}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <PremiumButton variant="secondary" size="sm">
                    Log In
                  </PremiumButton>
                </Link>
                <Link href="/signup">
                  <PremiumButton size="sm">
                    Sign Up
                  </PremiumButton>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation (for smaller screens) */}
        <div className="md:hidden border-t border-slate-100 py-2">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 px-3 py-1 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                  pathname === item.href
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <span className="text-lg font-semibold text-slate-900">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="p-4">
              <div className="space-y-2">
                {/* Main Navigation */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Main</h3>
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                        pathname === item.href
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Feature Navigation */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Features</h3>
                  {featureNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                        pathname === item.href
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Tools Dropdown */}
                <div className="mb-6">
                  <ToolsDropdown />
                </div>

                {/* User Section */}
                {user && (
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium text-sm">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {user.name || 'Account'}
                        </div>
                        <Link
                          href="/settings"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          View Settings
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}