import { useEffect, useMemo, useState } from 'react'
import Controls from './Controls'
import Fretboard from './Fretboard'
import styles from './InstrumentTrainer.module.css'
import {
  UKULELE_SCOPE_NOTES,
  UKULELE_TUNING,
  ukulelePositionsForPitchClass,
  noteAtUkulelePosition,
  toCanonical,
  type Note,
  type PitchClass,
  type UkulelePosition,
} from '../utils/noteUtils'
import { useDrill, type DrillSubmissionResult } from '../hooks/useDrill'
import { useTrainerProgress } from '../hooks/useTrainerProgress'
import ProgressSummary from './ProgressSummary'

type FeedbackState =
  | { status: 'idle' }
  | { status: 'correct'; message: string }
  | { status: 'incorrect'; message: string }
  | { status: 'warn'; message: string }

type UkuleleTrainerProps = {
  seed?: number
}

type TrainerNote = Note & { requiredPosition?: UkulelePosition }
type UkuleleDrillResult = DrillSubmissionResult & {
  allUkulelePositions?: UkulelePosition[]
}

const DEFAULT_POSITION: UkulelePosition = { string: 4, fret: 0 }
const MAX_HISTORY = 4

const STRING_LABELS: Record<UkulelePosition['string'], string> = {
  1: 'A',
  2: 'E',
  3: 'C',
  4: 'G',
}

const EASY_POOL: TrainerNote[] = (() => {
  const unique = new Map<PitchClass, Note>()
  UKULELE_SCOPE_NOTES.forEach((note) => {
    const canonical = toCanonical(note)
    if (!unique.has(canonical.name)) {
      unique.set(canonical.name, canonical)
    }
  })
  return Array.from(unique.values())
})()

const HARD_POOL: TrainerNote[] = (() => {
  const entries: TrainerNote[] = []
  for (const stringKey of Object.keys(UKULELE_TUNING)) {
    const stringNumber = Number.parseInt(stringKey, 10) as UkulelePosition['string']
    const seen = new Set<PitchClass>()
    for (let fret = 0; fret <= 12; fret += 1) {
      const note = toCanonical(
        noteAtUkulelePosition({ string: stringNumber, fret }),
      )
      const pitch = note.name as PitchClass
      if (!seen.has(pitch)) {
        seen.add(pitch)
        entries.push({
          name: note.name,
          octave: note.octave,
          requiredPosition: { string: stringNumber, fret },
        })
      }
    }
  }
  return entries
})()

