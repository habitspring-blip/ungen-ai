export default function CTAButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-xl bg-black text-white font-medium hover:bg-black/90 active:scale-[.98] transition"
    >
      {children}
    </button>
  )
}
