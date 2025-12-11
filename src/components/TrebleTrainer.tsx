import { useCallback, useMemo, useState } from 'react'
import Controls from './Controls'
import Staff from './Staff'
import styles from './TrebleTrainer.module.css'
import {
  NATURAL_PITCH_CLASSES,
  TREBLE_SCOPE_C_MAJOR_NOTES,
  formatNote,
  toCanonical,
  type PitchClass,
} from '../utils/noteUtils'
import { useDrill, type DrillSubmissionResult } from '../hooks/useDrill'
import { createSeededRandom } from '../utils/random'
import { useTrainerProgress } from '../hooks/useTrainerProgress'
import ProgressSummary from './ProgressSummary'

type FeedbackState =
  | { status: 'idle' }
  | { status: 'correct'; message: string }
  | { status: 'incorrect'; message: string }

const TrebleTrainer = () => {
  const [selectedAnswer, setSelectedAnswer] = useState<PitchClass | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>({ status: 'idle' })
  const rng = useMemo(() => createSeededRandom(Date.now()), [])
  const { progress, loading, error, recordResult } =
    useTrainerProgress('treble')

  const drill = useDrill<PitchClass, DrillSubmissionResult>({
    pool: TREBLE_SCOPE_C_MAJOR_NOTES,
    evaluate: (target, answer) => {
      const canonical = toCanonical(target)
      return {
        correct: canonical.name === answer,
        canonical,
      }
    },
  })

  const targetCanonical = useMemo(
    () => toCanonical(drill.targetNote),
    [drill.targetNote],
  )

  const choiceOptions = useMemo(() => {
    const correct = targetCanonical.name as PitchClass
    const distractors = rng
      .shuffle(NATURAL_PITCH_CLASSES.filter((pitch) => pitch !== correct))
      .slice(0, 3)
    return rng.shuffle([correct, ...distractors])
  }, [rng, targetCanonical])

  const resetForNext = useCallback(() => {
    setFeedback({ status: 'idle' })
    setSelectedAnswer(null)
  }, [])

  const handleAnswer = useCallback(
    (choice: PitchClass) => {
      if (feedback.status === 'correct') {
        return
      }
      setSelectedAnswer(choice)
      const result = drill.submitAnswer(choice)
      const predictedStreak = result.correct ? drill.streak + 1 : 0
      void recordResult({ correct: result.correct, streak: predictedStreak })
      if (result.correct) {
        setFeedback({
          status: 'correct',
          message: `Correct! ${formatNote(result.canonical)}`,
        })
      } else {
        setFeedback({
          status: 'incorrect',
          message: 'Try again!',
        })
      }
    },
    [drill, feedback.status, recordResult],
  )

  const onNext = () => {
    drill.nextTarget()
    resetForNext()
  }

  const feedbackMessage =
    feedback.status === 'idle' ? '' : feedback.message ?? ''

  return (
    <div className={styles.container}>
      <section className={styles.visualPanel}>
        <h2 className={styles.heading}>Treble Clef Trainer</h2>
        <p className={styles.prompt} aria-live="polite">
          Which note is shown on the staff?
        </p>
        <Staff
          note={targetCanonical}
          aria-label={`Treble staff showing ${formatNote(targetCanonical)} for identification`}
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
        <ul className={styles.options} role="list">
          {choiceOptions.map((option) => (
            <li key={option} className={styles.optionItem} role="listitem">
              <button
                type="button"
                className={`${styles.optionButton}${
                  selectedAnswer === option ? ` ${styles.optionSelected}` : ''
                }`}
                onClick={() => handleAnswer(option)}
                aria-pressed={selectedAnswer === option}
                disabled={feedback.status === 'correct'}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onNext}
          >
            Next
          </button>
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
          {feedbackMessage || 'Select the correct note name.'}
        </div>
      </Controls>
      <ProgressSummary
        label="Saved progress"
        progress={progress}
        loading={loading}
        error={error}
        className={styles.progressPanel}
      />
    </div>
  )
}

export default TrebleTrainer
