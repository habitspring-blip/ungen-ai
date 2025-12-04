export default function Footer() {
  return (
    <footer className="w-full border-t border-surface-3 bg-surface-0 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-6 text-center text-sm text-ink-2">
        © {new Date().getFullYear()} UngenAI. All rights reserved.
      </div>
    </footer>
  );
}
