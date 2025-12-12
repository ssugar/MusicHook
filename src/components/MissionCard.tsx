import type { MissionWithState } from '../hooks/useMissions'
import styles from './MissionCard.module.css'

type MissionCardProps = {
  mission: MissionWithState
  onRecord: () => void
  isSaving: boolean
}

const MAX_STARS = 3

function renderStars(count: number) {
  return Array.from({ length: MAX_STARS }, (_, index) => (
    <span
      key={index}
      aria-hidden="true"
      className={index < count ? styles.starFilled : styles.starEmpty}
    >
      ★
    </span>
  ))
}

function MissionCard({ mission, onRecord, isSaving }: MissionCardProps) {
  const { definition, evaluation, record } = mission
  const disabled = !evaluation.requirementsMet || isSaving
  const bestStars = record?.bestStars ?? 0
  const currentStars = evaluation.stars

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <h3 className={styles.title}>{definition.title}</h3>
        <div className={styles.starRow}>
          <span className={styles.starLabel}>Current</span>
          <div className={styles.stars}>
            {renderStars(currentStars)}
            <span className={styles.starCount}>{currentStars}/3</span>
          </div>
        </div>
      </header>
      <p className={styles.description}>{definition.description}</p>
      <p className={styles.detail}>{evaluation.detail}</p>
      <div className={styles.progressRow}>
        <div>
          <span className={styles.metricLabel}>Best</span>
          <div className={styles.stars}>{renderStars(bestStars)}</div>
        </div>
        {record?.lastAttempt ? (
          <div>
            <span className={styles.metricLabel}>Last attempt</span>
            <p className={styles.metricValue}>
              {record.lastAttempt.toLocaleDateString()} ({record.lastStars ?? 0}★)
            </p>
          </div>
        ) : (
          <div>
            <span className={styles.metricLabel}>Attempts</span>
            <p className={styles.metricValue}>{record?.attemptCount ?? 0}</p>
          </div>
        )}
      </div>
      <button
        type="button"
        className={styles.recordButton}
        onClick={onRecord}
        disabled={disabled}
      >
        {isSaving ? 'Saving…' : evaluation.requirementsMet ? 'Save mission attempt' : 'Keep practicing'}
      </button>
    </article>
  )
}

export default MissionCard
