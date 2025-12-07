import Link from 'next/link';

export default function FeaturesPage() {
  const tools = [
    {
      name: "Rewrite Editor",
      description: "AI-powered text rewriting and enhancement with multiple writing intents",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      gradient: "from-indigo-600 to-purple-600",
      features: ["Humanize AI text", "Summarize content", "Expand writing", "Grammar checking", "Multiple AI models"],
      example: {
        before: "The company did good work on the project.",
        after: "The company delivered exceptional results on the project, exceeding our expectations and ensuring complete satisfaction."
      }
    },
    {
      name: "SummarizeAI",
      description: "Condense long text into concise, meaningful summaries while preserving key information",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: "from-orange-600 to-red-600",
      features: ["Intelligent summarization", "Key points extraction", "Length customization", "Multi-language support"],
      example: {
        before: "Our company has been working on this project for several months. We started with planning, then moved to development, and finally testing. The team worked very hard and we encountered some challenges along the way, but we managed to overcome them.",
        after: "The company completed a multi-month project involving planning, development, and testing phases. Despite challenges, the team successfully overcame obstacles through dedicated effort."
      }
    },
    {
      name: "LongForm Plus",
      description: "Expand short text into detailed, comprehensive content with intelligent elaboration",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: "from-purple-600 to-pink-600",
      features: ["Content expansion", "Detail enhancement", "Context preservation", "Tone matching", "Length control"],
      example: {
        before: "The meeting was productive.",
        after: "The meeting proved highly productive, with all team members actively participating in constructive discussions. We covered key agenda items, reached consensus on important decisions, and established clear action items with assigned responsibilities and deadlines."
      }
    },
    {
      name: "SEO Magic",
      description: "Optimize content for search engines with intelligent keyword suggestions and SEO enhancements",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      gradient: "from-green-600 to-teal-600",
      features: ["Keyword optimization", "Meta description generation", "Readability scoring", "SEO recommendations"],
      example: {
        before: "We sell shoes online.",
        after: "Discover our premium online shoe collection featuring comfortable, stylish footwear for every occasion. Shop the latest trends in athletic shoes, dress shoes, and casual wear with free shipping and easy returns."
      }
    },
    {
      name: "Citation Generator",
      description: "Generate accurate academic citations in multiple formats automatically",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      gradient: "from-blue-600 to-cyan-600",
      features: ["APA, MLA, Chicago styles", "Multiple source types", "Auto-formatting", "Bibliography generation"],
      example: {
        before: "Smith, John. The Art of Writing. 2023.",
        after: "Smith, J. (2023). The art of writing: A comprehensive guide to modern composition. Academic Press."
      }
    },
    {
      name: "Plagiarism Shield",
      description: "Advanced plagiarism detection to ensure content originality and academic integrity",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      gradient: "from-red-600 to-pink-600",
      features: ["Comprehensive scanning", "Similarity percentage", "Source identification", "Detailed reports"],
      example: {
        before: "Content originality: 85%",
        after: "Content originality: 98% - Minor similarities detected in common phrases, no significant plagiarism found."
      }
    },
    {
      name: "AI Detection",
      description: "Analyze content to detect AI-generated text patterns and assess human-like quality",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: "from-cyan-600 to-blue-600",
      features: ["AI pattern analysis", "Human-like scoring", "Detection confidence", "Detailed reasoning"],
      example: {
        before: "AI-generated probability: Unknown",
        after: "AI-generated probability: 15% - Content appears mostly human-written with natural language patterns and personal voice."
      }
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Powerful AI Writing Tools for
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Every Need
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Discover UngenAI's comprehensive suite of 7 specialized AI writing tools designed to enhance,
            analyze, and optimize your content across every stage of the writing process.
          </p>
          <Link href="/tools">
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Explore All Tools
            </button>
          </Link>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our AI Writing Suite</h2>
            <p className="text-xl text-slate-600">Seven powerful tools, one comprehensive writing solution</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {tools.map((tool, index) => (
              <div key={tool.name} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${tool.gradient} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{tool.name}</h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">{tool.description}</p>

                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-900 mb-3">Key Features:</h4>
                      <ul className="space-y-2">
                        {tool.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-slate-900 mb-3 text-sm">Example:</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Before:</div>
                          <p className="text-slate-700 text-sm italic">"{tool.example.before}"</p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">After:</div>
                          <p className="text-slate-700 text-sm italic">"{tool.example.after}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Perfect for Every Professional</h2>
            <p className="text-xl text-slate-600">From students to enterprise teams, our tools adapt to your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Students & Academics */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Students & Academics</h3>
              <p className="text-slate-600 mb-4">
                Perfect your essays, research papers, and assignments with grammar checking,
                citation generation, and plagiarism detection.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Citation Generator for papers</li>
                <li>• Plagiarism Shield for originality</li>
                <li>• AI Detection for authenticity</li>
              </ul>
            </div>

            {/* Content Creators */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Content Creators</h3>
              <p className="text-slate-600 mb-4">
                Create engaging blog posts, articles, and social media content with
                AI-powered enhancement and SEO optimization.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Rewrite Editor for enhancement</li>
                <li>• SEO Magic for optimization</li>
                <li>• LongForm Plus for expansion</li>
              </ul>
            </div>

            {/* Business Professionals */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Business Professionals</h3>
              <p className="text-slate-600 mb-4">
                Craft professional emails, reports, and presentations with intelligent
                enhancement and comprehensive analysis tools.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• SummarizeAI for reports</li>
                <li>• Rewrite Editor for clarity</li>
                <li>• Plagiarism Shield for compliance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Writing?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have enhanced their writing workflow with UngenAI's comprehensive tool suite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/editor">
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300">
                Start with Rewrite Editor
              </button>
            </Link>
            <Link href="/tools">
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300">
                Explore All Tools
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}