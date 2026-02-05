import { collection, orderBy, query } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { CachedImage } from '../components/CachedImage'
import { ImageModal } from '../components/ImageModal'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import type { FirestoreDoc, Highlight, UserProfile } from '../types/firestore'

type GroupedHighlights = {
  batch: string
  highlights: FirestoreDoc<Highlight>[]
}

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

  const visibleHighlights = useMemo(
    () =>
      data.filter((highlight) => Boolean(highlight.image || highlight.directlink)),
    [data]
  )

  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<FirestoreDoc<Highlight> | null>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return visibleHighlights
    return visibleHighlights.filter((highlight) => {
      const caption = highlight.caption?.toLowerCase() || ''
      const authorName =
        usersById[highlight.userId]?.name?.toLowerCase() || ''
      return (
        caption.includes(term) ||
        authorName.includes(term) ||
        highlight.tags?.some((tag) =>
          usersById[tag]?.name?.toLowerCase().includes(term)
        )
      )
    })
  }, [search, visibleHighlights, usersById])

  const grouped = useMemo<GroupedHighlights[]>(() => {
    const buckets: Record<string, FirestoreDoc<Highlight>[]> = {}
    filtered.forEach((highlight) => {
      const batch = highlight.batch || 'Unassigned'
      if (!buckets[batch]) buckets[batch] = []
      buckets[batch].push(highlight)
    })

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([batch, highlights]) => ({
        batch,
        highlights,
      }))
  }, [filtered])

  return (
    <div className="page">
      <SectionHeader
        title="Highlights"
        subtitle="A mosaic of every shared memory."
        accent="Memories"
      />

      <div className="profiles-toolbar">
        <div className="search-field">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by batchmate, caption, or tag"
          />
        </div>
        <div className="profiles-meta">
          <span>{filtered.length} highlights</span>
          <span>{grouped.length} batches</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <ListState
          loading={loading}
          error={error}
          emptyLabel="No highlights yet."
        />
      ) : (
        <div className="batch-stack">
          {grouped.map((group) => (
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
                <div className="highlight-grid">
                  {group.highlights.map((highlight) => {
                    const imageUrl = highlight.image || highlight.directlink
                    if (!imageUrl) return null

                    const author = usersById[highlight.userId]
                    const localTime = highlight.timestamp
                      ? new Date(highlight.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Unknown date'

                    return (
                      <button
                        key={highlight.id}
                        className="highlight-card"
                        type="button"
                        onClick={() => setSelected(highlight)}
                        aria-label={`View ${highlight.caption} in full`}
                      >
                        <div className="highlight-media">
                          <CachedImage
                            src={imageUrl}
                            alt={highlight.caption}
                            loading="lazy"
                          />
                        </div>
                        <div className="highlight-body">
                          <p className="highlight-caption">
                            {highlight.caption || 'A memory shared'}
                          </p>
                          <p className="highlight-meta">
                            Shared by {author?.name || highlight.userId}
                          </p>
                          <div className="highlight-footer">
                            <span className="highlight-pill">
                              {highlight.tags?.length
                                ? `${highlight.tags.length} tagged`
                                : 'No tags'}
                            </span>
                            <span className="highlight-pill subtle">
                              {localTime}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}

      {selected ? (
        <ImageModal
          src={selected.image || selected.directlink || ''}
          alt={selected.caption}
          caption={`${selected.caption} • ${
            usersById[selected.userId]?.name || selected.userId
          }`}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}"}{"response_length":"short"}{"request_id":"turn35tools1"}```
