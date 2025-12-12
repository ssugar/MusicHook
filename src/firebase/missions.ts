import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import type { MissionId } from '../missions/definitions'
import { db } from './app'

export type MissionRecord = {
  missionId: MissionId
  bestStars: number
  attemptCount: number
  lastStars?: number
  lastAttempt?: Timestamp
}

function missionCollection(userId: string) {
  return collection(db, 'users', userId, 'missions')
}

export async function fetchMissionRecords(userId: string) {
  const snapshot = await getDocs(missionCollection(userId))
  const records: Record<MissionId, MissionRecord> = {} as Record<MissionId, MissionRecord>
  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data() as MissionRecord
    records[docSnapshot.id as MissionId] = data
  })
  return records
}

export async function recordMissionAttempt(options: {
  userId: string
  missionId: MissionId
  stars: number
}) {
  const { userId, missionId, stars } = options
  const missionRef = doc(db, 'users', userId, 'missions', missionId)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(missionRef)
    const existing = snapshot.data() as MissionRecord | undefined
    const attemptCount = (existing?.attemptCount ?? 0) + 1
    const bestStars = Math.max(existing?.bestStars ?? 0, stars)
    transaction.set(missionRef, {
      missionId,
      attemptCount,
      bestStars,
      lastStars: stars,
      lastAttempt: serverTimestamp(),
    })
  })
}
