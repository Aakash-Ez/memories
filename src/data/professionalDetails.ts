export const PROFESSIONAL_INTEREST_AREAS = [
  'IT',
  'Marketing',
  'Supply Chain',
  'Operation',
  'Finance',
  'Consulting',
  'Others',
] as const

export type ProfessionalInterest = (typeof PROFESSIONAL_INTEREST_AREAS)[number]
