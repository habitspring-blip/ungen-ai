import Link from 'next/link';

export default function FeaturesPage() {
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
              <Link href="#features" className="text-slate-900 font-medium">Features</Link>
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
            Powerful Features for
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Professional Writing
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Discover how UngenAI's advanced AI capabilities can transform your writing workflow
            with intelligent analysis, real-time enhancement, and enterprise-grade security.
          </p>
          <Link href="/editor">
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Start Writing Now
            </button>
          </Link>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Core Capabilities</h2>
            <p className="text-xl text-slate-600">Advanced AI features designed for professional content creation</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            {/* AI-Powered Enhancement */}
            <div>
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">AI-Powered Enhancement</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Our advanced algorithms analyze your writing at multiple levels - from sentence structure
                and vocabulary choice to overall flow and readability. The AI understands context,
                maintains your unique voice, and provides intelligent suggestions for improvement.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">Contextual understanding of writing style and tone</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">Real-time analysis and suggestions</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">Preserves author voice and intent</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-4">Before & After Example</h4>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-500 mb-2">Original:</div>
                    <p className="text-slate-700 italic">"The company did a really good job on the project and we were very satisfied with the results."</p>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-2">Enhanced:</div>
                    <p className="text-slate-700 italic">"The company delivered exceptional results on the project, exceeding our expectations and ensuring complete satisfaction."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grammar & Style Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl order-2 lg:order-1">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-4">Comprehensive Analysis</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">95%</div>
                    <div className="text-sm text-slate-600">Grammar Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">78</div>
                    <div className="text-sm text-slate-600">Readability Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">12%</div>
                    <div className="text-sm text-slate-600">Passive Voice</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">3.2</div>
                    <div className="text-sm text-slate-600">Avg Sentence Length</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Grammar & Style Analysis</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Get detailed insights into your writing with comprehensive grammar checking,
                style analysis, and readability scoring. Our AI identifies passive voice,
                complex sentences, and provides actionable suggestions for improvement.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">Advanced grammar and punctuation checking</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">Readability and complexity analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700">Style consistency and tone analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Perfect for Every Use Case</h2>
            <p className="text-xl text-slate-600">From individual writers to enterprise teams</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Content Writers */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Content Writers</h3>
              <p className="text-slate-600 mb-4">
                Enhance blog posts, articles, and web content with professional-grade improvements
                and SEO optimization suggestions.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• SEO-friendly content enhancement</li>
                <li>• Engagement optimization</li>
                <li>• Brand voice consistency</li>
              </ul>
            </div>

            {/* Marketing Teams */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Marketing Teams</h3>
              <p className="text-slate-600 mb-4">
                Create compelling copy for campaigns, social media, and marketing materials
                with A/B testing insights and conversion optimization.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Conversion-focused copywriting</li>
                <li>• A/B testing suggestions</li>
                <li>• Multi-channel content adaptation</li>
              </ul>
            </div>

            {/* Enterprise Communications */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Enterprise Teams</h3>
              <p className="text-slate-600 mb-4">
                Maintain brand consistency across reports, presentations, and communications
                with collaborative editing and approval workflows.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Brand compliance checking</li>
                <li>• Collaborative editing</li>
                <li>• Approval workflow integration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Experience the Power of AI Writing?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their writing workflow with UngenAI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/editor">
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300">
                Start Writing Free
              </button>
            </Link>
            <Link href="/pricing">
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300">
                View All Features
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}