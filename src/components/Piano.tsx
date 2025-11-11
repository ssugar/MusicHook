import { useEffect, useMemo } from 'react'
import type { Note } from '../utils/noteUtils'
import {
  TREBLE_SCOPE_NOTES,
  equalPitch,
  formatNote,
} from '../utils/noteUtils'
import styles from './Piano.module.css'

const KEYBOARD_BINDINGS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
  '-',
  '=',
  'q',
  'w',
  'e',
  'r',
  't',
  'y',
  'u',
  'i',
  'o',
  'p',
  '[',
  ']',
]

type PianoProps = {
  activeNote?: Note
  onSelect: (note: Note) => void
}

type KeyDescriptor = {
  note: Note
  binding: string
  whiteIndex: number
  type: 'white' | 'black'
}

function buildKeys(): KeyDescriptor[] {
  let whiteIndex = 0
  return TREBLE_SCOPE_NOTES.map((note, index) => {
    const isSharp = note.name.includes('#')
    const descriptor: KeyDescriptor = {
      note,
      binding: KEYBOARD_BINDINGS[index] ?? '',
      whiteIndex: isSharp ? whiteIndex - 1 : whiteIndex,
      type: isSharp ? 'black' : 'white',
    }
    if (!isSharp) {
      whiteIndex += 1
    }
    return descriptor
  })
}

const DESCRIPTORS = buildKeys()

const Piano = ({ activeNote, onSelect }: PianoProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const descriptor = DESCRIPTORS.find(
        (entry) => entry.binding && entry.binding.toLowerCase() === key,
      )
      if (descriptor) {
        event.preventDefault()
        onSelect(descriptor.note)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSelect])

  const { whiteKeys, blackKeys, whiteCount } = useMemo(() => {
    const white = DESCRIPTORS.filter((descriptor) => descriptor.type === 'white')
    const black = DESCRIPTORS.filter((descriptor) => descriptor.type === 'black')
    return { whiteKeys: white, blackKeys: black, whiteCount: white.length }
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.whiteKeys}>
        {whiteKeys.map((descriptor) => (
          <button
            type="button"
            key={formatNote(descriptor.note)}
            className={
              activeNote && equalPitch(activeNote, descriptor.note)
                ? `${styles.key} ${styles.white} ${styles.active}`
                : `${styles.key} ${styles.white}`
            }
            onClick={() => onSelect(descriptor.note)}
            aria-label={`Select ${formatNote(descriptor.note)}${
              descriptor.binding
                ? ` (shortcut ${descriptor.binding.toUpperCase()})`
                : ''
            }`}
            aria-keyshortcuts={
              descriptor.binding
                ? descriptor.binding.toUpperCase()
                : undefined
            }
            data-shortcut={descriptor.binding.toUpperCase()}
          >
            <span className={styles.noteName}>{formatNote(descriptor.note)}</span>
            {descriptor.binding ? (
              <span className={styles.shortcut}>
                {descriptor.binding.toUpperCase()}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className={styles.blackKeys}>
        {blackKeys.map((descriptor) => {
          const percentWidth = 100 / whiteCount
          const left =
            percentWidth * (descriptor.whiteIndex + 1) -
            percentWidth * 0.35
          return (
            <button
              type="button"
              key={formatNote(descriptor.note)}
              className={
                activeNote && equalPitch(activeNote, descriptor.note)
                  ? `${styles.key} ${styles.black} ${styles.active}`
                  : `${styles.key} ${styles.black}`
              }
              style={{ left: `${left}%` }}
              onClick={() => onSelect(descriptor.note)}
              aria-label={`Select ${formatNote(descriptor.note)}${
                descriptor.binding
                  ? ` (shortcut ${descriptor.binding.toUpperCase()})`
                  : ''
              }`}
              aria-keyshortcuts={
                descriptor.binding
                  ? descriptor.binding.toUpperCase()
                  : undefined
              }
              data-shortcut={descriptor.binding.toUpperCase()}
            >
              <span className={styles.noteName}>
                {formatNote(descriptor.note)}
              </span>
              {descriptor.binding ? (
                <span className={styles.shortcut}>
                  {descriptor.binding.toUpperCase()}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Piano
