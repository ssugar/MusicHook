import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./context/AuthContext', () => {
  const mockAuth = {
    user: { uid: 'test-user', email: 'test@example.com' },
    initializing: false,
    signIn: vi.fn(),
    register: vi.fn(),
    signOut: vi.fn(),
  }
  return {
    useAuth: () => mockAuth,
  }
})

vi.mock('./hooks/useTrainerProgress', () => ({
  useTrainerProgress: () => ({
    progress: {
      totalAttempts: 0,
      totalCorrect: 0,
      bestStreak: 0,
      lastUpdated: null,
    },
    loading: false,
    error: null,
    recordResult: vi.fn(),
  }),
}))

describe('App routing', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders treble trainer by default and navigates to other trainers', async () => {
    render(
      <MemoryRouter initialEntries={['/treble']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { name: /Treble Clef Trainer/i }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Guitar Trainer/i }))
    expect(
      await screen.findByRole('heading', { name: /Guitar Fretboard Trainer/i }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Ukulele Trainer/i }))
    expect(
      await screen.findByRole('heading', { name: /Ukulele Fretboard Trainer/i }),
    ).toBeInTheDocument()
  })

  it('supports keyboard focus for skip link then navigation', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/treble']}>
        <App />
      </MemoryRouter>,
    )
    await user.tab()
    expect(screen.getAllByText(/Skip to content/i)[0]).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: /Treble Trainer/i })).toHaveFocus()
  })
})
