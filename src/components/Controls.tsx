import type { ReactNode } from 'react'
import type { DrillMode, DrillScore } from '../hooks/useDrill'
import styles from './Controls.module.css'

type ControlsProps = {
  mode: DrillMode
  timeLeft: number
  streak: number
  score: DrillScore
  isTimerActive: boolean
  onModeChange: (mode: DrillMode) => void
  onStartTimed: () => void
  onResetTimed: () => void
  children: ReactNode
}

const TIMED_LABEL = 'Timed Drill (60s)'

function Controls({
  mode,
  timeLeft,
  streak,
  score,
  isTimerActive,
  onModeChange,
  onStartTimed,
  onResetTimed,
  children,
}: ControlsProps) {
  const accuracy =
    score.attempts > 0
      ? Math.round((score.correct / score.attempts) * 100)
      : 0

  return (
    <section className={styles.controls} aria-label="Trainer controls">
      <div className={styles.modeGroup}>
        <button
          type="button"
          className={
            mode === 'practice'
              ? `${styles.modeButton} ${styles.active}`
              : styles.modeButton
          }
          aria-pressed={mode === 'practice'}
          onClick={() => onModeChange('practice')}
        >
          Practice
        </button>
        <button
          type="button"
          className={
            mode === 'timed'
              ? `${styles.modeButton} ${styles.active}`
              : styles.modeButton
          }
          aria-pressed={mode === 'timed'}
          onClick={() => onModeChange('timed')}
        >
          {TIMED_LABEL}
        </button>
        {mode === 'timed' ? (
          <div className={styles.timerControls}>
            <button
              type="button"
              className={styles.timerButton}
              onClick={onStartTimed}
            >
              {isTimerActive ? 'Restart timer' : 'Start timer'}
            </button>
            <button
              type="button"
              className={styles.timerButtonSecondary}
              onClick={onResetTimed}
            >
              Reset
            </button>
            <span className={styles.timeRemaining} aria-live="polite">
              {formatSeconds(timeLeft)}
            </span>
          </div>
        ) : null}
      </div>

      <div className={styles.body}>{children}</div>

      <dl className={styles.stats} aria-label="Performance statistics">
        <div>
          <dt>Correct</dt>
          <dd>{score.correct}</dd>
        </div>
        <div>
          <dt>Attempts</dt>
          <dd>{score.attempts}</dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>{accuracy}%</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>{streak}</dd>
        </div>
        {mode === 'timed' ? (
          <div>
            <dt>Time left</dt>
            <dd>{formatSeconds(timeLeft)}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}

function formatSeconds(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const minutes = Math.floor(clamped / 60)
  const secs = clamped % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default Controls
