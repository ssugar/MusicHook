import { memo, useMemo } from 'react'
import type { Note } from '../utils/noteUtils'
import { formatNote, trebleYPosition } from '../utils/noteUtils'
import styles from './Staff.module.css'

const STAFF_LINE_GAP = 16
const STEP_HEIGHT = STAFF_LINE_GAP / 2
const STAFF_LINES = 5
const VIEWBOX_WIDTH = 240
const VIEWBOX_HEIGHT = 200
const MARGIN_Y = 48
const NOTE_X = 150
const CLEF_X = 54
const CLEF_Y =
  MARGIN_Y + (STAFF_LINE_GAP * (STAFF_LINES - 1)) / 2 /* staff vertical midpoint */
const TREBLE_CLEF_GLYPH = String.fromCodePoint(0x1d11e)

type StaffProps = {
  note: Note
  'aria-label'?: string
}

const Staff = memo(({ note, 'aria-label': ariaLabel }: StaffProps) => {
  const { yPosition, ledgerLines, accidental } = useMemo(() => {
    const steps = trebleYPosition(note)
    const bottomLine =
      MARGIN_Y + STAFF_LINE_GAP * (STAFF_LINES - 1) /* lines counted from bottom */
    const y = bottomLine - steps * STEP_HEIGHT

    const bottomLedger: number[] = []
    if (steps <= -1) {
      for (let step = -2; step >= steps - 1; step -= 2) {
        bottomLedger.push(step)
      }
    }
    const topLedger: number[] = []
    if (steps >= 9) {
      for (let step = 10; step <= steps + 1; step += 2) {
        topLedger.push(step)
      }
    }
    const ledger = [...bottomLedger, ...topLedger]
    let accidentalType: 'sharp' | 'flat' | null = null
    if (note.name.includes('#')) accidentalType = 'sharp'
    if (note.name.includes('b')) accidentalType = 'flat'
    return {
      yPosition: y,
      ledgerLines: ledger,
      accidental: accidentalType,
    }
  }, [note])

  return (
    <figure
      className={styles.staff}
      role="img"
      aria-label={ariaLabel ?? `Treble staff showing ${formatNote(note)}`}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className={styles.svg}
      >
        {Array.from({ length: STAFF_LINES }, (_, index) => {
          const y = MARGIN_Y + index * STAFF_LINE_GAP
          return (
            <line
              key={index}
              x1={32}
              y1={y}
              x2={VIEWBOX_WIDTH - 32}
              y2={y}
              className={styles.staffLine}
            />
          )
        })}

        <text
          className={styles.clef}
          x={CLEF_X}
          y={CLEF_Y}
          textAnchor="middle"
          dominantBaseline="middle"
          aria-hidden="true"
        >
          {TREBLE_CLEF_GLYPH}
        </text>

        {ledgerLines.map((step) => {
          const bottomLine =
            MARGIN_Y + STAFF_LINE_GAP * (STAFF_LINES - 1)
          const y = bottomLine - step * STEP_HEIGHT
          return (
            <line
              key={`ledger-${step}`}
              x1={NOTE_X - 26}
              y1={y}
              x2={NOTE_X + 26}
              y2={y}
              className={styles.ledger}
            />
          )
        })}

        {accidental ? (
          <Accidental type={accidental} y={yPosition} />
        ) : null}

        <circle
          cx={NOTE_X}
          cy={yPosition}
          r={10}
          className={styles.noteHead}
        />
      </svg>
    </figure>
  )
})

Staff.displayName = 'Staff'

type AccidentalProps = {
  type: 'sharp' | 'flat'
  y: number
}

const Accidental = ({ type, y }: AccidentalProps) => {
  const offsetY = y - 18
  if (type === 'flat') {
    return (
      <path
        d={`M ${NOTE_X - 40} ${offsetY} v 44 c 8 -10 24 -10 24 4
          c 0 14 -16 18 -24 10 z`}
        className={styles.accidental}
        aria-hidden="true"
      />
    )
  }
  return (
    <path
      d={`M ${NOTE_X - 44} ${offsetY} v 48 m 8 -48 v 48
        m -16 12 l 32 -8 m -32 -16 l 32 -8`}
      className={styles.accidental}
      aria-hidden="true"
    />
  )
}

export default Staff
