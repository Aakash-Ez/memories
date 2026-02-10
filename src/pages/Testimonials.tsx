import { collection, orderBy, query } from 'firebase/firestore'
import { useMemo } from 'react'
import { Card } from '../components/Card'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import type { FirestoreDoc, Testimonial, UserProfile } from '../types/firestore'
import { excludeServiceAccounts } from '../utils/userFilters'

export function Testimonials() {
  const testimonialsQuery = useMemo(
    () => query(collection(db, 'testimonials'), orderBy('timestamp', 'desc')),
    []
  )
  const usersQuery = useMemo(() => query(collection(db, 'users')), [])

  const { data, loading, error } = useCollection<FirestoreDoc<Testimonial>>(
    testimonialsQuery
  )
  const { data: users } = useCollection<FirestoreDoc<UserProfile>>(usersQuery)
  const filteredUsers = useMemo(() => excludeServiceAccounts(users), [users])

  const usersById = useMemo(() => {
    return filteredUsers.reduce<Record<string, UserProfile>>((acc, user) => {
      acc[user.id] = user
      return acc
    }, {})
  }, [filteredUsers])

  return (
    <div className="page">
      <SectionHeader
        title="Testimonials"
        subtitle="Kind words, shared memories, and reactions from peers."
        accent="Appreciation"
      />

      {data.length === 0 ? (
        <ListState
          loading={loading}
          error={error}
          emptyLabel="No testimonials yet."
        />
      ) : (
        <div className="grid-list">
          {data.map((note) => (
            <Card key={note.id}>
              <div className="testimonial-card">
                <p className="testimonial-text">"{note.testimonial}"</p>
                <div className="testimonial-meta">
                  <span>
                    From {usersById[note.writer]?.name || note.writer}
                  </span>
                  <span>
                    To {usersById[note.receiver]?.name || note.receiver}
                  </span>
                </div>
                <div className="tag-row">
                  {note.reactions
                    ? Object.values(note.reactions)
                        .slice(0, 6)
                        .map((reaction, index) => (
                          <span key={`${note.id}-${index}`} className="tag-pill">
                            {reaction}
                          </span>
                        ))
                    : null}
                </div>
                <div className="badge-row">
                  {note.approved ? <span className="badge">Approved</span> : null}
                  {note.rank ? <span className="badge">Rank {note.rank}</span> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
