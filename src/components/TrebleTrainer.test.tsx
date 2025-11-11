import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import TrebleTrainer from './TrebleTrainer'

function readTargetLetter() {
  const staffFigure = screen.getByRole('img', {
    name: /Treble staff showing/i,
  })
  const match = /Treble staff showing ([A-G])(\d)/i.exec(
    staffFigure.getAttribute('aria-label') ?? '',
  )
  if (!match) {
    throw new Error('Unable to parse target note')
  }
  return match[1].toUpperCase()
}

afterEach(() => {
  cleanup()
})

describe('TrebleTrainer', () => {
  it('accepts a correct answer from the choices', async () => {
    render(<TrebleTrainer />)
    const targetLetter = readTargetLetter()
    const optionsRegion = screen.getByRole('list')
    const correctButton = within(optionsRegion).getByRole('button', {
      name: targetLetter,
    })
    await userEvent.click(correctButton)
    expect(
      await screen.findByText(/Correct!/i, { exact: false }),
    ).toBeInTheDocument()
  })

  it('prompts retry after an incorrect choice', async () => {
    render(<TrebleTrainer />)
    const targetLetter = readTargetLetter()
    const optionsRegion = screen.getByRole('list')
    const choiceButtons = within(optionsRegion).getAllByRole('button')
    const incorrectButton = choiceButtons.find(
      (button) => button.textContent !== targetLetter,
    )
    if (!incorrectButton) {
      throw new Error('Unable to find incorrect choice for test')
    }
    await userEvent.click(incorrectButton)
    expect(
      await screen.findByText(/Try again!/i, { exact: false }),
    ).toBeInTheDocument()
  })
})
