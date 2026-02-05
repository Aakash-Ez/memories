import { collection, orderBy, query } from 'firebase/firestore'
import { useMemo } from 'react'
import { Card } from '../components/Card'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { formatTimestamp } from '../lib/date'
import { db } from '../lib/firebase'
import type { DisappearingMessage, FirestoreDoc } from '../types/firestore'

export function Messages() {
  const messagesQuery = useMemo(
    () => query(collection(db, 'messages'), orderBy('timestamp', 'desc')),
    []
  )

  const { data, loading, error } = useCollection<
    FirestoreDoc<DisappearingMessage>
  >(messagesQuery)

  return (
    <div className="page">
      <SectionHeader
        title="Disappearing Text"
        subtitle="Ephemeral notes, anonymous or signed, that fade with time."
        accent="Ephemeral"
      />

      {data.length === 0 ? (
        <ListState
          loading={loading}
          error={error}
          emptyLabel="No messages yet."
        />
      ) : (
        <div className="grid-list">
          {data.map((message) => (
            <Card key={message.id}>
              <div className="message-card">
                <p className="message-text">{message.message}</p>
                <div className="message-meta">
                  <span>From {message.sender}</span>
                  <span>To {message.receiver}</span>
                </div>
                <div className="message-meta">
                  <span>Sent {formatTimestamp(message.timestamp)}</span>
                  <span>Expires {formatTimestamp(message.expiryTime)}</span>
                </div>
                {message.public === false ? (
                  <span className="badge">Private</span>
                ) : (
                  <span className="badge">Public</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
