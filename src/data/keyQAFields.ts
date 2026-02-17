export type KeyQAField = {
  label: string
  name: string
  key: number
  placeholder?: string
  type?: 'text' | 'textarea'
  rows?: number
}

export const keyQAFieldsByBatch: Record<string, KeyQAField[]> = {
  SOM25: [
    {
      label: 'bestMemory',
      name: 'bestMemory',
      key: 0,
      placeholder: "Something you'll never forget",
      type: 'textarea',
      rows: 3,
    },
    {
      label: 'favorite spot',
      name: 'favoriteSpot',
      key: 1,
      placeholder: 'Where did you pass the time?',
    },
    {
      label: 'Favorite subject',
      name: 'favoriteSubject',
      key: 2,
      placeholder: 'What made you light up?',
    },
    {
      label: 'Theme song',
      name: 'mbaLifeThemeSong',
      key: 3,
      placeholder: 'Track that defines your MBA',
    },
    {
      label: 'Life lesson',
      name: 'lifeLesson',
      key: 4,
      placeholder: 'A nugget you carry forward',
      type: 'textarea',
      rows: 3,
    },
    {
      label: 'MBA life in emojis',
      name: 'mbaLifeEmojis',
      key: 5,
      placeholder: 'Use emoji shorthand',
    },
    {
      label: 'MBA life miss',
      name: 'mbaLifeMiss',
      key: 6,
      placeholder: 'What will you miss most?',
    },
  ],
  SOM26: [
    {
      label: "Your favorite spot on campus",
      name: 'favoriteSpot',
      key: 1,
      placeholder: 'Where do you pause on campus?',
    },
    {
      label: "A SOM memory you treasure",
      name: 'memorableMoment',
      key: 2,
      placeholder: 'A SOM memory you treasure',
      rows: 3,
    },
    {
      label: "If your personality was a bollywood movie title, what would it be?",
      name: 'bollywoodTitle',
      key: 3,
      placeholder: 'Give your journey a film name',
    },
    {
      label: "Describe your MBA life in one word",
      name: 'comfortZone',
      key: 4,
      placeholder: 'In one word',
    },
    {
      label: "If you were famous for one thing, what would it be?",
      name: 'famousFor',
      key: 5,
      placeholder: 'What would that be?',
    },
    {
      label: "A faculty / guest session you will never forget",
      name: 'favoriteSession',
      key: 6,
      placeholder: 'Faculty or guest session?',
    },
    {
      label: "What's your go-to hobby?",
      name: 'hobby',
      key: 7,
      placeholder: 'What keeps you busy outside classes?',
    },
    {
      label: "Hostel & room number",
      name: 'hostelRoom',
      key: 8,
      placeholder: 'Where do you crash at night?',
    },
    {
      label: "One word for your MBA life",
      name: 'lifeWord',
      key: 9,
      placeholder: 'Describe the vibe',
    },
    {
      label: "Mobile",
      name: 'mobile',
      key: 10,
      placeholder: 'Phone number',
    },
    {
      label: "Roll number",
      name: 'rollNumber',
      key: 11,
      placeholder: 'Official roll number',
    },
  ],
}

export const defaultKeyQAFields = keyQAFieldsByBatch.SOM25

export const keyQAMetadataByLabel: Record<string, KeyQAField> =
  Object.values(keyQAFieldsByBatch).flat().reduce<Record<string, KeyQAField>>(
    (acc, field) => {
      acc[field.label] = field
      return acc
    },
    {}
  )
