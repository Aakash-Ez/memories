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
import { excludeServiceAccounts } from '../utils/userFilters'
import {
  CURRENT_BATCH_LABEL,
  isCurrentBatch,
} from '../data/batchStatus'

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
  const filteredUsers = excludeServiceAccounts(users)
  const usersById = useMemo(() => {
    return filteredUsers.reduce<Record<string, UserProfile>>((acc, profile) => {
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
  const [searchTermByPoll, setSearchTermByPoll] = useState<Record<string, string>>({})

  const currentUserBatch = user ? usersById[user.uid]?.batch : undefined
  const filteredUsersByPoll = useMemo(() => {
    const buckets: Record<string, FirestoreDoc<UserProfile>[]> = {}
    Object.entries(searchTermByPoll).forEach(([pollId, term]) => {
      const filter = term.trim().toLowerCase()
      if (!filter) {
        buckets[pollId] = []
        return
      }
      buckets[pollId] = filteredUsers
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
    })
    return buckets
  }, [users, searchTermByPoll, currentUserBatch])

  const voteForUser = async (pollId: string, userId: string) => {
    if (!user || !isCurrentBatch(currentUserBatch)) return
    const pollRef = doc(db, 'polls', pollId)
    await runTransaction(db, async (tx) => {
      const snapshot = await tx.get(pollRef)
      const pollData = snapshot.data() as Omit<Poll, 'id'> | undefined
      const options = pollData?.options ?? []
      const targetCandidate = usersById[userId]
      if (
        !targetCandidate ||
        targetCandidate.batch !== currentUserBatch ||
        !isCurrentBatch(currentUserBatch)
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
                          {!isCurrentBatch(batch) ? (
                            <p className="meta">Showing winner(s) only</p>
                          ) : null}
                          <div className="poll-options">
                            {(
                              isCurrentBatch(batch)
                                ? poll.options
                                : getWinningOptions(poll.options)
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
                          {isCurrentBatch(batch) ? (
                            <div className="batchmate-vote-shell">
                              {!isCurrentBatch(currentUserBatch) ? (
                                <p className="meta accent">
                                  Only {CURRENT_BATCH_LABEL} batchmates can vote here.
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
                                value={searchTermByPoll[poll.id] ?? ''}
                                onChange={(event) =>
                                  setSearchTermByPoll((prev) => ({
                                    ...prev,
                                    [poll.id]: event.target.value,
                                  }))
                                }
                                disabled={!isCurrentBatch(currentUserBatch)}
                              />
                              <div className="batchmate-grid">
                                {(filteredUsersByPoll[poll.id] ?? []).map((batchmate) => (
                                  <button
                                    key={batchmate.id}
                                    type="button"
                                    className={`tag-pill tag-suggestion ${
                                      userVote?.id === batchmate.id
                                        ? 'tag-selected'
                                        : ''
                                    }`}
                                    onClick={() => voteForUser(poll.id, batchmate.id)}
                                    disabled={!user || !isCurrentBatch(currentUserBatch)}
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
