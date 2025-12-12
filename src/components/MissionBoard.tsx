import { useMissions } from '../hooks/useMissions'
import MissionCard from './MissionCard'
import styles from './MissionBoard.module.css'

const MissionBoard = () => {
  const { missions, loading, error, recordAttempt, savingMissionId } = useMissions()

  return (
    <div className={styles.board}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>New!</p>
          <h2 className={styles.title}>Weekly Missions</h2>
          <p className={styles.subtitle}>
            Complete focused drills to earn up to three stars. Missions can be replayed anytime; we always keep your best score.
          </p>
        </div>
      </header>
      {loading ? (
        <p className={styles.status} role="status">
          Loading mission data…
        </p>
      ) : error ? (
        <p className={`${styles.status} ${styles.error}`} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.grid}>
        {missions.map((mission) => (
          <MissionCard
            key={mission.definition.id}
            mission={mission}
            onRecord={() => recordAttempt(mission.definition.id)}
            isSaving={savingMissionId === mission.definition.id}
          />
        ))}
      </div>
    </div>
  )
}

export default MissionBoard
