import type { FieldValue } from 'firebase/firestore'

export type FirestoreDoc<T = Record<string, unknown>> = T & { id: string }

export type UserProfile = {
  name: string
  nickname?: string
  batch?: string
  email?: string
  photoURL?: string
  favoriteSpot?: string
  favoriteSubject?: string
  bestMemory?: string
  lifeLesson?: string
  mbaLifeEmojis?: string
  mbaLifeMiss?: string
  mbaLifeThemeSong?: string
  rollNumber?: string
  hostelRoom?: string
  mobile?: string
  hobby?: string
  famousFor?: string
  comfortZone?: string
  memorableMoment?: string
  favoriteSession?: string
  lifeWord?: string
  bollywoodTitle?: string
  ImportantHighlights?: string[] | FieldValue
  createdAt?: string
  KeyQA?: Record<string, { Name: string; Key: number }>
  currentCompany?: string
  currentRole?: string
  interestAreas?: string[]
  linkedinURL?: string
  role?: 'developer' | 'admin'
  profileType?: string
}

export type Highlight = {
  caption: string
  image?: string
  directlink?: string
  tags: string[]
  timestamp?: string | FieldValue
  batch?: string
  userId: string
}

export type Testimonial = {
  testimonial: string
  writer: string
  receiver: string
  timestamp?: unknown
  approved?: boolean
  show?: boolean
  rank?: number
  reactions?: Record<string, string>
  batch?: string
}

export type DisappearingMessage = {
  message: string
  sender: string
  receiver: string
  timestamp?: unknown
  expiryTime?: unknown
  public?: boolean
  userId?: string
}

export type PollOption = {
  id: string
  name: string
  photoURL?: string
  votes: number
  voters?: string[]
}

export type Poll = {
  question: string
  created_at?: unknown
  deadline?: unknown
  options: PollOption[]
  batch?: string
}

export type ForumMessage = {
  message: string
  sender: string
  userId?: string
  userName?: string
  userPhoto?: string
  timestamp?: unknown
}

export type JobPosting = {
  jobTitle: string
  company: string
  workExperience: string
  domain: string
  jobDescription: string
  location?: string
  postedAt?: unknown
  createdAt?: unknown
  closingDate?: unknown
}

export type JobApplication = {
  jobId: string
  jobTitle: string
  applicantId: string
  applicantName?: string | null
  applicantEmail?: string | null
  resumeUrl: string
  message?: string
  appliedAt?: unknown
}

export type BlogPost = {
  title: string
  body: string
  authorId: string
  authorName: string
  category: string
  createdAt?: unknown
}
