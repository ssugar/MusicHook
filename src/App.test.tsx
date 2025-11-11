import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App routing', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders treble trainer by default and navigates to guitar trainer', async () => {
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
