import Link from 'next/link';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <span className="text-xl font-semibold text-slate-900">UngenAI</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors">Home</Link>
              <Link href="/features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
              <Link href="/about" className="text-slate-600 hover:text-slate-900 transition-colors">About</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login">
                <button className="text-slate-600 hover:text-slate-900 transition-colors px-4 py-2">
                  Sign In
                </button>
              </Link>
              <Link href="/editor">
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all">
                  Try Free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Status Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">All Systems Operational</h1>
          <p className="text-xl text-slate-600">UngenAI is running smoothly with 99.9% uptime</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Service Status</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="font-medium text-slate-900">API Services</span>
              </div>
              <span className="text-emerald-700 font-medium">Operational</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="font-medium text-slate-900">Web Application</span>
              </div>
              <span className="text-emerald-700 font-medium">Operational</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="font-medium text-slate-900">Authentication</span>
              </div>
              <span className="text-emerald-700 font-medium">Operational</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="font-medium text-slate-900">Database</span>
              </div>
              <span className="text-emerald-700 font-medium">Operational</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-600">
            For real-time updates, follow us on{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-700">Twitter</a>
            {' '}or subscribe to our{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-700">status page</a>.
          </p>
        </div>
      </div>
    </div>
  );
}