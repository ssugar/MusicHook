/**
 * Utilities for scientific pitch notation with canonicalisation helpers and
 * mappings for staff placement and guitar fret positions.
 */

export type PitchClass =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'D#'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'Gb'
  | 'G'
  | 'G#'
  | 'Ab'
  | 'A'
  | 'A#'
  | 'Bb'
  | 'B'

export type Note = {
  name: PitchClass
  octave: number
}

export type GuitarPosition = { string: 1 | 2 | 3 | 4 | 5 | 6; fret: number }

const PITCH_TO_SEMITONE: Record<PitchClass, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

const CANONICAL_SHARPS: Record<number, PitchClass> = {
  0: 'C',
  1: 'C#',
  2: 'D',
  3: 'D#',
  4: 'E',
  5: 'F',
  6: 'F#',
  7: 'G',
  8: 'G#',
  9: 'A',
  10: 'A#',
  11: 'B',
}

const LETTER_FOR_PITCH: Record<PitchClass, NoteLetter> = {
  C: 'C',
  'C#': 'C',
  Db: 'D',
  D: 'D',
  'D#': 'D',
  Eb: 'E',
  E: 'E',
  F: 'F',
  'F#': 'F',
  Gb: 'G',
  G: 'G',
  'G#': 'G',
  Ab: 'A',
  A: 'A',
  'A#': 'A',
  Bb: 'B',
  B: 'B',
}

type NoteLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

const LETTER_INDEX: Record<NoteLetter, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

const REFERENCE_TREBLE_NOTE: Note = { name: 'E', octave: 4 }

export const GUITAR_TUNING: Record<GuitarPosition['string'], Note> = {
  1: { name: 'E', octave: 4 },
  2: { name: 'B', octave: 3 },
  3: { name: 'G', octave: 3 },
  4: { name: 'D', octave: 3 },
  5: { name: 'A', octave: 2 },
  6: { name: 'E', octave: 2 },
}

const TREBLE_MIN = { name: 'C', octave: 4 } satisfies Note
const TREBLE_MAX = { name: 'B', octave: 5 } satisfies Note

/**
 * Returns the MIDI number for a given note using C0 = MIDI 12.
 */
export function toMidi(note: Note): number {
  const semitone = PITCH_TO_SEMITONE[note.name]
  return (note.octave + 1) * 12 + semitone
}

/**
 * Normalises enharmonic spellings so that sharps are preferred over flats.
 */
export function toCanonical(note: Note): Note {
  const semitone = PITCH_TO_SEMITONE[note.name]
  const canonicalName = CANONICAL_SHARPS[semitone]
  // Adjust octave when moving from B# to C etc., although this POC avoids such inputs.
  const midi = toMidi(note)
  const octave = Math.floor(midi / 12) - 1
  return {
    name: canonicalName,
    octave,
  }
}

/**
 * Checks enharmonic equality between two notes.
 */
export function equalPitch(a: Note, b: Note): boolean {
  return toMidi(a) === toMidi(b)
}

/**
 * Computes the staff-relative Y position (in staff steps) for a treble clef.
 * The reference line is E4, which is step 0. Each diatonic step (line or space)
 * increments by one. Positive values move upward on the staff.
 */
export function trebleYPosition(note: Note): number {
  const letter = LETTER_FOR_PITCH[note.name]
  const diatonicIndex = note.octave * 7 + LETTER_INDEX[letter]
  const referenceLetter = LETTER_FOR_PITCH[REFERENCE_TREBLE_NOTE.name]
  const referenceIndex =
    REFERENCE_TREBLE_NOTE.octave * 7 + LETTER_INDEX[referenceLetter]
  return diatonicIndex - referenceIndex
}

/**
 * Standard-tuned guitar (E2–E4) fretboard mapping for notes up to fret 12.
 */
export function guitarPositions(note: Note): GuitarPosition[] {
  const midi = toMidi(note)
  const positions: GuitarPosition[] = []
  for (const stringKey of Object.keys(GUITAR_TUNING)) {
    const numericString = Number.parseInt(stringKey, 10) as GuitarPosition['string']
    const openMidi = toMidi(GUITAR_TUNING[numericString])
    const fret = midi - openMidi
    if (fret >= 0 && fret <= 12) {
      positions.push({ string: numericString, fret })
    }
  }
  return positions.sort((a, b) =>
    a.string === b.string ? a.fret - b.fret : a.string - b.string,
  )
}

/**
 * Generates an inclusive range of notes ordered bottom -> top.
 */
