import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './app'

export type TrainerId = 'treble' | 'guitar' | 'ukulele'

export type TrainerProgressDoc = {
  totalAttempts: number
  totalCorrect: number
  bestStreak: number
  lastUpdated?: Timestamp
}

const EMPTY_PROGRESS: TrainerProgressDoc = {
  totalAttempts: 0,
  totalCorrect: 0,
  bestStreak: 0,
}

export async function fetchTrainerProgress(userId: string, trainer: TrainerId) {
  const ref = doc(db, 'users', userId, 'progress', trainer)
  const snapshot = await getDoc(ref)
  const data = snapshot.data() as TrainerProgressDoc | undefined
  if (!data) {
    return { ...EMPTY_PROGRESS, lastUpdated: undefined }
  }
  return data
}

export async function recordTrainerResult(options: {
  userId: string
  trainer: TrainerId
  correct: boolean
  streak: number
}) {
  const { userId, trainer, correct, streak } = options
  const ref = doc(db, 'users', userId, 'progress', trainer)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref)
    const existing = (snapshot.data() as TrainerProgressDoc | undefined) ?? EMPTY_PROGRESS
    const totalAttempts = (existing.totalAttempts ?? 0) + 1
    const totalCorrect = (existing.totalCorrect ?? 0) + (correct ? 1 : 0)
    const bestStreak = Math.max(existing.bestStreak ?? 0, streak)
    transaction.set(ref, {
      totalAttempts,
      totalCorrect,
      bestStreak,
      lastUpdated: serverTimestamp(),
    })
  })
}
