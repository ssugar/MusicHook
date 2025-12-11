import type { TrainerProgress } from '../hooks/useTrainerProgress'
import styles from './ProgressSummary.module.css'

type ProgressSummaryProps = {
  label: string
  progress: TrainerProgress
  loading: boolean
  error: string | null
  className?: string
}

const formatDate = (value: Date | null) =>
  value ? value.toLocaleString() : 'Never'

function ProgressSummary({
  label,
  progress,
  loading,
  error,
  className,
}: ProgressSummaryProps) {
  return (
    <section
      className={className ? `${styles.panel} ${className}` : styles.panel}
      aria-live="polite"
    >
      <header className={styles.header}>
        <h3 className={styles.title}>{label}</h3>
        <span className={styles.status}>
          {loading ? 'Syncing…' : 'Up to date'}
        </span>
      </header>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        <dl className={styles.metrics}>
          <div>
            <dt>Attempts</dt>
            <dd>{progress.totalAttempts}</dd>
          </div>
          <div>
            <dt>Correct</dt>
            <dd>{progress.totalCorrect}</dd>
          </div>
          <div>
            <dt>Best streak</dt>
            <dd>{progress.bestStreak}</dd>
          </div>
          <div className={styles.fullWidth}>
            <dt>Last updated</dt>
            <dd>{formatDate(progress.lastUpdated)}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}

export default ProgressSummary
