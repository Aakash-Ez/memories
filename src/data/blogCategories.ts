export const BLOG_CATEGORIES = [
  'Campus Life',
  'Club Updates',
  'Recruitment',
  'Academics',
  'Culture',
  'Leadership',
] as const

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]
