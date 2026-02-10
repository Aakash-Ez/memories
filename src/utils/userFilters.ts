import type { FirestoreDoc, UserProfile } from '../types/firestore'

export function excludeServiceAccounts(
  users: FirestoreDoc<UserProfile>[] | undefined
): FirestoreDoc<UserProfile>[] {
  return (users ?? []).filter((user) => user.profileType !== 'ServiceAccount')
}
