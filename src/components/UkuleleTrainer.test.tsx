import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import UkuleleTrainer from './UkuleleTrainer'
import {
  ukulelePositionsForPitchClass,
  type PitchClass,
  type UkulelePosition,
} from '../utils/noteUtils'

const TEST_SEED = 3110

function getTargetPitch(): PitchClass {
  const [label] = screen.getAllByText(/Find:/i)
  const match = /Find:\s+([A-G](?:#|b)?)/i.exec(label.textContent ?? '')
  if (!match) {
    throw new Error('Unable to parse target note')
  }
  return match[1] as PitchClass
}

function labelFor(position: UkulelePosition): string {
  return position.fret === 0
    ? `String ${position.string}, open`
    : `String ${position.string}, fret ${position.fret}`
}

function getRequiredPosition(): {
  pitch: PitchClass
  position: UkulelePosition
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
      string: (Number.isFinite(stringValue) ? stringValue : 1) as UkulelePosition['string'],
      fret: Number.isFinite(fretValue) ? fretValue : 0,
    },
  }
}

describe('UkuleleTrainer', () => {
  afterEach(() => {
    cleanup()
  })

  it('accepts the selected correct position', async () => {
    render(<UkuleleTrainer seed={TEST_SEED} />)
    const target = getTargetPitch()
    await waitFor(() => {
      expect(screen.getAllByText(/Find:/i)[0].textContent).toContain(target)
    })

    const positions = ukulelePositionsForPitchClass(target)
    const expected = positions[0]
    await userEvent.click(screen.getByLabelText(labelFor(expected)))

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

  it('enforces string-specific targeting in hard mode', async () => {
    render(<UkuleleTrainer seed={TEST_SEED + 1} />)
    await userEvent.click(screen.getByLabelText(/Hard mode/i))

    const { pitch, position: requiredPosition } = getRequiredPosition()
    const positions = ukulelePositionsForPitchClass(pitch)
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
})
