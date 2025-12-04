export default function ToolsPage() {
  const tools = [
    { name: "Cortex One", desc: "AI-powered writing refinement", link: "/editor" },
    { name: "Summariser", desc: "Condense long text", link: "/summarise" },
    { name: "Expander", desc: "Expand short text", link: "/expand" }
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-10">
        Tools
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((t) => (
          <a
            key={t.name}
            href={t.link}
            className="bg-white border border-gray-200 rounded-2xl shadow-card p-6 hover:shadow-heavy transition"
          >
            <div className="text-xl font-semibold">{t.name}</div>
            <p className="text-sm text-gray-500 mt-2">{t.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
