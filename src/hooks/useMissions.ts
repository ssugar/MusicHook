import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTrainerProgress } from './useTrainerProgress'
import {
  getMissionDefinitions,
  type MissionDefinition,
  type MissionId,
  type MissionContext,
} from '../missions/definitions'
import { fetchMissionRecords, recordMissionAttempt } from '../firebase/missions'

export interface MissionWithState {
  definition: MissionDefinition
  evaluation: ReturnType<MissionDefinition['evaluate']>
  record: MissionRecordView | null
}

export interface MissionRecordView {
  missionId: MissionId
  attemptCount: number
  bestStars: number
  lastStars?: number
  lastAttempt: Date | null
}

export function useMissions() {
  const { user } = useAuth()
  const treble = useTrainerProgress('treble')
  const guitar = useTrainerProgress('guitar')
  const ukulele = useTrainerProgress('ukulele')
  const [records, setRecords] = useState<Record<MissionId, MissionRecordView>>(
    () => ({} as Record<MissionId, MissionRecordView>),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingMissionId, setSavingMissionId] = useState<MissionId | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setRecords({} as Record<MissionId, MissionRecordView>)
      setLoading(false)
      return () => {
        cancelled = true
      }
    }
    setLoading(true)
    setError(null)
    fetchMissionRecords(user.uid)
      .then((fetched) => {
        if (cancelled) return
        const mapped = Object.entries(fetched).reduce(
          (acc, [missionId, record]) => {
            acc[missionId as MissionId] = {
              missionId: missionId as MissionId,
              attemptCount: record.attemptCount,
              bestStars: record.bestStars,
              lastStars: record.lastStars,
              lastAttempt: record.lastAttempt
                ? record.lastAttempt.toDate()
                : null,
            }
            return acc
          },
          {} as Record<MissionId, MissionRecordView>,
        )
        setRecords(mapped)
        setLoading(false)
      })
      .catch((fetchError) => {
        if (cancelled) return
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to load missions',
        )
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const context = useMemo<MissionContext>(
    () => ({
      treble: treble.progress,
      guitar: guitar.progress,
      ukulele: ukulele.progress,
    }),
    [treble.progress, guitar.progress, ukulele.progress],
  )

  const definitions = useMemo(() => getMissionDefinitions(), [])

  const missions = useMemo<MissionWithState[]>(
    () =>
      definitions.map((definition) => ({
        definition,
        evaluation: definition.evaluate(context),
        record: records[definition.id] ?? null,
      })),
    [context, definitions, records],
  )

  const recordAttempt = useCallback(
    async (missionId: MissionId) => {
      if (!user) {
        throw new Error('You must be signed in to save mission progress.')
      }
      const mission = definitions.find((entry) => entry.id === missionId)
      if (!mission) return
      const evaluation = mission.evaluate(context)
      setSavingMissionId(missionId)
      setError(null)
      try {
        await recordMissionAttempt({
          userId: user.uid,
          missionId,
          stars: evaluation.stars,
        })
        setRecords((previous) => ({
          ...previous,
          [missionId]: {
            missionId,
            attemptCount: (previous[missionId]?.attemptCount ?? 0) + 1,
            bestStars: Math.max(previous[missionId]?.bestStars ?? 0, evaluation.stars),
            lastStars: evaluation.stars,
            lastAttempt: new Date(),
          },
        }))
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Failed to record mission attempt',
        )
      } finally {
        setSavingMissionId(null)
      }
    },
    [context, definitions, user],
  )

  const aggregatedLoading =
    loading || treble.loading || guitar.loading || ukulele.loading

  return {
    missions,
    loading: aggregatedLoading,
    error,
    recordAttempt,
    savingMissionId,
  }
}
