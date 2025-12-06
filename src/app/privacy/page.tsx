import Link from 'next/link';

export default function PrivacyPage() {
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-8">
            Last updated: December 6, 2024
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Information We Collect</h2>
          <p className="text-slate-600 mb-4">
            We collect information you provide directly to us, such as when you create an account,
            use our services, or contact us for support.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">How We Use Your Information</h2>
          <p className="text-slate-600 mb-4">
            We use the information we collect to provide, maintain, and improve our services,
            process transactions, and communicate with you.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Data Security</h2>
          <p className="text-slate-600 mb-4">
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Contact Us</h2>
          <p className="text-slate-600 mb-4">
            If you have any questions about this Privacy Policy, please contact us at
            privacy@ungenai.com.
          </p>
        </div>
      </div>
    </div>
  );
}