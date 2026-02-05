import { collection, doc, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CachedImage } from '../components/CachedImage'
import { ImageModal } from '../components/ImageModal'
import { Card } from '../components/Card'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { useDocument } from '../hooks/useDocument'
import { db } from '../lib/firebase'
import type { FirestoreDoc, Highlight, Testimonial, UserProfile } from '../types/firestore'
import { useAuth } from '../context/AuthContext'
import {
  defaultKeyQAFields,
  keyQAMetadataByLabel,
  keyQAFieldsByBatch,
  type KeyQAField,
} from '../data/keyQAFields'
import { profileValueForRender } from '../utils/profileValues'

export function ProfileDetail({ userId: userIdProp }: { userId?: string } = {}) {
  const { id } = useParams<{ id: string }>()
  const userId = userIdProp || id || ''

  const userRef = useMemo(() => doc(db, 'users', userId), [userId])
  const { data: profile, loading: profileLoading, error: profileError } =
    useDocument<FirestoreDoc<UserProfile>>(userRef)

  const taggedHighlightsQuery = useMemo(
    () =>
      query(
        collection(db, 'highlights'),
        where('tags', 'array-contains', userId),
        orderBy('timestamp', 'desc')
      ),
    [userId]
  )

  const createdHighlightsQuery = useMemo(
    () =>
      query(
        collection(db, 'highlights'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      ),
    [userId]
  )

  const testimonialsQuery = useMemo(
    () =>
      query(
        collection(db, 'testimonials'),
        where('receiver', '==', userId),
        orderBy('timestamp', 'desc')
      ),
    [userId]
  )

  const taggedHighlights = useCollection<FirestoreDoc<Highlight>>(
    taggedHighlightsQuery
  )
  const createdHighlights = useCollection<FirestoreDoc<Highlight>>(
    createdHighlightsQuery
  )
  const testimonials = useCollection<FirestoreDoc<Testimonial>>(testimonialsQuery)
  const usersQuery = useMemo(() => query(collection(db, 'users')), [])
  const { data: users } = useCollection<FirestoreDoc<UserProfile>>(usersQuery)

  const usersById = useMemo(() => {
    return users.reduce<Record<string, UserProfile>>((acc, user) => {
      acc[user.id] = user
      return acc
    }, {})
  }, [users])

  const highlights = useMemo(() => {
    const map = new Map<string, FirestoreDoc<Highlight>>()
    taggedHighlights.data.forEach((item) => map.set(item.id, item))
    createdHighlights.data.forEach((item) => map.set(item.id, item))
    return Array.from(map.values())
  }, [taggedHighlights.data, createdHighlights.data])

  const visibleHighlights = useMemo(
    () => highlights.filter((highlight) => highlight.image || highlight.directlink),
    [highlights]
  )
  const [highlightLimit, setHighlightLimit] = useState(20)
  const pagedHighlights = useMemo(
    () => visibleHighlights.slice(0, highlightLimit),
    [visibleHighlights, highlightLimit]
  )
  const [selected, setSelected] = useState<FirestoreDoc<Highlight> | null>(null)
  const { user } = useAuth()
  const profileFields = useMemo<KeyQAField[]>(() => {
    if (!profile) return defaultKeyQAFields
    const batchKey = profile.batch || 'SOM25'
    const rawKeyQA = profile.KeyQA || {}
    const hasKeyQA = Object.keys(rawKeyQA).length > 0
    const baseFields = keyQAFieldsByBatch[batchKey] ?? defaultKeyQAFields
    const dynamicFields: KeyQAField[] = hasKeyQA
      ? Object.entries(rawKeyQA).map(([label, entry]) => {
          const meta = keyQAMetadataByLabel[label]
          return {
            label,
            name: entry.Name,
            key: entry.Key,
            placeholder: meta?.placeholder,
            type: meta?.type,
            rows: meta?.rows,
          }
        })
      : baseFields
    return [...dynamicFields]
      .sort((a, b) => a.key - b.key)
      .filter((field) => field.name !== 'photoURL')
  }, [profile])
  const emojiOptions = ['❤️', '👏', '🔥', '🤗', '⭐']

  const handleReact = async (noteId: string, emoji: string) => {
    if (!user) return
    const noteRef = doc(db, 'testimonials', noteId)
    const existing = testimonials.data.find((note) => note.id === noteId)
    const nextReactions = {
      ...(existing?.reactions || {}),
      [user.uid]: emoji,
    }
    try {
      await updateDoc(noteRef, { reactions: nextReactions })
    } catch (err) {
      console.error('Unable to react', err)
    }
  }

  if (!userId) {
    return (
      <div className="page">
        <SectionHeader
          title="Profile"
          subtitle="Select a profile from the directory."
        />
      </div>
    )
  }

  return (
    <div className="page">
      <SectionHeader
        title={profile?.name || 'Profile'}
        subtitle="Highlights and testimonials curated around this student."
        accent="Memories"
      />

      {profileLoading ? (
        <ListState loading error={null} emptyLabel="Loading profile" />
      ) : profileError ? (
        <ListState loading={false} error={profileError} emptyLabel="" />
      ) : profile ? (
        <Card>
            <div className="profile-hero">
              {profile.photoURL ? (
                <div className="profile-hero-image">
                  <CachedImage
                    src={profile.photoURL}
                    alt={profile.name}
                    width={160}
                    height={160}
                  />
                </div>
              ) : null}
            <div className="profile-hero-body">
              <div>
                <p className="profile-label">Student profile</p>
                <h3>{profile.name}</h3>
                {profile.nickname ? (
                  <span className="profile-nickname">"{profile.nickname}"</span>
                ) : null}
              </div>
              <div className="profile-grid">
                {profileFields.map((field) => (
                  <div key={field.name}>
                    <span>{field.label}</span>
                    <strong>
                      {profileValueForRender(
                        profile[field.name as keyof UserProfile]
                      )}
                    </strong>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </Card>
      ) : (
        <ListState loading={false} error={null} emptyLabel="Profile not found." />
      )}

      <SectionHeader title="Highlights" subtitle="Moments they shared or were tagged in." />
      {pagedHighlights.length === 0 ? (
        <ListState
          loading={taggedHighlights.loading || createdHighlights.loading}
          error={taggedHighlights.error || createdHighlights.error}
          emptyLabel="No highlights yet."
        />
      ) : (
        <div className="wall-grid">
          {pagedHighlights.map((highlight) => {
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
                  <p>{highlight.caption}</p>
                  <span>{usersById[highlight.userId]?.name || highlight.userId}</span>
                </div>
              </button>
            )
          })}
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

      <SectionHeader title="Testimonials" subtitle="Words shared by the community." />
      {testimonials.data.length === 0 ? (
        <ListState
          loading={testimonials.loading}
          error={testimonials.error}
          emptyLabel="No testimonials yet."
        />
      ) : (
        <div className="testimonial-stack">
          {testimonials.data.map((note) => {
            const writer = usersById[note.writer]
            const reactions = note.reactions ? Object.entries(note.reactions) : []
            const emojiCounts = reactions.reduce<Record<string, number>>((acc, [, reaction]) => {
              acc[reaction] = (acc[reaction] || 0) + 1
              return acc
            }, {})
            const userReaction = user
              ? reactions.find(([actor]) => actor === user.uid)?.[1]
              : undefined
            return (
              <Card key={note.id}>
                <div className="testimonial-panel">
                  <div className="testimonial-panel-body">
                    <div className="testimonial-writer">
                      <div className="writer-avatar-wrapper">
                        {writer?.photoURL ? (
                          <img
                            src={writer.photoURL}
                            alt={writer.name}
                            loading="lazy"
                          />
                        ) : (
                          <span>{writer?.name?.[0] || 'S'}</span>
                        )}
                      </div>
                      <div>
                        <p className="testimonial-writer-name">
                          {writer?.name || 'Anonymous'}
                        </p>
                        <p className="testimonial-meta-quiet">
                          {writer?.nickname ? `“${writer.nickname}”` : 'SJMSOM alumni'}
                        </p>
                      </div>
                    </div>
                    <p className="testimonial-text">
                      {note.testimonial?.replace(/[“”]/g, '"')}
                    </p>
                  </div>
                  <div className="testimonial-panel-foot">
                    <div>
                      {note.approved ? (
                        <span className="badge badge-soft badge-success">
                          Approved
                        </span>
                      ) : null}
                    </div>
                    {reactions.length ? (
                      <div className="reaction-row">
                        {reactions.slice(0, 6).map(([userId, reaction]) => (
                          <span
                            key={`${note.id}-${userId}`}
                            className="reaction-pill"
                            title={`Reacted: ${usersById[userId]?.name || 'Someone'}`}
                          >
                            {reaction}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="reaction-actions">
                    {emojiOptions.map((emoji) => {
                      const count = emojiCounts[emoji] || 0
                      return (
                        <button
                          key={emoji}
                          type="button"
                          className={`reaction-button ${
                            userReaction === emoji ? 'reaction-button-active' : ''
                          }`}
                          onClick={() => handleReact(note.id, emoji)}
                          aria-label={`React with ${emoji}`}
                        >
                          <span>{emoji}</span>
                          {count ? <small>{count}</small> : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {selected ? (
        <ImageModal
          src={selected.directlink || selected.image || ''}
          alt={selected.caption}
          caption={`${selected.caption} • ${
            usersById[selected.userId]?.name || selected.userId
          }`}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}





