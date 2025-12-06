import Link from 'next/link';

export default function ApiPage() {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Developer API
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              Build with UngenAI
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Integrate our advanced AI writing capabilities into your applications.
              RESTful API with comprehensive documentation and enterprise-grade reliability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#docs">
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  View Documentation
                </button>
              </Link>
              <Link href="/contact">
                <button className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-slate-400 hover:bg-slate-50 transition-all duration-300">
                  Get API Key
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* API Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Powerful API Features</h2>
            <p className="text-xl text-slate-600">Everything you need to integrate AI writing into your applications</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* RESTful API */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">RESTful API</h3>
              <p className="text-slate-600 mb-4">
                Clean, intuitive REST API following industry best practices with JSON responses and standard HTTP status codes.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• JSON request/response format</li>
                <li>• Standard HTTP methods</li>
                <li>• Comprehensive error handling</li>
                <li>• Rate limiting with clear headers</li>
              </ul>
            </div>

            {/* Real-time Streaming */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Real-time Streaming</h3>
              <p className="text-slate-600 mb-4">
                Experience instant AI responses with our streaming API that delivers text as it's generated for optimal user experience.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Server-sent events (SSE)</li>
                <li>• Character-by-character streaming</li>
                <li>• Low latency responses</li>
                <li>• Progress indicators</li>
              </ul>
            </div>

            {/* Enterprise Security */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Enterprise Security</h3>
              <p className="text-slate-600 mb-4">
                Bank-level security with end-to-end encryption, SOC 2 compliance, and enterprise-grade infrastructure.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• End-to-end encryption</li>
                <li>• SOC 2 Type II compliant</li>
                <li>• GDPR & CCPA compliant</li>
                <li>• Enterprise SSO support</li>
              </ul>
            </div>

            {/* Comprehensive SDKs */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">SDK Libraries</h3>
              <p className="text-slate-600 mb-4">
                Official SDKs for popular programming languages with comprehensive documentation and code examples.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Python SDK</li>
                <li>• JavaScript/TypeScript SDK</li>
                <li>• Go SDK</li>
                <li>• Community SDKs</li>
              </ul>
            </div>

            {/* Webhooks */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-8 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Webhook Integration</h3>
              <p className="text-slate-600 mb-4">
                Real-time notifications for job completion, errors, and usage events with configurable retry logic.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Job completion notifications</li>
                <li>• Error alerts</li>
                <li>• Usage event webhooks</li>
                <li>• Configurable retry logic</li>
              </ul>
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-8 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Analytics Dashboard</h3>
              <p className="text-slate-600 mb-4">
                Comprehensive API usage analytics with detailed metrics, performance insights, and cost tracking.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Real-time usage metrics</li>
                <li>• Performance analytics</li>
                <li>• Cost tracking dashboard</li>
                <li>• Custom reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* API Documentation */}
      <section id="docs" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">API Documentation</h2>
            <p className="text-xl text-slate-600">Complete API reference with examples and guides</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Quick Start */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Quick Start</h3>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3">1. Get Your API Key</h4>
                  <p className="text-slate-600 mb-4">
                    Sign up for an account and generate your API key from the dashboard.
                  </p>
                  <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm">
                    <span className="text-slate-500"># Your API key</span><br />
                    ungen_xxxxxxxxxxxxxxxxxxxxxxxx
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3">2. Make Your First Request</h4>
                  <p className="text-slate-600 mb-4">
                    Use the rewrite endpoint to enhance your writing.
                  </p>
                  <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="text-slate-500 mb-2"># Example API call</div>
                    <pre className="whitespace-pre-wrap">
{`curl -X POST https://api.ungenai.com/v1/rewrite \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '\{"text": "Your text here", "intent": "humanize"\}'`}
                    </pre>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3">3. Handle the Response</h4>
                  <p className="text-slate-600 mb-4">
                    Receive enhanced text with metadata and processing information.
                  </p>
                  <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="text-slate-500 mb-2"># Example response</div>
                    {`\{
                      "success": true,
                      "data": \{
                        "enhanced_text": "Enhanced version of your text...",
                        "processing_time": 1.2,
                        "word_count": 45,
                        "model_used": "advanced-v2"
                      \}
                    \}`}
                  </div>
                </div>
              </div>
            </div>

            {/* API Reference */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">API Reference</h3>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">R</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">POST /v1/rewrite</h4>
                      <p className="text-sm text-slate-600">Enhance and rewrite text content</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Endpoint:</span>
                      <code className="bg-slate-100 px-2 py-1 rounded">https://api.ungenai.com/v1/rewrite</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Method:</span>
                      <span className="font-medium">POST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Rate Limit:</span>
                      <span className="font-medium">100 requests/minute</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">POST /v1/analyze</h4>
                      <p className="text-sm text-slate-600">Analyze text for AI detection and quality metrics</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Endpoint:</span>
                      <code className="bg-slate-100 px-2 py-1 rounded">https://api.ungenai.com/v1/analyze</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Method:</span>
                      <span className="font-medium">POST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Rate Limit:</span>
                      <span className="font-medium">200 requests/minute</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">H</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">GET /v1/history</h4>
                      <p className="text-sm text-slate-600">Retrieve processing history and results</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Endpoint:</span>
                      <code className="bg-slate-100 px-2 py-1 rounded">https://api.ungenai.com/v1/history</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Method:</span>
                      <span className="font-medium">GET</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Rate Limit:</span>
                      <span className="font-medium">500 requests/minute</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Integrate UngenAI?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Get started with our comprehensive API documentation and start building
            AI-powered writing features into your applications today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300">
                Get API Access
              </button>
            </Link>
            <Link href="#docs">
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300">
                View Full Docs
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}