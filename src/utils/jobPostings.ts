import { Timestamp } from 'firebase/firestore'
import type { FirestoreDoc, JobPosting } from '../types/firestore'

export const toEpochMillis = (value?: unknown) => {
  if (!value) return null
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (value instanceof Timestamp) return value.toDate().getTime()
  const parsed = Date.parse(value as string)
  return Number.isNaN(parsed) ? null : parsed
}

export const formatJobDate = (value?: unknown) => {
  const epoch = toEpochMillis(value)
  if (!epoch) return 'TBD'
  return new Date(epoch).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const isLiveJob = (job: FirestoreDoc<JobPosting>) => {
  const closing = toEpochMillis(job.closingDate)
  return closing ? closing >= Date.now() : true
}
