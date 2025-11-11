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

        <path className={styles.clef} d={buildTrebleClefPath(CLEF_X)} />

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

        <ellipse
          cx={NOTE_X}
          cy={yPosition}
          rx={10}
          ry={7.6}
          className={styles.noteHead}
          transform={`rotate(-18 ${NOTE_X} ${yPosition})`}
        />
      </svg>
    </figure>
  )
})

Staff.displayName = 'Staff'

function buildTrebleClefPath(centerX: number): string {
  const x = centerX
  const upperAnchor = MARGIN_Y - 36
  const lowerLoop = MARGIN_Y + 58
  const tailStart = MARGIN_Y + 108
  const tailEnd = MARGIN_Y + 164

  return [
    `M ${x - 10} ${upperAnchor}`,
    `C ${x - 62} ${upperAnchor - 60}, ${x + 52} ${upperAnchor - 70}, ${x + 22} ${
      MARGIN_Y - 4
    }`,
    `C ${x - 6} ${MARGIN_Y + 32}, ${x - 56} ${MARGIN_Y + 10}, ${x - 42} ${
      MARGIN_Y + 60
    }`,
    `C ${x - 26} ${MARGIN_Y + 122}, ${x + 44} ${MARGIN_Y + 126}, ${x + 36} ${
      lowerLoop
    }`,
    `C ${x + 30} ${MARGIN_Y + 6}, ${x - 20} ${MARGIN_Y + 2}, ${x - 22} ${
      MARGIN_Y + 52
    }`,
    `C ${x - 24} ${MARGIN_Y + 98}, ${x + 28} ${MARGIN_Y + 104}, ${x + 26} ${
      MARGIN_Y + 52
    }`,
    `C ${x + 24} ${MARGIN_Y + 16}, ${x - 6} ${MARGIN_Y + 14}, ${x - 8} ${
      MARGIN_Y + 44
    }`,
    `C ${x - 10} ${MARGIN_Y + 74}, ${x + 24} ${MARGIN_Y + 76}, ${x + 24} ${
      MARGIN_Y + 44
    }`,
    `C ${x + 24} ${MARGIN_Y + 12}, ${x - 28} ${MARGIN_Y + 16}, ${x - 28} ${
      MARGIN_Y + 70
    }`,
    `C ${x - 28} ${tailStart + 40}, ${x + 40} ${tailStart + 40}, ${x + 38} ${
      tailStart - 6
    }`,
    `C ${x + 36} ${tailStart - 60}, ${x - 12} ${tailStart - 66}, ${x - 12} ${
      tailStart - 18
    }`,
    `C ${x - 12} ${tailStart + 32}, ${x + 34} ${tailStart + 30}, ${x + 34} ${
      tailStart - 12
    }`,
    `C ${x + 34} ${tailStart - 48}, ${x + 6} ${tailStart - 48}, ${x + 4} ${
      tailStart - 18
    }`,
    `C ${x + 2} ${tailStart + 20}, ${x + 40} ${tailStart + 20}, ${x + 40} ${
      tailStart - 22
    }`,
    `C ${x + 40} ${tailStart - 56}, ${x + 14} ${tailStart - 58}, ${x + 12} ${
      tailStart - 34
    }`,
    `C ${x + 10} ${tailStart - 2}, ${x + 46} ${tailStart + 2}, ${x + 46} ${
      tailEnd - 36
    }`,
    `C ${x + 46} ${tailEnd - 74}, ${x + 12} ${tailEnd - 78}, ${x + 12} ${
      tailEnd - 42
    }`,
    `C ${x + 12} ${tailEnd - 6}, ${x + 48} ${tailEnd - 6}, ${x + 48} ${
      tailEnd - 40
    }`,
  ].join(' ')
}

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
