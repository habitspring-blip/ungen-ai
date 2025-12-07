import Link from 'next/link';

export default function HelpPage() {
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

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Help Center
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Find answers to common questions and get the support you need to make the most of UngenAI.
          </p>
        </div>
      </section>

      {/* Help Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Getting Started</h3>
              <p className="text-slate-600 mb-4">
                Learn the basics of using UngenAI, from account setup to your first rewrite.
              </p>
              <Link href="#getting-started" className="text-indigo-600 hover:text-indigo-700 font-medium">
                View guides →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Troubleshooting</h3>
              <p className="text-slate-600 mb-4">
                Common issues and solutions for using UngenAI effectively.
              </p>
              <Link href="#troubleshooting" className="text-emerald-600 hover:text-emerald-700 font-medium">
                View solutions →
              </Link>
            </div>
          </div>

          <div className="space-y-8">
            <div id="getting-started" className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Getting Started</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">How do I create an account?</h4>
                  <p className="text-slate-600">
                    Click the "Sign Up" button in the top right corner and follow the registration process.
                    You'll need to provide an email address and create a password.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">How do I start writing?</h4>
                  <p className="text-slate-600">
                    After logging in, click "Try Free" or go to the Editor. Paste your text in the input area
                    and select your desired enhancement options.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">What are the different modes?</h4>
                  <p className="text-slate-600">
                    UngenAI offers various modes: Humanize (make AI text sound human), Professional (formal tone),
                    Simplify (easier language), and more. Each mode is optimized for different writing needs.
                  </p>
                </div>
              </div>
            </div>

            <div id="troubleshooting" className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Troubleshooting</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Text not processing?</h4>
                  <p className="text-slate-600">
                    Check your internet connection and try again. If the issue persists, try refreshing the page
                    or clearing your browser cache.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Sign In issues?</h4>
                  <p className="text-slate-600">
                    Make sure you're using the correct email and password. If you've forgotten your password,
                    use the "Forgot password" link on the login page.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Need more help?</h4>
                  <p className="text-slate-600">
                    Contact our support team at support@ungenai.com or visit our contact page for additional support options.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}