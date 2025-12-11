import { useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import styles from './App.module.css'
import TrebleTrainer from './components/TrebleTrainer'
import GuitarTrainer from './components/GuitarTrainer'
import UkuleleTrainer from './components/UkuleleTrainer'

type ThemeMode = 'light' | 'dark' | 'high-contrast'

const THEME_STORAGE_KEY = 'musichook-theme'
const APP_VERSION = 'v0.1.0'

const themeLabels: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  'high-contrast': 'High Contrast',
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'high-contrast') {
      return stored
    }
  } catch {
    // Ignore storage failures
  }
  return 'light'
}

const themeOptions: ThemeMode[] = ['light', 'dark', 'high-contrast']

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage failures (e.g., private browsing or disabled storage)
    }
  }, [theme])

  const navLinks = useMemo(
    () => [
      { to: '/treble', label: 'Treble Trainer' },
      { to: '/guitar', label: 'Guitar Trainer' },
      { to: '/ukulele', label: 'Ukulele Trainer' },
    ],
    [],
  )

  return (
    <div className={styles.appShell}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.branding} role="banner">
          <h1 className={styles.title}>MusicHook</h1>
        </div>
        <nav aria-label="Primary" className={styles.nav}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? `${styles.navLink} ${styles.navLinkActive}`
                  : styles.navLink
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.themeControls}>
          <label htmlFor="theme-select" className={styles.themeLabel}>
            Theme
          </label>
          <select
            id="theme-select"
            className={styles.themeSelect}
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeMode)}
          >
            {themeOptions.map((value) => (
              <option value={value} key={value}>
                {themeLabels[value]}
              </option>
            ))}
          </select>
        </div>
      </header>
      <main id="main" className={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="/treble" replace />} />
          <Route path="/treble" element={<TrebleTrainer />} />
          <Route path="/guitar" element={<GuitarTrainer />} />
          <Route path="/ukulele" element={<UkuleleTrainer />} />
          <Route path="*" element={<Navigate to="/treble" replace />} />
        </Routes>
      </main>
      <footer className={styles.footer}>
        <p>Crafted for rapid music drills — {APP_VERSION}</p>
        <p>
          Source available in this workspace. Practice responsibly and keep your
          ears happy.
        </p>
      </footer>
    </div>
  )
}

export default App
