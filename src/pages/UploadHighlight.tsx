import { addDoc, arrayUnion, collection, doc, serverTimestamp, query, updateDoc } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { useDocument } from '../hooks/useDocument'
import { useAuth } from '../context/AuthContext'
import { db, storage } from '../lib/firebase'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import type { FirestoreDoc, Highlight, UserProfile } from '../types/firestore'

export function UploadHighlight() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="page">
        <SectionHeader
          title="Upload highlight"
          subtitle="Sign in to add a new memory."
          accent="Highlights"
        />
        <p className="state-pill">Sign in to contribute a highlight.</p>
      </div>
    )
  }

  const userRef = useMemo(() => doc(db, 'users', user.uid), [user])
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
  } = useDocument<FirestoreDoc<UserProfile>>(userRef)

  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [tagSearch, setTagSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const usersQuery = useMemo(() => query(collection(db, 'users')), [])
  const { data: users = [] } = useCollection<FirestoreDoc<UserProfile>>(usersQuery)
  const usersById = useMemo(() => {
    return users.reduce<Record<string, UserProfile>>((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})
  }, [users])
  const batch = profile?.batch
  const tagSuggestions = useMemo(() => {
    const normalized = tagSearch.trim().toLowerCase()
    if (!normalized) return []
    const pool = users.filter((candidate) => !selectedTags.includes(candidate.id))
    return pool
      .filter((candidate) => {
        const name = candidate.name?.toLowerCase() ?? ''
        const email = candidate.email?.toLowerCase() ?? ''
        const sameBatch =
          batch && candidate.batch ? candidate.batch === batch : !candidate.batch
        return sameBatch && (name.includes(normalized) || email.includes(normalized))
      })
      .slice(0, 6)
  }, [users, selectedTags, tagSearch, batch])
  const handleAddTag = (userId: string) => {
    if (!selectedTags.includes(userId)) {
      setSelectedTags((prev) => [...prev, userId])
    }
    setTagSearch('')
  }
  const handleRemoveTag = (userId: string) => {
    setSelectedTags((prev) => prev.filter((id) => id !== userId))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)
    setError(null)
    if (!user) {
      setError('You need to sign in to add highlights.')
      return
    }
    if (!caption.trim()) {
      setError('Add a caption to describe the highlight.')
      return
    }
    if (!imageFile) {
      setError('Upload a photo to add a highlight.')
      return
    }

    setSubmitting(true)

    try {
      const payload: Partial<Highlight> = {
        caption: caption.trim(),
        userId: user.uid,
        timestamp: serverTimestamp(),
        batch,
      }
      if (imageFile) {
        setUploading(true)
        setStatus('Uploading image…')
        const storageRef = ref(
          storage,
          `highlights/${user.uid}/${Date.now()}-${imageFile.name}`
        )
        await uploadBytes(storageRef, imageFile)
        payload.image = await getDownloadURL(storageRef)
      }
      payload.tags = selectedTags

      const highlightRef = await addDoc(collection(db, 'highlights'), payload)
      if (userRef) {
        await updateDoc(userRef, {
          ImportantHighlights: arrayUnion(highlightRef.id),
        })
      }
      setStatus('Highlight added. It may take a moment to appear.')
      setCaption('')
      setImageFile(null)
      setSelectedTags([])
      setTagSearch('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save highlight right now.'
      )
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  return (
    <div className="page">
      <div className="upload-highlight-shell">
        <SectionHeader
          title="Upload highlight"
          subtitle="Share a photo and caption from your batch."
          accent="Highlights"
        />

        {profileLoading ? (
          <p className="state-pill">Loading profile batch…</p>
        ) : profileError ? (
          <p className="state-pill state-error">{profileError}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="form-card">
          <label className="auth-field">
            Caption
            <textarea
              rows={3}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Describe what happened in this image."
            />
          </label>

          <label className="auth-field">
            Upload photo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              disabled={uploading}
            />
          </label>

          <label className="auth-field">
            Tag batchmates
            <input
              type="text"
              value={tagSearch}
              onChange={(event) => setTagSearch(event.target.value)}
              placeholder="Search by name or email"
            />
          </label>
          {tagSuggestions.length ? (
            <div className="tag-suggestion-row">
              {tagSuggestions.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className="tag-pill tag-suggestion"
                  onClick={() => handleAddTag(candidate.id)}
                >
                  {candidate.name || candidate.email || 'Batchmate'}
                </button>
              ))}
            </div>
          ) : null}
          {selectedTags.length ? (
            <div className="tag-row">
              {selectedTags.map((tag) => (
                <span key={tag} className="tag-pill tag-selected">
                  {usersById[tag]?.name || usersById[tag]?.email || 'Tagged'}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <p className="meta">
            Your current batch: <strong>{batch || 'Not assigned'}</strong>
          </p>

          {imageFile && <p className="meta">Using uploaded file: {imageFile.name}</p>}
          {error ? <p className="state-pill state-error">{error}</p> : null}
          {status ? <p className="state-pill">{status}</p> : null}

          <button
            className="btn-primary"
            type="submit"
            disabled={submitting || uploading}
          >
            {submitting || uploading ? 'Uploading…' : 'Add highlight'}
          </button>
        </form>
      </div>
    </div>
  )
}
