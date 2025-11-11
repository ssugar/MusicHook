import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import GuitarTrainer from './GuitarTrainer'
import {
  guitarPositionsForPitchClass,
  type GuitarPosition,
  type PitchClass,
} from '../utils/noteUtils'
const TEST_SEED = 2024

function getTargetPitch(): PitchClass {
  const [label] = screen.getAllByText(/Find:/i)
  const match = /Find:\s+([A-G](?:#|b)?)/i.exec(label.textContent ?? '')
  if (!match) {
    throw new Error('Unable to parse target note')
  }
  return match[1] as PitchClass
}

afterEach(() => {
  cleanup()
})

function labelFor(position: GuitarPosition): string {
  return position.fret === 0
    ? `String ${position.string}, open`
    : `String ${position.string}, fret ${position.fret}`
}

function getRequiredPosition(): {
  pitch: PitchClass
  position: GuitarPosition
} {
  const container = document.querySelector(
    '[data-required-position]',
  ) as HTMLElement
  const requiredData = container.dataset.requiredPosition ?? ''
  const [stringPart, fretPart] = requiredData.split('-')
  const stringValue = Number.parseInt(stringPart ?? '', 10)
  const fretValue = Number.parseInt(fretPart ?? '', 10)
  const pitch = container.dataset.pitch as PitchClass
  return {
    pitch,
    position: {
      string: (Number.isFinite(stringValue) ? stringValue : 1) as GuitarPosition['string'],
      fret: Number.isFinite(fretValue) ? fretValue : 0,
    },
  }
}

describe('GuitarTrainer', () => {
  it('accepts the selected correct position', async () => {
    render(<GuitarTrainer seed={TEST_SEED} />)
    const target = getTargetPitch()
    await waitFor(() => {
      expect(screen.getAllByText(/Find:/i)[0].textContent).toContain(target)
    })
    const positions = guitarPositionsForPitchClass(target)
    const expected = positions[0]
    const correctCell = screen.getByLabelText(labelFor(expected))

    await userEvent.click(correctCell)
    const selectionInfo = await screen.findByTestId('selection-info')
    expect(selectionInfo.textContent).toContain(
      expected.fret === 0
        ? `String ${expected.string}, open`
        : `String ${expected.string}, fret ${expected.fret}`,
    )
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() =>
      expect(screen.getByTestId('feedback').textContent).toContain('Correct!'),
    )
  })

  it('flags an incorrect fret selection', async () => {
    render(<GuitarTrainer seed={TEST_SEED + 1} />)
    const target = getTargetPitch()
    const positions = guitarPositionsForPitchClass(target)
    const reference = positions[0]
    const wrongFret =
      reference.fret === 12 ? reference.fret - 1 : reference.fret + 1

    const wrongCell = screen.getByLabelText(
      labelFor({ string: reference.string, fret: wrongFret }),
    )
    await userEvent.click(wrongCell)
    const selectionInfo = await screen.findByTestId('selection-info')
    expect(selectionInfo.textContent).toContain(
      wrongFret === 0
        ? `String ${reference.string}, open`
        : `String ${reference.string}, fret ${wrongFret}`,
    )
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(
      await screen.findByText(/Try again/i, { exact: false }),
    ).toBeInTheDocument()
  })

  it('reveals all valid positions in all-positions mode', async () => {
    render(<GuitarTrainer seed={TEST_SEED + 2} />)
    const target = getTargetPitch()
    const positions = guitarPositionsForPitchClass(target)
    const reference = positions[0]
    const wrongFret =
      reference.fret === 12 ? reference.fret - 1 : reference.fret + 1
    const wrongCell = screen.getByLabelText(
      labelFor({ string: reference.string, fret: wrongFret }),
    )
    await userEvent.click(wrongCell)
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    const highlighted = document.querySelectorAll('[data-highlighted="true"]')
    expect(highlighted.length).toBeGreaterThanOrEqual(positions.length)
    expect(
      await screen.findByText(/Valid positions/i, { exact: false }),
    ).toBeInTheDocument()
  })

  it('disables previously used positions for the same pitch', async () => {
    render(<GuitarTrainer seed={TEST_SEED + 3} />)
    const target = getTargetPitch()
    const positions = guitarPositionsForPitchClass(target)
    const expected = positions[0]
    const label = labelFor(expected)

    await userEvent.click(screen.getByLabelText(label))
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() =>
      expect(screen.getByTestId('feedback').textContent).toContain('Correct!'),
    )

    expect(screen.getByLabelText(label)).toHaveAttribute('data-disabled', 'true')

    expect(screen.getByTestId('selection-info').textContent).toContain('None')
  })

  it('enforces string-specific targeting in hard mode', async () => {
    render(<GuitarTrainer seed={TEST_SEED + 4} />)
    await userEvent.click(screen.getByLabelText(/Hard mode/i))

    const { pitch, position: requiredPosition } = getRequiredPosition()
    const positions = guitarPositionsForPitchClass(pitch)
    const alternate = positions.find(
      (position) => position.string !== requiredPosition.string,
    )

    if (alternate) {
      await userEvent.click(screen.getByLabelText(labelFor(alternate)))
      expect(screen.getByTestId('feedback').textContent).toMatch(/Hard mode/i)
      expect(screen.getByTestId('selection-info').textContent).toContain('None')
    }

    const requiredLabel = labelFor(requiredPosition)
    await userEvent.click(screen.getByLabelText(requiredLabel))
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() =>
      expect(screen.getByTestId('feedback').textContent).toMatch(/Correct!/i),
    )
  })

  it('accepts open string answers in hard mode', async () => {
    render(<GuitarTrainer seed={TEST_SEED + 5} />)
    await userEvent.click(screen.getByLabelText(/Hard mode/i))

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const { position } = getRequiredPosition()
      if (position.fret === 0) {
        const label = labelFor(position)
        await userEvent.click(screen.getByLabelText(label))
        await userEvent.click(screen.getByRole('button', { name: /submit/i }))
        await waitFor(() =>
          expect(screen.getByTestId('feedback').textContent).toMatch(/Correct!/i),
        )
        return
      }
      await userEvent.click(screen.getByRole('button', { name: /next/i }))
    }
    throw new Error('Did not encounter an open-string hard target within 20 attempts.')
  })
})
