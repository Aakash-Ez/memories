import type { ReactNode } from 'react'
import { NavBar } from './NavBar'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <div>
          <span>SJMSOM Memories Portal</span>
          <span className="footer-dot">•</span>
          <span>Cultural Council</span>
        </div>
        <span className="footer-note">Memories 2025</span>
      </footer>
    </div>
  )
}
