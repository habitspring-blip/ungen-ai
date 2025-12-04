export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">

      {/* Decorative gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="flex flex-col items-center justify-center flex-1 text-center px-6 relative z-10">

        <h1 className="text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
          Rewrite Like a Human.
        </h1>

        <p className="text-xl text-gray-700 max-w-2xl mb-10">
          UngenAI transforms your writing into clear, natural, accurate expression
          without adding noise or hallucination.
        </p>

        <a href="/editor">
          <button className="px-8 py-4 text-lg rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            Try the Editor
          </button>
        </a>

      </div>

    </div>
  )
}