export function generateRange(start: Note, end: Note): Note[] {
  const result: Note[] = []
  let currentMidi = toMidi(start)
  const endMidi = toMidi(end)
  while (currentMidi <= endMidi) {
    const octave = Math.floor(currentMidi / 12) - 1
    const semitone = ((currentMidi % 12) + 12) % 12
    result.push({ name: CANONICAL_SHARPS[semitone], octave })
    currentMidi += 1
  }
  return result
}

/**
 * All notes within the treble trainer scope (C4–B5) with sharps preferred.
 */
export const TREBLE_SCOPE_NOTES = generateRange(TREBLE_MIN, TREBLE_MAX)

/**
 * Complete set of notes playable on a standard guitar within 0–12 frets.
 */
export const GUITAR_SCOPE_NOTES = (() => {
  const set = new Map<number, Note>()
  for (const stringKey of Object.keys(GUITAR_TUNING)) {
    const numericString = Number.parseInt(stringKey, 10) as GuitarPosition['string']
    const open = toMidi(GUITAR_TUNING[numericString])
    for (let fret = 0; fret <= 12; fret += 1) {
      const midi = open + fret
      if (!set.has(midi)) {
        const octave = Math.floor(midi / 12) - 1
        const semitone = midi % 12
        set.set(midi, { name: CANONICAL_SHARPS[semitone], octave })
      }
    }
  }
  return Array.from(set.values()).sort((a, b) => toMidi(a) - toMidi(b))
})()

export const NOTE_NAME_OPTIONS: PitchClass[] = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
]

export const NATURAL_PITCH_CLASSES: PitchClass[] = [
  'C',
  'D',
  'E',
  'F',
  'G',
  'A',
  'B',
]

export const TREBLE_SCOPE_C_MAJOR_NOTES = TREBLE_SCOPE_NOTES.filter((note) =>
  NATURAL_PITCH_CLASSES.includes(note.name),
)

export const TREBLE_OCTAVE_OPTIONS = Array.from(
  new Set(TREBLE_SCOPE_NOTES.map((note) => note.octave)),
).sort((a, b) => a - b)

/**
 * String representation such as "F#4".
 */
export function formatNote(note: Note): string {
  return `${note.name}${note.octave}`
}

/**
 * Parses a note string in scientific pitch notation (e.g. "F#4").
 */
export function parseNote(input: string): Note | null {
  const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(input.trim())
  if (!match) {
    return null
  }
  const [, name, octaveRaw] = match
  if (!isPitchClass(name)) {
    return null
  }
  const octave = Number.parseInt(octaveRaw, 10)
  return { name, octave }
}

function isPitchClass(value: string): value is PitchClass {
  return (NOTE_NAME_OPTIONS as string[]).includes(value)
}

/**
 * Returns an alternate enharmonic spelling using flats where applicable.
 */
export function toEnharmonicFlat(note: Note): Note {
  const midi = toMidi(note)
  const semitone = ((midi % 12) + 12) % 12
  const flatNames: Record<number, PitchClass> = {
    0: 'C',
    1: 'Db',
    2: 'D',
    3: 'Eb',
    4: 'E',
    5: 'F',
    6: 'Gb',
    7: 'G',
    8: 'Ab',
    9: 'A',
    10: 'Bb',
    11: 'B',
  }
  return {
    name: flatNames[semitone],
    octave: Math.floor(midi / 12) - 1,
  }
}

export function noteAtGuitarPosition(position: GuitarPosition): Note {
  const tuning = GUITAR_TUNING[position.string]
  const midi = toMidi(tuning) + position.fret
  const semitone = midi % 12
  return {
    name: CANONICAL_SHARPS[semitone],
    octave: Math.floor(midi / 12) - 1,
  }
}

export function guitarPositionsForPitchClass(pitch: PitchClass): GuitarPosition[] {
  const canonicalName = CANONICAL_SHARPS[PITCH_TO_SEMITONE[pitch]]
  const positions: GuitarPosition[] = []
  for (const stringKey of Object.keys(GUITAR_TUNING)) {
    const numericString = Number.parseInt(stringKey, 10) as GuitarPosition['string']
    for (let fret = 0; fret <= 12; fret += 1) {
      const noteName = toCanonical(
        noteAtGuitarPosition({ string: numericString, fret }),
      ).name
      if (noteName === canonicalName) {
        positions.push({ string: numericString, fret })
      }
    }
  }
  return positions.sort((a, b) =>
    a.string === b.string ? a.fret - b.fret : a.string - b.string,
  )
}
