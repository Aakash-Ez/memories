export type EntitlementLevel = 'all' | 'current' | 'alum' | 'developer' | 'admin'

export const NAV_ENTITLEMENTS: Record<string, EntitlementLevel[]> = {
  '/': ['all'],
  '/blogs': ['developer', 'admin'],
  '/job-postings': ['developer', 'admin'],
  '/admin/downloads': ['admin'],
  '/highlights': ['all'],
  '/profiles': ['all'],
  '/make-profile': ['all'],
  '/polls': ['all'],
  '/write-testimonial': ['current'],
  '/upload-highlight': ['current'],
}
