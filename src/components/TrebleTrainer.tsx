import { useCallback, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Controls from './Controls'
import Staff from './Staff'
import Piano from './Piano'
import styles from './TrebleTrainer.module.css'
import {
  NOTE_NAME_OPTIONS,
  TREBLE_OCTAVE_OPTIONS,
  TREBLE_SCOPE_NOTES,
  equalPitch,
  formatNote,
  toCanonical,
  toEnharmonicFlat,
  type Note,
  type PitchClass,
} from '../utils/noteUtils'
import { useDrill, type DrillSubmissionResult } from '../hooks/useDrill'

type FeedbackState =
  | { status: 'idle' }
  | { status: 'correct'; message: string }
  | { status: 'incorrect'; message: string }

const DEFAULT_NOTE: Note = { name: 'C', octave: 4 }

const TrebleTrainer = () => {
  const [selectedName, setSelectedName] = useState<PitchClass>('C')
  const [selectedOctave, setSelectedOctave] = useState<number>(4)
  const [feedback, setFeedback] = useState<FeedbackState>({ status: 'idle' })

  const drill = useDrill<Note, DrillSubmissionResult>({
    pool: TREBLE_SCOPE_NOTES,
    evaluate: (target, answer) => ({
      correct: equalPitch(target, answer),
      canonical: toCanonical(target),
    }),
  })

  const targetCanonical = useMemo(
    () => toCanonical(drill.targetNote),
    [drill.targetNote],
  )

  const handleSelectNote = useCallback((note: Note) => {
    setSelectedName(note.name as PitchClass)
    setSelectedOctave(note.octave)
  }, [])

  const resetForNext = useCallback(() => {
    setFeedback({ status: 'idle' })
  }, [])

  const handleSubmit = useCallback(() => {
    const answer: Note = { name: selectedName, octave: selectedOctave }
    const result = drill.submitAnswer(answer)
    if (result.correct) {
      setFeedback({
        status: 'correct',
        message: `Correct! ${formatNote(result.canonical)}`,
      })
    } else {
      const enharmonic = toEnharmonicFlat(result.canonical)
      const enharmonicLabel =
        enharmonic.name !== result.canonical.name
          ? ` / ${formatNote(enharmonic)}`
          : ''
      setFeedback({
        status: 'incorrect',
        message: `Try again. Correct answer: ${formatNote(result.canonical)}${enharmonicLabel}`,
      })
    }
  }, [drill, selectedName, selectedOctave])

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSubmit()
  }

  const onNext = () => {
    drill.nextTarget()
    resetForNext()
    handleSelectNote(DEFAULT_NOTE)
  }

  const feedbackMessage =
    feedback.status === 'idle' ? '' : feedback.message ?? ''

  return (
    <div className={styles.container}>
      <section className={styles.visualPanel}>
        <h2 className={styles.heading}>Treble Clef Trainer</h2>
        <p className={styles.targetLabel} aria-live="polite">
          Find: {formatNote(targetCanonical)}
        </p>
        <Staff
          note={targetCanonical}
          aria-label={`Identify note ${formatNote(targetCanonical)} on the treble staff`}
        />
      </section>
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
        <form className={styles.answerForm} onSubmit={onFormSubmit}>
          <fieldset className={styles.answerGroup}>
            <legend className="visuallyHidden">Answer using dropdowns</legend>
            <label htmlFor="note-name" className={styles.inputLabel}>
              Note name
            </label>
            <select
              id="note-name"
              className={styles.select}
              value={selectedName}
              onChange={(event) =>
                setSelectedName(event.target.value as PitchClass)
              }
            >
              {NOTE_NAME_OPTIONS.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>

            <label htmlFor="note-octave" className={styles.inputLabel}>
              Octave
            </label>
            <select
              id="note-octave"
              className={styles.select}
              value={selectedOctave}
              onChange={(event) =>
                setSelectedOctave(Number.parseInt(event.target.value, 10))
              }
            >
              {TREBLE_OCTAVE_OPTIONS.map((octave) => (
                <option value={octave} key={octave}>
                  {octave}
                </option>
              ))}
            </select>
            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>
                Check
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onNext}
              >
                Next
              </button>
            </div>
          </fieldset>
        </form>

        <div>
          <h3 className={styles.subheading}>On-screen piano</h3>
          <Piano
            activeNote={{ name: selectedName, octave: selectedOctave }}
            onSelect={handleSelectNote}
          />
        </div>

        <div
          className={
            feedback.status === 'correct'
              ? `${styles.feedback} ${styles.correct}`
              : feedback.status === 'incorrect'
                ? `${styles.feedback} ${styles.incorrect}`
                : styles.feedback
          }
          role="status"
          aria-live="polite"
        >
          {feedbackMessage || 'Awaiting answer...'}
        </div>
      </Controls>
    </div>
  )
}

export default TrebleTrainer
