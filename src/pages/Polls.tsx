import {
  collection,
  doc,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Card } from '../components/Card'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import type { FirestoreDoc, Poll, UserProfile } from '../types/firestore'

const SOM26_LABEL = 'SOM26'

const isSOM26 = (batch?: string) => batch === SOM26_LABEL

const getWinningOptions = (options?: Poll['options']) => {
  if (!options?.length) return []
  const maxVotes = Math.max(...options.map((option) => option.votes || 0))
  return options.filter((option) => (option.votes || 0) === maxVotes)
}

export function Polls() {
  const { user } = useAuth()
  const pollsQuery = useMemo(
    () => query(collection(db, 'polls'), orderBy('created_at', 'desc')),
    []
  )

  const usersQuery = useMemo(() => query(collection(db, 'users')), [])
  const { data: users = [] } = useCollection<FirestoreDoc<UserProfile>>(usersQuery)
  const usersById = useMemo(() => {
    return users.reduce<Record<string, UserProfile>>((acc, profile) => {
      acc[profile.id] = profile
      return acc
    }, {})
  }, [users])

  const { data, loading, error } = useCollection<FirestoreDoc<Poll>>(pollsQuery)
  const groupedByBatch = useMemo(() => {
    const buckets: Record<string, FirestoreDoc<Poll>[]> = {}
    data.forEach((poll) => {
      const bucket = poll.batch || 'Unassigned'
      if (!buckets[bucket]) buckets[bucket] = []
      buckets[bucket].push(poll)
    })
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([batch, polls]) => ({ batch, polls }))
  }, [data])

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')

  const currentUserBatch = user ? usersById[user.uid]?.batch : undefined
  const filteredUsers = useMemo(() => {
    const filter = searchTerm.trim().toLowerCase()
    if (!filter) {
      return []
    }
    return users
      .filter(
        (candidate) =>
          candidate.batch === currentUserBatch &&
          (() => {
            const name = candidate.name?.toLowerCase() ?? ''
            const email = candidate.email?.toLowerCase() ?? ''
            return name.includes(filter) || email.includes(filter)
          })()
      )
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .slice(0, 32)
  }, [users, searchTerm])

  const voteForUser = async (pollId: string, userId: string) => {
    if (!user || currentUserBatch !== SOM26_LABEL) return
    const pollRef = doc(db, 'polls', pollId)
    await runTransaction(db, async (tx) => {
      const snapshot = await tx.get(pollRef)
      const pollData = snapshot.data() as Omit<Poll, 'id'> | undefined
      const options = pollData?.options ?? []
      const targetCandidate = usersById[userId]
      if (
        !targetCandidate ||
        targetCandidate.batch !== currentUserBatch ||
        currentUserBatch !== SOM26_LABEL
      ) {
        return
      }
      const currentIndex = options.findIndex((option) =>
        option.voters?.includes(user.uid)
      )
      if (currentIndex !== -1 && options[currentIndex].id === userId) {
        const option = options[currentIndex]
        option.voters = (option.voters ?? []).filter((uid) => uid !== user.uid)
        option.votes = option.voters.length
        tx.update(pollRef, { options })
        return
      }

      if (currentIndex !== -1) {
        const existing = options[currentIndex]
        existing.voters = (existing.voters ?? []).filter((uid) => uid !== user.uid)
        existing.votes = existing.voters.length
      }

      let target = options.find((option) => option.id === userId)
      if (!target) {
        const candidateName = usersById[userId]?.name || 'Batchmate'
        target = {
          id: userId,
          name: candidateName,
          votes: 0,
          voters: [],
        }
        options.push(target)
      }

      let voters = target.voters ?? []
      if (!voters.includes(user.uid)) {
        voters = [...voters, user.uid]
      }
      target.voters = voters
      target.votes = voters.length

      tx.update(pollRef, { options })
    })
  }

  return (
    <div className="page">
      <SectionHeader
        title="Polls"
        subtitle="Anonymous votes with live results across the batch."
        accent="Live"
      />

      {data.length === 0 ? (
        <ListState loading={loading} error={error} emptyLabel="No polls yet." />
      ) : (
        <div className="batch-stack">
          {groupedByBatch.map(({ batch, polls }) => (
            <section key={batch} className="batch-section">
              <button
                type="button"
                className="batch-header"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [batch]: !prev[batch] }))
                }
              >
                <div>
                  <h3>{batch}</h3>
                  <span>{polls.length} polls</span>
                </div>
                <span className="batch-toggle">
                  {collapsed[batch] ? 'Show' : 'Hide'}
                </span>
              </button>
              {!collapsed[batch] && (
                <div className="grid-list">
                  {polls.map((poll) => {
                    const totalVotes = poll.options?.reduce(
                      (sum, option) => sum + (option.votes || 0),
                      0
                    )
                    const userVote = user
                      ? poll.options?.find((option) =>
                          option.voters?.includes(user.uid)
                        )
                      : undefined

                    return (
                      <Card key={poll.id}>
                        <div className="poll-card">
                          <h3>{poll.question}</h3>
                          <p className="meta">Total votes: {totalVotes || 0}</p>
                          {!isSOM26(batch) ? (
                            <p className="meta">Showing winner(s) only</p>
                          ) : null}
                          <div className="poll-options">
                            {(
                              isSOM26(batch) ? poll.options : getWinningOptions(poll.options)
                            )?.map((option) => {
                              const percent = totalVotes
                                ? Math.round(((option.votes || 0) / totalVotes) * 100)
                                : 0

                              return (
                                <div key={option.id} className="poll-option">
                                  <div className="poll-option-header">
                                    <span>{option.name}</span>
                                    <span>{option.votes || 0} votes</span>
                                  </div>
                                  <div className="poll-bar">
                                    <div
                                      className="poll-bar-fill"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {isSOM26(batch) ? (
                            <div className="batchmate-vote-shell">
                              {currentUserBatch !== SOM26_LABEL ? (
                                <p className="meta accent">
                                  Only SOM26 batchmates can vote here.
                                </p>
                              ) : (
                                userVote ? (
                                  <p className="hero-subtitle">
                                    You voted for{' '}
                                    {usersById[userVote.id]?.name ||
                                      userVote.name ||
                                      'this batchmate'}.
                                  </p>
                                ) : null
                              )}
                              <input
                                type="text"
                                className="tag-search"
                                placeholder="Search batchmates"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                disabled={currentUserBatch !== SOM26_LABEL}
                              />
                              <div className="batchmate-grid">
                                {filteredUsers.map((batchmate) => (
                                  <button
                                    key={batchmate.id}
                                    type="button"
                                    className={`tag-pill tag-suggestion ${
                                      userVote?.id === batchmate.id
                                        ? 'tag-selected'
                                        : ''
                                    }`}
                                    onClick={() => voteForUser(poll.id, batchmate.id)}
                                    disabled={
                                      !user || currentUserBatch !== SOM26_LABEL
                                    }
                                  >
                                    {batchmate.name || batchmate.email || 'Batchmate'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
