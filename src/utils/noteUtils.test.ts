import { describe, expect, it } from 'vitest'
import {
  TREBLE_SCOPE_NOTES,
  equalPitch,
  formatNote,
  guitarPositions,
  guitarPositionsForPitchClass,
  noteAtGuitarPosition,
  toCanonical,
  trebleYPosition,
  type Note,
} from './noteUtils'

describe('noteUtils', () => {
  it('normalises enharmonics to sharp spelling', () => {
    const canonical = toCanonical({ name: 'Db', octave: 4 })
    expect(canonical).toEqual({ name: 'C#', octave: 4 })
  })

  it('detects enharmonic equality', () => {
    const cSharp: Note = { name: 'C#', octave: 4 }
    const dFlat: Note = { name: 'Db', octave: 4 }
    expect(equalPitch(cSharp, dFlat)).toBe(true)
  })

  it('computes treble staff Y positions relative to E4', () => {
    expect(trebleYPosition({ name: 'E', octave: 4 })).toBe(0)
    expect(trebleYPosition({ name: 'F', octave: 4 })).toBe(1)
    expect(trebleYPosition({ name: 'C', octave: 4 })).toBe(-2)
    expect(trebleYPosition({ name: 'B', octave: 5 })).toBe(11)
  })

  it('returns guitar positions within 0–12 frets', () => {
    const positions = guitarPositions({ name: 'E', octave: 4 })
    expect(positions).toEqual(
      expect.arrayContaining([{ string: 1, fret: 0 }]),
    )
    // E4 also exists at string 2 fret 5
    expect(positions).toEqual(
      expect.arrayContaining([{ string: 2, fret: 5 }]),
    )
  })

  it('provides note coverage for entire treble scope', () => {
    const labels = TREBLE_SCOPE_NOTES.map(formatNote)
    expect(labels[0]).toBe('C4')
    expect(labels.at(-1)).toBe('B5')
    expect(labels).toContain('F#5')
  })

  it('derives note value from guitar position', () => {
    const note = noteAtGuitarPosition({ string: 5, fret: 3 })
    expect(formatNote(note)).toBe('C3')
  })

  it('finds all guitar positions for a pitch class', () => {
    const positions = guitarPositionsForPitchClass('F#')
    expect(positions).toEqual(
      expect.arrayContaining([
        { string: 1, fret: 2 },
        { string: 2, fret: 7 },
        { string: 6, fret: 2 },
      ]),
    )
  })
})
