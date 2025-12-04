export function CortexPanel({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-card flex flex-col">
      <div className="px-4 py-2.5 border-b border-gray-100 text-[12px] font-semibold tracking-widest uppercase text-gray-500">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
