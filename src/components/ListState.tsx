export function ListState({
  loading,
  error,
  emptyLabel,
}: {
  loading: boolean
  error: string | null
  emptyLabel: string
}) {
  if (loading) {
    return <p className="state-pill">Loading…</p>
  }
  if (error) {
    return <p className="state-pill state-error">{error}</p>
  }
  return <p className="state-pill">{emptyLabel}</p>
}
