export type MakeProfileField = {
  key: string
  label: string
  placeholder: string
  type?: 'text' | 'textarea'
  rows?: number
}

export const makeProfileFieldsByBatch: Record<string, MakeProfileField[]> = {
  SOM25: [
    { key: 'favoriteSpot', label: 'Favorite spot', placeholder: 'Where did you pass the time?' },
    { key: 'favoriteSubject', label: 'Favorite subject', placeholder: 'What made you light up?' },
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
  ],
  SOM26: [
    { key: 'favoriteSpot', label: 'Favorite spot', placeholder: 'Where do you pause in campus?' },
    { key: 'memorableMoment', label: 'Most memorable moment', placeholder: 'A SOM memory you treasure', type: 'textarea', rows: 3 },
    { key: 'bollywoodTitle', label: 'Your MBA life as a Bollywood title', placeholder: 'Give your journey a film name' },
    { key: 'comfortZone', label: 'Comfort zone', placeholder: 'In one word' },
    { key: 'famousFor', label: 'If you were famous for one thing', placeholder: 'What would that be?' },
    { key: 'favoriteSession', label: 'Favorite session', placeholder: 'Faculty or guest session?' },
    { key: 'hobby', label: 'Go-to hobby', placeholder: 'What keeps you busy outside classes?' },
    { key: 'hostelRoom', label: 'Hostel & room', placeholder: 'Where do you crash at night?' },
    { key: 'lifeWord', label: 'One word for your MBA life', placeholder: 'Describe the vibe' },
    { key: 'mobile', label: 'Mobile', placeholder: 'Phone number' },
    { key: 'rollNumber', label: 'Roll number', placeholder: 'Official roll number' },
  ],
}
