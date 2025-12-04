export default function Section({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`mb-8 ${className}`}>{children}</div>
}
