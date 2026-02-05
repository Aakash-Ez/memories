export function SectionHeader({
  title,
  subtitle,
  accent,
}: {
  title: string
  subtitle?: string
  accent?: string
}) {
  return (
    <div className="section-header">
      {accent ? <span className="section-accent">{accent}</span> : null}
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  )
}
