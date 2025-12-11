import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchTrainerProgress,
  recordTrainerResult,
  type TrainerId,
} from '../firebase/progress'

export type TrainerProgress = {
  totalAttempts: number
  totalCorrect: number
  bestStreak: number
  lastUpdated: Date | null
}

const INITIAL_PROGRESS: TrainerProgress = {
  totalAttempts: 0,
  totalCorrect: 0,
  bestStreak: 0,
  lastUpdated: null,
}

export function useTrainerProgress(trainer: TrainerId) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<TrainerProgress>(INITIAL_PROGRESS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setProgress({ ...INITIAL_PROGRESS })
      setLoading(false)
      setError(null)
      return () => {
        cancelled = true
      }
    }
    setLoading(true)
    setError(null)
    fetchTrainerProgress(user.uid, trainer)
      .then((data) => {
        if (cancelled) return
        setProgress({
          totalAttempts: data.totalAttempts ?? 0,
          totalCorrect: data.totalCorrect ?? 0,
          bestStreak: data.bestStreak ?? 0,
          lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : null,
        })
        setLoading(false)
      })
      .catch((fetchError) => {
        if (cancelled) return
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to load progress',
        )
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [trainer, user])

  const recordResult = useCallback(
    async ({ correct, streak }: { correct: boolean; streak: number }) => {
      if (!user) return
      try {
        await recordTrainerResult({
          userId: user.uid,
          trainer,
          correct,
          streak,
        })
        setProgress((previous) => {
          const totalAttempts = previous.totalAttempts + 1
          const totalCorrect = previous.totalCorrect + (correct ? 1 : 0)
          const bestStreak = Math.max(previous.bestStreak, streak)
          return {
            totalAttempts,
            totalCorrect,
            bestStreak,
            lastUpdated: new Date(),
          }
        })
      } catch (recordError) {
        console.error(recordError)
        setError(
          recordError instanceof Error
            ? recordError.message
            : 'Failed to save progress',
        )
      }
    },
    [trainer, user],
  )

  return { progress, loading, error, recordResult }
}
