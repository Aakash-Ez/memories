import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/highlights', label: 'Highlights', protected: true },
  { to: '/upload-highlight', label: 'Upload highlight', protected: true },
  { to: '/profiles', label: 'Profiles', protected: true },
  { to: '/make-profile', label: 'Make my profile', protected: true },
  { to: '/write-testimonial', label: 'Write testimonial', protected: true },
  { to: '/polls', label: 'Polls', protected: true },
]

export function NavBar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const visibleItems = useMemo(
    () => navItems.filter((item) => !item.protected || user),
    [user]
  )

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
