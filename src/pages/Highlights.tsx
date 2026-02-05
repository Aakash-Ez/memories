
import { collection, orderBy, query } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { CachedImage } from '../components/CachedImage'
import { ImageModal } from '../components/ImageModal'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import type { FirestoreDoc, Highlight, UserProfile } from '../types/firestore'

export function Highlights() {
  const highlightsQuery = useMemo(
    () => query(collection(db, 'highlights'), orderBy('timestamp', 'desc')),
    []
  )
  const usersQuery = useMemo(() => query(collection(db, 'users')), [])

  const { data, loading, error } = useCollection<FirestoreDoc<Highlight>>(
    highlightsQuery
  )
  const { data: users } = useCollection<FirestoreDoc<UserProfile>>(usersQuery)

  const usersById = useMemo(() => {
    return users.reduce<Record<string, UserProfile>>((acc, user) => {
      acc[user.id] = user
      return acc
    }, {})
  }, [users])

  const [selected, setSelected] = useState<FirestoreDoc<Highlight> | null>(null)

  const visibleHighlights = useMemo(
    () => data.filter((highlight) => Boolean(highlight.image || highlight.directlink)),
    [data]
  )
  const [highlightLimit, setHighlightLimit] = useState(20)
  const pagedHighlights = useMemo(
    () => visibleHighlights.slice(0, highlightLimit),
    [visibleHighlights, highlightLimit]
  )
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const groupedByBatch = useMemo(() => {
    const buckets: Record<string, FirestoreDoc<Highlight>[]> = {}
    pagedHighlights.forEach((highlight) => {
      const bucket = highlight.batch || 'Unassigned'
      if (!buckets[bucket]) buckets[bucket] = []
      buckets[bucket].push(highlight)
    })
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([batch, highlights]) => ({ batch, highlights }))
  }, [pagedHighlights])

  return (
    <div className="page">
      <SectionHeader
        title="Highlights"
        subtitle="A mosaic of every shared memory."
        accent="Memories"
      />

      {visibleHighlights.length === 0 ? (
        <ListState
          loading={loading}
          error={error}
          emptyLabel="No highlights yet."
        />
      ) : (
      <div className="batch-stack">
        {groupedByBatch.map((group) => (
            <section key={group.batch} className="batch-section">
              <button
                type="button"
                className="batch-header"
                onClick={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [group.batch]: !prev[group.batch],
                  }))
                }
              >
                <div>
                  <h3>{group.batch}</h3>
                  <span>{group.highlights.length} memories</span>
                </div>
                <span className="batch-toggle">
                  {collapsed[group.batch] ? 'Show' : 'Hide'}
                </span>
              </button>
              {!collapsed[group.batch] ? (
                <section className="wall-panel">
                  <div className="wall-header">
                    <p className="meta">
                      Scroll through {group.batch} highlights.
                    </p>
                  </div>
                  <div className="wall-grid">
                  {group.highlights.map((highlight) => {
                    const imageUrl = highlight.directlink || highlight.image
                      if (!imageUrl) return null

                      return (
                        <button
                          key={highlight.id}
                          className="wall-tile"
                          type="button"
                          onClick={() => setSelected(highlight)}
                        >
                          <CachedImage
                            src={imageUrl}
                            alt={highlight.caption}
                            loading="lazy"
                          />
                          <div className="wall-caption">
                            <p>{highlight.caption || 'A shared memory'}</p>
                            <span>
                              {usersById[highlight.userId]?.name || highlight.userId}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ) : null}
            </section>
          ))}
        </div>
      )}

      {visibleHighlights.length > highlightLimit ? (
        <div className="load-more-row">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setHighlightLimit((prev) => prev + 20)}
          >
            Load more highlights
          </button>
        </div>
      ) : null}

      {selected ? (
        <ImageModal
          src={selected.directlink || selected.image || ''}
          alt={selected.caption}
          caption={`${selected.caption || 'Every memory'} • ${
            usersById[selected.userId]?.name || selected.userId
          }`}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}
