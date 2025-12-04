export function CortexButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
    >
      {children}
    </button>
  )
}
