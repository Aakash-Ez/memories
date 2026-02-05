import { collection, orderBy, query } from 'firebase/firestore'
import { useMemo } from 'react'
import { CachedImage } from '../components/CachedImage'
import { Card } from '../components/Card'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { formatTimestamp } from '../lib/date'
import { db } from '../lib/firebase'
import type { FirestoreDoc, ForumMessage } from '../types/firestore'

export function Forum() {
  const forumQuery = useMemo(
    () => query(collection(db, 'forumMessages'), orderBy('timestamp', 'desc')),
    []
  )

  const { data, loading, error } = useCollection<FirestoreDoc<ForumMessage>>(
    forumQuery
  )

  const visiblePosts = useMemo(
    () => data.filter((post) => Boolean(post.userPhoto)),
    [data]
  )

  return (
    <div className="page">
      <SectionHeader
        title="Forum"
        subtitle="Live chatter, anonymous or public, from across the batch."
        accent="Realtime"
      />

      {visiblePosts.length === 0 ? (
        <ListState loading={loading} error={error} emptyLabel="No posts yet." />
      ) : (
        <div className="grid-list">
          {visiblePosts.map((post) => {
            return (
              <Card key={post.id}>
                <div className="forum-card">
                  <div className="forum-header">
                    <CachedImage
                      className="forum-avatar"
                      src={post.userPhoto}
                      alt={post.userName || 'Anonymous'}
                    />
                    <div>
                      <p className="forum-name">{post.userName || 'Anonymous'}</p>
                      <p className="meta">{formatTimestamp(post.timestamp)}</p>
                    </div>
                  </div>
                  <p className="forum-message">{post.message}</p>
                  <p className="meta">Sender: {post.sender}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
