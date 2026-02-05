import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { useAuth } from '../context/AuthContext'
import { auth } from '../lib/firebase'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetNotice, setResetNotice] = useState<string | null>(null)

  const redirectTo =
    (location.state as { from?: string } | null)?.from || '/profiles'

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, navigate, redirectTo])

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unable to sign in right now.')
      }
    } finally {
      setLoading(false)
    }
  }

  const onForgotPassword = async () => {
    setError(null)
    setResetNotice(null)

    if (!email) {
      setError('Enter your email to receive a reset link.')
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setResetNotice('Password reset link sent. Check your inbox.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email right now.')
    }
  }

  return (
    <div className="page">
      <SectionHeader
        title="Welcome back"
        subtitle="Sign in with your SJMSOM email to access the memories."
        accent="Login"
      />

      <div className="login-columns">
        <article className="login-hero-card card-surface">
          <p className="hero-kicker accent">Access</p>
          <h2>Jump back into the memories.</h2>
          <p className="hero-subtitle">
            Create highlights, react to stories, and keep the Cultural Council's wall alive across
            batches.
          </p>
          <div className="hero-badges">
            <span>Highlights</span>
            <span>Profiles</span>
            <span>Polls</span>
            <span>Forum</span>
          </div>
        </article>

        <div className="auth-shell form-card auth-card-wide">
          <p className="hero-subtitle">
            Rejoin the memories with your SJMSOM email and password.
          </p>

          <form onSubmit={onSubmit} className="auth-form">
            <label className="auth-field">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="name@sjmsom.in"
              />
            </label>
            <label className="auth-field">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••••••"
              />
            </label>
            {error ? <p className="state-pill state-error">{error}</p> : null}
            {resetNotice ? <p className="state-pill">{resetNotice}</p> : null}
            <div className="auth-actions">
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <button type="button" className="btn-ghost" onClick={onForgotPassword} disabled={loading}>
                Forgot password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
