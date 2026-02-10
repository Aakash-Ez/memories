export const CURRENT_BATCH_LABEL = 'SOM26'

export const isCurrentBatch = (batch?: string) => batch === CURRENT_BATCH_LABEL

export const isAlumBatch = (batch?: string) =>
  Boolean(batch) && !isCurrentBatch(batch)

export type BatchStatus = 'current' | 'alum' | 'unknown'

export const getBatchStatus = (batch?: string): BatchStatus => {
  if (isCurrentBatch(batch)) return 'current'
  if (isAlumBatch(batch)) return 'alum'
  return 'unknown'
}
