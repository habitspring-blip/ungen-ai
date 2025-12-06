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
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Grammar Check</h3>
            <p className="text-gray-600 mb-4">Advanced grammar and style checking for professional writing.</p>
            <Button variant="primary" className="w-full">
              Use Grammar Tool
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">AI Detection</h3>
            <p className="text-gray-600 mb-4">Detect AI-generated content with high accuracy.</p>
            <Button variant="primary" className="w-full">
              Check Content
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Text Rewrite</h3>
            <p className="text-gray-600 mb-4">Rewrite and improve your existing content.</p>
            <Button variant="primary" className="w-full">
              Rewrite Text
            </Button>
          </Card>
        </div>
      </Container>
    </div>
  )
}