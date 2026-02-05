export function formatTimestamp(value: unknown) {
  if (!value) return '-'
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed.toLocaleString()
    }
    return value
  }

  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toDate?: () => Date }
    if (typeof maybe.toDate === 'function') {
      return maybe.toDate().toLocaleString()
    }
  }

  return '-'
}
