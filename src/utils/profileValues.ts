export function normalizeProfileValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return ''
}

export function profileValueForRender(value: unknown, fallback = '-'): string {
  const normalized = normalizeProfileValue(value)
  return normalized || fallback
}
