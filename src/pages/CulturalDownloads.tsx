import { collection, orderBy, query } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import type { FirestoreDoc, Highlight, Testimonial } from '../types/firestore'

const buildCSV = (rows: string[][]) =>
  rows.map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n')

const formatTimestamp = (value: unknown) => {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  try {
    return new Date(value as string | number).toISOString()
  } catch {
    return ''
  }
}

const downloadFile = (filename: string, content: string, type = 'text/csv') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function CulturalDownloads() {
  const testimonialsQuery = useMemo(
    () => query(collection(db, 'testimonials'), orderBy('timestamp', 'desc')),
    []
  )
  const highlightsQuery = useMemo(
    () => query(collection(db, 'highlights'), orderBy('timestamp', 'desc')),
    []
  )
  const { data: testimonials, loading: testimonialsLoading } =
    useCollection<FirestoreDoc<Testimonial>>(testimonialsQuery)
  const { data: highlights, loading: highlightsLoading } =
    useCollection<FirestoreDoc<Highlight>>(highlightsQuery)

  const batches = useMemo(() => {
    const all = [...testimonials, ...highlights].map((item) => item.batch || 'Unassigned')
    return Array.from(new Set(all))
  }, [highlights, testimonials])

  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const filteredTestimonials = useMemo(
    () =>
      selectedBatch
        ? testimonials.filter((item) => (item.batch || 'Unassigned') === selectedBatch)
        : testimonials,
    [selectedBatch, testimonials]
  )
  const filteredHighlights = useMemo(
    () =>
      selectedBatch
        ? highlights.filter((item) => (item.batch || 'Unassigned') === selectedBatch)
        : highlights,
    [selectedBatch, highlights]
  )

  const handleDownload = () => {
    const rows = [
      ['Question', 'Writer', 'Receiver', 'Timestamp'],
      ...filteredTestimonials.map((testimonial) => [
        testimonial.testimonial,
        testimonial.writer,
        testimonial.receiver,
        formatTimestamp(testimonial.timestamp),
      ]),
    ]
    downloadFile(
      `testimonials-${selectedBatch ?? 'all'}.csv`,
      buildCSV(rows)
    )
  }

  const handleHighlightDownload = () => {
    const rows = [
      ['Caption', 'Batch', 'UserId', 'Timestamp', 'Tags', 'Image'],
      ...filteredHighlights.map((highlight) => [
        highlight.caption,
        highlight.batch || 'Unassigned',
        highlight.userId,
        formatTimestamp(highlight.timestamp),
        (highlight.tags || []).join('|'),
        highlight.image || highlight.directlink || '',
      ]),
    ]
    downloadFile(
      `highlights-${selectedBatch ?? 'all'}.csv`,
      buildCSV(rows)
    )
  }

  const loading = testimonialsLoading || highlightsLoading

  return (
    <div className="page">
      <SectionHeader
        title="Cultural downloads"
        subtitle="Export testimonials and highlights by batch."
        accent="Admin"
      />
      <Card>
        <div className="profiles-toolbar">
          <div className="search-field">
            <span>Batch</span>
            <select
              value={selectedBatch ?? ''}
              onChange={(event) => setSelectedBatch(event.target.value || null)}
            >
              <option value="">All batches</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
          <div className="auth-actions">
            <button className="btn-ghost" type="button" onClick={handleDownload} disabled={loading}>
              Download testimonials
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={handleHighlightDownload}
              disabled={loading}
            >
              Download highlights
            </button>
          </div>
        </div>
        {loading ? (
          <ListState loading error={null} emptyLabel="Preparing export…" />
        ) : (
          <p className="meta subtle">
            {filteredTestimonials.length} testimonials · {filteredHighlights.length} highlights
          </p>
        )}
      </Card>
    </div>
  )
}
