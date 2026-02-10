import type { FirestoreDoc, JobPosting } from '../types/firestore'

export const sampleJobPostings: FirestoreDoc<JobPosting>[] = [
  {
    id: 'sample-1',
    jobTitle: 'Associate Product Manager',
    company: 'Sathya Labs',
    workExperience: '0-2 years',
    domain: 'Fintech',
    jobDescription:
      'Join the product team to help build India’s most trusted campus investment insights platform.',
    location: 'Mumbai / Hybrid',
    postedAt: '2025-12-01T00:00:00Z',
    createdAt: '2025-12-01T00:00:00Z',
    closingDate: '2026-04-01T23:59:59Z',
  },
  {
    id: 'sample-2',
    jobTitle: 'Client Success Analyst',
    company: 'Lumena Learning',
    workExperience: '2-4 years',
    domain: 'EdTech',
    jobDescription:
      'Own the onboarding of new B2B customers, translate product value, and help faculty adopt the digital classroom toolkit.',
    location: 'Bengaluru / Remote',
    postedAt: '2026-01-10T00:00:00Z',
    createdAt: '2026-01-10T00:00:00Z',
    closingDate: '2026-04-15T23:59:59Z',
  },
  {
    id: 'sample-3',
    jobTitle: 'Growth Strategist',
    company: 'Monarch Media',
    workExperience: '3-5 years',
    domain: 'Media & Storytelling',
    jobDescription:
      'Lead audience experiments across social and web, craft hypotheses for virality, and collaborate with the creative studio.',
    location: 'Mumbai / Hybrid',
    postedAt: '2026-01-20T00:00:00Z',
    createdAt: '2026-01-20T00:00:00Z',
    closingDate: '2026-03-31T23:59:59Z',
  },
]
