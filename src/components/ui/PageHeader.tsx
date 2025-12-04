export default function PageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-10">
      <h1 className="heading-xl">{title}</h1>
      {subtitle && <p className="text-muted mt-2 text-lg">{subtitle}</p>}
    </div>
  )
}
