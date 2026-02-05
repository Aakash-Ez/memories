import type { UserProfile } from '../types/firestore'

export type ProfileFieldKey =
  | 'favoriteSpot'
  | 'favoriteSubject'
  | 'bestMemory'
  | 'lifeLesson'
  | 'mbaLifeEmojis'
  | 'mbaLifeMiss'
  | 'mbaLifeThemeSong'

export type ProfileFieldDefinition = {
  key: ProfileFieldKey
  label: string
  placeholder: string
  type?: 'text' | 'textarea'
  rows?: number
}

export const profileFieldInputs: ProfileFieldDefinition[] = [
  {
    key: 'favoriteSpot',
    label: 'Favorite spot',
    placeholder: 'Where did you pass the time?',
  },
  {
    key: 'favoriteSubject',
    label: 'Favorite subject',
    placeholder: 'What made you light up?',
  },
  {
    key: 'bestMemory',
    label: 'Best memory',
    placeholder: "Something you'll never forget",
    type: 'textarea',
    rows: 3,
  },
  {
    key: 'lifeLesson',
    label: 'Life lesson',
    placeholder: 'A nugget you carry forward',
    type: 'textarea',
    rows: 3,
  },
  {
    key: 'mbaLifeEmojis',
    label: 'MBA life in emojis',
    placeholder: 'Use emoji shorthand',
  },
  {
    key: 'mbaLifeMiss',
    label: 'MBA life miss',
    placeholder: 'What will you miss most?',
  },
  {
    key: 'mbaLifeThemeSong',
    label: 'Theme song',
    placeholder: 'Track that defines your MBA',
  },
]

export type ProfileDisplayField = {
  key: ProfileFieldKey
  label: string
  icon?: string
}

export const profileDisplayFields: ProfileDisplayField[] = [
  { key: 'favoriteSpot', label: 'Favorite spot' },
  { key: 'favoriteSubject', label: 'Favorite subject' },
  { key: 'bestMemory', label: 'Best memory' },
  { key: 'lifeLesson', label: 'Life lesson' },
  { key: 'mbaLifeThemeSong', label: 'MBA theme song' },
  { key: 'mbaLifeEmojis', label: 'MBA in emojis' },
  { key: 'mbaLifeMiss', label: 'MBA life miss' },
]

export function selectProfileFields(
  profile: UserProfile | null
): Record<ProfileFieldKey, string> {
  if (!profile) {
    return Object.fromEntries(
      profileFieldInputs.map((field) => [field.key, ''])
    ) as Record<ProfileFieldKey, string>
  }
  return profileFieldInputs.reduce<Record<ProfileFieldKey, string>>(
    (acc, field) => {
      acc[field.key] = profile[field.key] || ''
      return acc
    },
    {} as Record<ProfileFieldKey, string>
  )
}
