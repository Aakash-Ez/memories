import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ProfileDetail } from './ProfileDetail'

const heroImages = [
  '/som/20250322_100528.jpg',
  '/som/som1.jpg',
  '/som/som2.jpg',
  '/som/som3.jpg',
  '/som/WhatsApp Image 2025-02-06 at 12.18.55 PM.jpeg',
  '/som/WhatsApp Image 2025-02-06 at 2.40.22 PM.jpeg',
  '/som/WhatsApp Image 2025-04-28 at 4.11.43 PM.jpeg',
]

export function Home() {
  const { user } = useAuth()
  const heroSlides = useMemo(() => [...heroImages, ...heroImages], [])

  if (user) {
    return <ProfileDetail userId={user.uid} />
  }

  return (
    <div className="page home-page">
      <header className="home-hero">
        <div className="home-hero-content">
          <div>
            <p className="hero-kicker">SJMSOM Memories Portal</p>
            <h1>Relive the moments, celebrate the people.</h1>
            <p className="hero-subtitle">
              A living memories portal curated by the Cultural Council, designed to capture stories,
              milestones, and the spirit of SJMSOM across every batch.
            </p>
            <div className="hero-panel hero-panel-compact">
              <div className="hero-chip">Highlights - Polls - Forum</div>
              <p>
                Built for current students to add their stories and for alumni to reminisce on the
                moments that shaped them.
              </p>
            </div>
          </div>
          <div className="hero-badges">
            <span>Highlights</span>
            <span>Profiles</span>
            <span>Polls</span>
            <span>Forum</span>
          </div>
        </div>
        <div className="hero-carousel">
          <div className="carousel-track">
            {heroSlides.map((image, index) => (
              <div key={`${image}-${index}`} className="carousel-slide">
                <img src={image} alt="SJMSOM memory" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="home-access">
        <div className="home-access-content">
          <p className="hero-kicker accent">Access</p>
          <h2>Sign in to contribute your batch's story.</h2>
          <p className="hero-subtitle">
            Use your SJMSOM email to add highlights, react to testimonials, and keep the Cultural
            Council's memories fresh.
          </p>
          <div className="access-grid">
            <div>
              <strong>Highlight wall</strong>
              <span>Upload, tag, and celebrate every capture.</span>
            </div>
            <div>
              <strong>Profiles</strong>
              <span>Share your favorite spot, theme song, and life lessons.</span>
            </div>
            <div>
              <strong>Community</strong>
              <span>Engage with polls, reactions, and updates.</span>
            </div>
          </div>
          <Link to="/login" className="btn-primary hero-cta">
            Access the memories
          </Link>
        </div>
      </section>
    </div>
  )
}
