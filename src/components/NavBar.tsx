import { collection, doc, query } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import type { FirestoreDoc, JobPosting, UserProfile } from '../types/firestore'
import { isLiveJob } from '../utils/jobPostings'
import { NAV_ENTITLEMENTS, type EntitlementLevel } from '../data/entitlements'
import { useDocument } from '../hooks/useDocument'
import { CURRENT_BATCH_LABEL } from '../data/batchStatus'

type NavItem = {
  to: string
  label: string
  protected?: boolean
}

const baseNavItems: Readonly<NavItem[]> = [
  { to: '/', label: 'Home' },
  { to: '/highlights', label: 'Highlights', protected: true },
  { to: '/upload-highlight', label: 'Upload highlight', protected: true },
  { to: '/blogs', label: 'Blogs', protected: true },
  { to: '/profiles', label: 'Profiles', protected: true },
  { to: '/make-profile', label: 'Make my profile', protected: true },
  { to: '/write-testimonial', label: 'Write testimonial', protected: true },
  { to: '/polls', label: 'Polls', protected: true },
  { to: '/job-postings', label: 'Job postings', protected: true },
]

const JOB_POSTINGS_NAV_PATH = '/job-postings'

export function NavBar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const profileRef = useMemo(
    () => (user ? doc(db, 'users', user.uid) : null),
    [user]
  )
  const { data: userProfile } = useDocument<FirestoreDoc<UserProfile>>(profileRef)
  const navItems = baseNavItems
  const userRoles = useMemo(() => {
    const roles = new Set<EntitlementLevel>(['all'])
    if (userProfile) {
      if (userProfile.batch) {
        roles.add(userProfile.batch === CURRENT_BATCH_LABEL ? 'current' : 'alum')
      }
      if (
        userProfile.role === 'developer' ||
        userProfile.role === 'admin'
      ) {
        roles.add(userProfile.role)
      }
    }
    return roles
  }, [userProfile])
  const visibleItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.protected && !user) return false
        const allowedLevels = NAV_ENTITLEMENTS[item.to] ?? ['all']
        return allowedLevels.some((level) => userRoles.has(level))
      }),
    [navItems, user, userRoles]
  )
  const jobPostingsQuery = useMemo(
    () => query(collection(db, 'JobPosting')),
    []
  )
  const { data: jobPostings = [] } = useCollection<FirestoreDoc<JobPosting>>(jobPostingsQuery)
  const liveJobCount = jobPostings.filter(isLiveJob).length

  return (
    <header className="nav-wrap">
      <div className="nav-brand">
        <div className="brand-mark">
          <img
            src="/cult-logo.png"
            alt="Cultural Council logo"
            className="brand-logo"
          />
        </div>
        <div>
          <p className="brand-title">Memories Portal</p>
          <p className="brand-subtitle">SJMSOM Cultural Council</p>
        </div>
      </div>

      <button
        type="button"
        className={`nav-toggle ${open ? 'nav-toggle-open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`${open ? 'Close' : 'Open'} navigation`}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`nav-links ${open ? 'nav-links-open' : ''}`}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
            onClick={() => setOpen(false)}
          >
            {item.label}
            {item.to === JOB_POSTINGS_NAV_PATH ? (
              <span className="nav-badge">{liveJobCount}</span>
            ) : null}
          </NavLink>
        ))}
        {user ? (
          <button
            className="nav-link nav-button"
            onClick={() => {
              setOpen(false)
              logout()
            }}
          >
            Sign out
          </button>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
            onClick={() => setOpen(false)}
          >
            Sign in
          </NavLink>
        )}
      </nav>
    </header>
  )
}
