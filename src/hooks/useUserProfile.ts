import { useMemo } from 'react'
import { collection, query, where } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../lib/firebase'
import { useCollection } from './useCollection'
import type { FirestoreDoc, UserProfile } from '../types/firestore'

export function useUserProfile(user: User | null) {
  const normalizedEmail = user?.email?.trim().toLowerCase() ?? ''
  const profileQuery = useMemo(() => {
    if (!normalizedEmail) return null
    return query(
      collection(db, 'users'),
      where('email', '==', normalizedEmail)
    )
  }, [normalizedEmail])

  const { data = [] } = useCollection<FirestoreDoc<UserProfile>>(profileQuery)

  return data[0] ?? null
}