const UkuleleTrainer = ({ seed }: UkuleleTrainerProps = {}) => {
  const [selectedPosition, setSelectedPosition] =
    useState<UkulelePosition | null>(null)
  const [isHard, setIsHard] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ status: 'idle' })
  const [revealedPositions, setRevealedPositions] = useState<UkulelePosition[]>([])
  const [usedPositions, setUsedPositions] = useState<
    Record<PitchClass, UkulelePosition[]>
  >({} as Record<PitchClass, UkulelePosition[]>)

  const currentPool = isHard ? HARD_POOL : EASY_POOL
  const { progress, loading, error, recordResult } =
    useTrainerProgress('ukulele')

  const drill = useDrill<
    UkulelePosition,
    UkuleleDrillResult,
    TrainerNote
  >({
    pool: currentPool,
    seed,
    evaluate: (target, answer) => {
      const canonicalTarget = toCanonical(target)
      const requiredPosition = target.requiredPosition
      const positions = requiredPosition
        ? [requiredPosition]
        : ukulelePositionsForPitchClass(canonicalTarget.name as PitchClass)
      const correct = positions.some(
        (position) =>
          position.string === answer.string && position.fret === answer.fret,
      )
      return {
        correct,
        canonical: canonicalTarget,
        allUkulelePositions: positions,
      }
    },
  })

  const targetCanonical = useMemo(
    () => toCanonical(drill.targetNote),
    [drill.targetNote],
  )
  const requiredPosition = (drill.targetNote as TrainerNote).requiredPosition

  const disabledPositions = useMemo(
    () =>
      isHard
        ? []
        : usedPositions[targetCanonical.name as PitchClass] ?? [],
    [isHard, targetCanonical.name, usedPositions],
  )
  const disabledKeySet = useMemo(
    () =>
      new Set(
        disabledPositions.map((position) => positionKeyString(position)),
      ),
    [disabledPositions],
  )

  useEffect(() => {
    setSelectedPosition(null)
    setFeedback({ status: 'idle' })
    setRevealedPositions([])
  }, [targetCanonical])

  useEffect(() => {
    setUsedPositions({} as Record<PitchClass, UkulelePosition[]>)
    setSelectedPosition(null)
    setFeedback({ status: 'idle' })
    setRevealedPositions([])
    drill.nextTarget()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHard])

  const handleSelect = (position: UkulelePosition) => {
    if (
      isHard &&
      requiredPosition &&
      position.string !== requiredPosition.string
    ) {
      setFeedback({
        status: 'warn',
        message: `Hard mode: target is on the ${STRING_LABELS[requiredPosition.string]} string.`,
      })
      return
    }
    const key = positionKeyString(position)
    if (!isHard && disabledKeySet.has(key)) {
      setFeedback({
        status: 'warn',
        message: 'Already used that position for this note. Try another spot.',
      })
      return
    }
    setSelectedPosition(position)
  }

  const handleSubmit = () => {
    if (!selectedPosition) {
      setFeedback({
        status: 'warn',
        message: 'Select a string and fret before submitting.',
      })
      return
    }
    const chosenPosition = selectedPosition
    const result = drill.submitAnswer(selectedPosition)
    const predictedStreak = result.correct ? drill.streak + 1 : 0
    void recordResult({ correct: result.correct, streak: predictedStreak })

    setRevealedPositions(result.allUkulelePositions ?? [])

    if (result.correct && !isHard) {
      setFeedback({
        status: 'correct',
        message: `Correct! ${result.canonical.name}`,
      })
      setUsedPositions((previous) => {
        const key = result.canonical.name as PitchClass
        const existing = previous[key] ?? []
        if (
          existing.some(
            (position) =>
              position.string === chosenPosition.string &&
              position.fret === chosenPosition.fret,
          )
        ) {
          return previous
        }
        const updated = [...existing, chosenPosition]
        const trimmed =
          updated.length > MAX_HISTORY
            ? updated.slice(updated.length - MAX_HISTORY)
            : updated
        return {
          ...previous,
          [key]: trimmed,
        }
      })
      setSelectedPosition(null)
      return
    }

    if (result.correct) {
      setFeedback({
        status: 'correct',
        message: `Correct! ${result.canonical.name}${
          requiredPosition
            ? ` on the ${STRING_LABELS[requiredPosition.string]} string`
            : ''
        }`,
      })
      setSelectedPosition(null)
      return
    }

    const expectedDisplay = (result.allUkulelePositions ?? [])
      .map((position) => `S${position.string}/F${position.fret}`)
      .join(', ')
    setFeedback({
      status: 'incorrect',
      message: `Try again. Target ${result.canonical.name}. Valid positions: ${expectedDisplay}`,
    })
  }

  const handleNext = () => {
    drill.nextTarget()
    setSelectedPosition(null)
    setFeedback({ status: 'idle' })
    setRevealedPositions([])
  }

  const handleNavigate = (delta: { stringDelta: number; fretDelta: number }) => {
    setSelectedPosition((previous) => {
      const current = previous ?? DEFAULT_POSITION
      let nextString = current.string + delta.stringDelta
      let nextFret = current.fret + delta.fretDelta
      nextString = Math.max(1, Math.min(4, nextString))
      nextFret = Math.max(0, Math.min(12, nextFret))
      const candidate = {
        string: nextString as UkulelePosition['string'],
        fret: nextFret,
      }
      if (
        (!isHard && disabledKeySet.has(positionKeyString(candidate))) ||
        (isHard &&
          requiredPosition &&
          candidate.string !== requiredPosition.string)
      ) {
        setFeedback({
          status: 'warn',
          message: isHard
            ? `Hard mode: target is on the ${STRING_LABELS[requiredPosition!.string]} string.`
            : 'Already used that position for this note. Try another spot.',
        })
        return previous
      }
      return candidate
    })
  }

  const selectedNote = selectedPosition
    ? noteAtUkulelePosition(selectedPosition)
    : null

  const feedbackMessage =
    feedback.status === 'idle' ? 'Pick a position to begin.' : feedback.message

  return (
    <div
      className={styles.container}
      data-required-position={
        requiredPosition
          ? `${requiredPosition.string}-${requiredPosition.fret}`
          : ''
      }
      data-pitch={targetCanonical.name}
    >
      <div className={styles.sidebar}>
        <h2 className={styles.heading}>Ukulele Fretboard Trainer</h2>
        <p className={styles.targetLabel} id="ukulele-target">
          {requiredPosition
            ? `Find: ${targetCanonical.name} on the ${STRING_LABELS[requiredPosition.string]} string`
            : `Find: ${targetCanonical.name}`}
        </p>
        <div className={styles.preferenceGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={isHard}
              onChange={() => setIsHard((value) => !value)}
            />
            Hard mode (string-specific)
          </label>
        </div>
        <div className={styles.selectionInfo} data-testid="selection-info">
          <strong>Selected:</strong>{' '}
          {selectedPosition && selectedNote
            ? `String ${selectedPosition.string}, ${
                selectedPosition.fret === 0
                  ? 'open'
                  : `fret ${selectedPosition.fret}`
              }`
            : 'None'}
        </div>
        <div
          className={
            feedback.status === 'correct'
              ? `${styles.feedback} ${styles.correct}`
              : feedback.status === 'incorrect'
                ? `${styles.feedback} ${styles.incorrect}`
                : feedback.status === 'warn'
                  ? `${styles.feedback} ${styles.warning}`
                  : styles.feedback
          }
          role="status"
          aria-live="polite"
          data-testid="feedback"
        >
          {feedbackMessage}
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryButton} type="button" onClick={handleSubmit}>
            Submit
          </button>
          <button className={styles.secondaryButton} type="button" onClick={handleNext}>
            Next
          </button>
        </div>
      </div>
      <Controls
        mode={drill.mode}
        timeLeft={drill.timeLeft}
        streak={drill.streak}
        score={drill.score}
        isTimerActive={drill.isTimerActive}
        onModeChange={drill.setMode}
        onStartTimed={drill.startTimed}
        onResetTimed={drill.resetTimed}
      >
        <Fretboard
          mode="ukulele"
          activePosition={selectedPosition ?? undefined}
          highlightedPositions={revealedPositions}
          disabledPositions={disabledPositions}
          onSelect={(position) => handleSelect(position as UkulelePosition)}
          onNavigate={handleNavigate}
          labelledBy="ukulele-target"
        />
      </Controls>
      <ProgressSummary
        label="Ukulele progress"
        progress={progress}
        loading={loading}
        error={error}
        className={styles.progressPanel}
      />
    </div>
  )
}

export default UkuleleTrainer

function positionKeyString(position: UkulelePosition): string {
  return `${position.string}-${position.fret}`
}
