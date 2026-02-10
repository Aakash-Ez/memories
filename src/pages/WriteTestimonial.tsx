import { addDoc, collection, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { SectionHeader } from '../components/SectionHeader'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import type { FirestoreDoc, UserProfile } from '../types/firestore'
import { excludeServiceAccounts } from '../utils/userFilters'
import { useUserProfile } from '../hooks/useUserProfile'

export function WriteTestimonial() {
  const { user } = useAuth()
  const usersQuery = useMemo(
    () => query(collection(db, 'users'), orderBy('name', 'asc')),
    []
  )

  const { data: users } = useCollection<FirestoreDoc<UserProfile>>(usersQuery)
  const cleanUsers = useMemo(() => excludeServiceAccounts(users), [users])
  const [receiverId, setReceiverId] = useState<string>('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const writerProfile = useUserProfile(user)
  const fallbackBatch = cleanUsers.find((profile) => profile.id === user?.uid)?.batch
  const currentBatch = writerProfile?.batch ?? fallbackBatch

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return cleanUsers.filter((profile) => profile.batch === currentBatch)
    const term = searchTerm.trim().toLowerCase()
    return cleanUsers.filter(
      (profile) =>
        profile.batch === currentBatch &&
        `${profile.name} ${profile.nickname || ''}`.toLowerCase().includes(term)
    )
  }, [cleanUsers, searchTerm, currentBatch])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setStatus(null)
    if (!user) {
      setError('You must sign in first.')
      return
    }
    if (!receiverId) {
      setError('Choose a recipient.')
      return
    }
    if (!content.trim()) {
      setError('Please add a heartfelt message.')
      return
    }

    const recipient = cleanUsers.find((profile) => profile.id === receiverId)
    if (recipient?.batch !== currentBatch) {
      setError('You can only write for your batchmates.')
      return
    }

    setSubmitting(true)

    try {
      await addDoc(collection(db, 'testimonials'), {
        testimonial: content.trim(),
        writer: user.uid,
        receiver: receiverId,
        timestamp: serverTimestamp(),
        approved: false,
        show: false,
        batch: currentBatch ?? null,
      })
      setStatus('Testimonial recorded. Approval may take a moment.')
      setContent('')
      setReceiverId('')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong; please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProfile = cleanUsers.find((profile) => profile.id === receiverId)

  return (
    <div className="page">
      <SectionHeader
        title="Write a testimonial"
        subtitle="Choose a peer, share a story, and add a little love."
        accent="Appreciation"
      />

      <div className="testimonial-layout">
        <form className="testimonial-card" onSubmit={handleSubmit}>
          <div className="testimonial-card-header">
            <h3>Send a note</h3>
            <p>We review every message before it appears on a profile.</p>
          </div>

          <div className="search-dropdown">
            <label className="auth-field search-label">
              <span>Search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Type a batchmate’s name"
              />
            </label>
            <label className="auth-field search-label">
              <span>Recipient</span>
              <select
                value={receiverId}
                onChange={(event) => setReceiverId(event.target.value)}
              >
                <option value="">Choose a peer</option>
                {searchResults.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} {profile.nickname ? `(${profile.nickname})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="auth-field">
            Your message
            <textarea
              rows={6}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Share a memory or words of appreciation."
            />
          </label>

          {error ? <p className="state-pill state-error">{error}</p> : null}
          {status ? <p className="state-pill">{status}</p> : null}

          <div className="auth-actions">
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Submit testimonial'}
            </button>
          </div>
        </form>

        <aside className="testimonial-card profile-preview">
          {selectedProfile ? (
            <>
              <h4>Recipient</h4>
              <p className="profile-preview-name">
                {selectedProfile.name}
                {selectedProfile.nickname ? ` (“${selectedProfile.nickname}”)` : ''}
              </p>
              {selectedProfile.photoURL ? (
                <div className="profile-preview-image">
                  <img src={selectedProfile.photoURL} alt={selectedProfile.name} />
                </div>
              ) : null}
              <div className="profile-preview-meta">
                <p>
                  <strong>Favorite spot:</strong>{' '}
                  {selectedProfile.favoriteSpot || '—'}
                </p>
                <p>
                  <strong>Theme song:</strong>{' '}
                  {selectedProfile.mbaLifeThemeSong || '—'}
                </p>
              </div>
              <p className="profile-preview-instruction">
                Keep your words kind and specific to the memory you share.
              </p>
            </>
          ) : (
            <p className="state-pill">Pick a recipient to preview their card.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
