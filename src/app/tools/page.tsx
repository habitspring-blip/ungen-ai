"use client"

import Container from "@/components/ui/Container"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Container className="pt-6 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            AI Writing Tools
          </h1>
          <p className="text-gray-600 text-base max-w-lg mx-auto mt-2">
            Powerful tools to enhance your writing workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Rewrite Editor */}
           <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-indigo-200">
             <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
               <span className="text-white font-bold text-lg">✏️</span>
             </div>
             <h3 className="text-xl font-semibold mb-2">Rewrite Editor</h3>
             <p className="text-gray-600 mb-4">Make any text sound naturally human-written with advanced AI rewriting.</p>
             <Button variant="primary" className="w-full" onClick={() => window.location.href = '/editor'}>
               Open Editor
             </Button>
           </Card>

           {/* SummarizeAI */}
           <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
             <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
               <span className="text-white font-bold text-lg">📋</span>
             </div>
             <h3 className="text-xl font-semibold mb-2">SummarizeAI</h3>
             <p className="text-gray-600 mb-4">Generate instant, accurate summaries of your content with AI analysis.</p>
             <Button variant="primary" className="w-full" onClick={() => window.location.href = '/summarize'}>
               Create Summary
             </Button>
           </Card>

           {/* LongForm Plus */}
           <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-green-200">
             <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
               <span className="text-white font-bold text-lg">📄</span>
             </div>
             <h3 className="text-xl font-semibold mb-2">LongForm Plus</h3>
             <p className="text-gray-600 mb-4">Expand content into comprehensive essays, reports, and long-form articles.</p>
             <Button variant="primary" className="w-full" onClick={() => window.location.href = '/expand'}>
               Expand Content
             </Button>
           </Card>

           {/* SEO Magic */}
           <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-orange-200">
             <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-4">
               <span className="text-white font-bold text-lg">🎯</span>
             </div>
             <h3 className="text-xl font-semibold mb-2">SEO Magic</h3>
             <p className="text-gray-600 mb-4">Optimize your writing for search engine rankings with AI-powered analysis.</p>
             <Button variant="primary" className="w-full" onClick={() => window.location.href = '/seo'}>
               Optimize SEO
             </Button>
           </Card>

           {/* Citation Generator */}
           <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-purple-200">
             <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
               <span className="text-white font-bold text-lg">📚</span>
             </div>
             <h3 className="text-xl font-semibold mb-2">Citation Generator</h3>
             <p className="text-gray-600 mb-4">Generate proper academic citations in APA, MLA, Chicago, Harvard, IEEE, AMA formats.</p>
             <Button variant="primary" className="w-full" onClick={() => window.location.href = '/citation'}>
               Generate Citations
             </Button>
           </Card>

           {/* Plagiarism Shield */}
           <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-red-200">
             <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
               <span className="text-white font-bold text-lg">🔒</span>
             </div>
             <h3 className="text-xl font-semibold mb-2">Plagiarism Shield</h3>
             <p className="text-gray-600 mb-4">Scan and rewrite copied content to avoid plagiarism with AI detection.</p>
             <Button variant="primary" className="w-full" onClick={() => window.location.href = '/plagiarism'}>
               Check Plagiarism
             </Button>
           </Card>

           {/* AI Detection */}
           <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-teal-200">
             <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
               <span className="text-white font-bold text-lg">🔬</span>
             </div>
             <h3 className="text-xl font-semibold mb-2">AI Detection</h3>
             <p className="text-gray-600 mb-4">Check how "AI" your text looks with advanced detection algorithms.</p>
             <Button variant="primary" className="w-full" onClick={() => window.location.href = '/ai-detection'}>
               Detect AI Content
             </Button>
           </Card>

           {/* Grammar Check (via Editor) */}
           <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-emerald-200">
             <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-4">
               <span className="text-white font-bold text-lg">✓</span>
             </div>
             <h3 className="text-xl font-semibold mb-2">Grammar Check</h3>
             <p className="text-gray-600 mb-4">Fix grammar, clarity, and flow in your writing with advanced AI analysis.</p>
             <Button variant="primary" className="w-full" onClick={() => window.location.href = '/editor'}>
               Check Grammar
             </Button>
           </Card>
         </div>
      </Container>
    </div>
  )
}