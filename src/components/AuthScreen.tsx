import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './AuthScreen.module.css'

const DEFAULT_MODE: AuthMode = 'signIn'

type AuthMode = 'signIn' | 'register'

const MODE_LABELS: Record<AuthMode, string> = {
  signIn: 'Sign In',
  register: 'Create Account',
}

const HINT_COPY: Record<AuthMode, string> = {
  signIn: 'Enter the email and password you created to resume your saved drills.',
  register:
    'Create a parent-managed email/password for each child. You can update or delete the account later from the Firebase Console.',
}

function AuthScreen() {
  const { signIn, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>(DEFAULT_MODE)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    setPending(true)
    try {
      if (mode === 'signIn') {
        await signIn(email.trim(), password)
      } else {
        await register(email.trim(), password)
      }
    } catch (authError) {
      if (authError instanceof Error) {
        setError(authError.message)
      } else {
        setError('Authentication failed. Please try again.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={styles.shell}>
      <section className={styles.panel} aria-live="polite">
        <h1 className={styles.title}>MusicHook</h1>
        <p className={styles.subtitle}>Sign in to sync practice progress</p>

        <div className={styles.modeToggle} role="tablist" aria-label="Auth mode">
          {/** Avoid buttons in buttons: use actual buttons for clarity */}
          <button
            type="button"
            className={mode === 'signIn' ? styles.modeButtonActive : styles.modeButton}
            aria-selected={mode === 'signIn'}
            role="tab"
            onClick={() => setMode('signIn')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === 'register' ? styles.modeButtonActive : styles.modeButton}
            aria-selected={mode === 'register'}
            role="tab"
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>
        <p className={styles.hint}>{HINT_COPY[mode]}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.fieldLabel} htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="child@example.com"
            disabled={pending}
            required
          />

          <label className={styles.fieldLabel} htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            minLength={6}
            disabled={pending}
            required
          />

          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}

          <button type="submit" className={styles.submitButton} disabled={pending}>
            {pending ? 'Working…' : MODE_LABELS[mode]}
          </button>
        </form>
      </section>
    </div>
  )
}

export default AuthScreen
