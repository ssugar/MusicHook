import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import TrebleTrainer from './TrebleTrainer'

function parseTarget() {
  const [label] = screen.getAllByText(/Find:/i)
  const match = /Find:\s+([A-G](?:#|b)?)(\d)/i.exec(label.textContent ?? '')
  if (!match) {
    throw new Error('Unable to parse target note')
  }
  return { name: match[1], octave: Number.parseInt(match[2], 10) }
}

afterEach(() => {
  cleanup()
})

describe('TrebleTrainer', () => {
  it('accepts a correct answer via dropdowns', async () => {
    render(<TrebleTrainer />)
    const target = parseTarget()
    await userEvent.selectOptions(
      screen.getByLabelText(/Note name/i),
      target.name,
    )
    await userEvent.selectOptions(
      screen.getByLabelText(/Octave/i),
      String(target.octave),
    )
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(
      await screen.findByText(/Correct!/i, { exact: false }),
    ).toBeInTheDocument()
  })

  it('flags an incorrect octave', async () => {
    render(<TrebleTrainer />)
    const target = parseTarget()
    const otherOctave =
      target.octave === 4 ? target.octave + 1 : target.octave - 1
    await userEvent.selectOptions(
      screen.getByLabelText(/Note name/i),
      target.name,
    )
    await userEvent.selectOptions(
      screen.getByLabelText(/Octave/i),
      String(otherOctave),
    )
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(
      await screen.findByText(/Try again/i, { exact: false }),
    ).toBeInTheDocument()
  })
})
