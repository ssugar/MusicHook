import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GuitarPosition, Note } from '../utils/noteUtils'
import { equalPitch, toCanonical } from '../utils/noteUtils'
import type { SeededRandom } from '../utils/random'
import { createSeededRandom, pickWithExclusion } from '../utils/random'

export type DrillMode = 'practice' | 'timed'

export interface DrillScore {
  correct: number
  attempts: number
}

export interface DrillSubmissionResult {
  correct: boolean
  canonical: Note
  allGuitarPositions?: GuitarPosition[]
}

export interface UseDrillOptions<
  Answer,
  Result extends DrillSubmissionResult,
  NoteType extends Note = Note,
> {
  pool: NoteType[]
  evaluate: (target: NoteType, answer: Answer) => Result
  historySize?: number
  timerSeconds?: number
  seed?: number
}

export interface UseDrillReturn<
  Answer,
  Result extends DrillSubmissionResult,
  NoteType extends Note = Note,
> {
  mode: DrillMode
  timeLeft: number
  score: DrillScore
  streak: number
  targetNote: NoteType
  isTimerActive: boolean
  setMode: (mode: DrillMode) => void
  startTimed: () => void
  resetTimed: () => void
  nextTarget: () => void
  submitAnswer: (answer: Answer) => Result
}

const DEFAULT_HISTORY = 4
const DEFAULT_TIMER = 60

export function useDrill<
  Answer,
  Result extends DrillSubmissionResult,
  NoteType extends Note = Note,
>({
  pool,
  evaluate,
  historySize = DEFAULT_HISTORY,
  timerSeconds = DEFAULT_TIMER,
  seed,
}: UseDrillOptions<Answer, Result, NoteType>): UseDrillReturn<
  Answer,
  Result,
  NoteType
> {
  const rng = useMemo<SeededRandom>(
    () => createSeededRandom(seed ?? Date.now()),
    [seed],
  )
  const historyRef = useRef<NoteType[]>([])
  const timerId = useRef<number | null>(null)
  const [mode, setModeState] = useState<DrillMode>('practice')
  const [timeLeft, setTimeLeft] = useState(timerSeconds)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [score, setScore] = useState<DrillScore>({ correct: 0, attempts: 0 })
  const [streak, setStreak] = useState(0)
  const [targetNote, setTargetNote] = useState<NoteType>(() =>
    selectNextTarget(pool, [], rng),
  )

  const resetTimer = useCallback(() => {
    if (timerId.current) {
      window.clearInterval(timerId.current)
    }
    timerId.current = null
    setTimeLeft(timerSeconds)
    setIsTimerActive(false)
  }, [timerSeconds])

  const selectAndStoreTarget = useCallback(() => {
    setTargetNote((previous) => {
      const history = historyRef.current
      const next = selectNextTarget(pool, history, rng, previous)
      historyRef.current = [next, ...history].slice(0, historySize)
      return next
    })
  }, [pool, rng, historySize])

  const resetScore = useCallback(() => {
    setScore({ correct: 0, attempts: 0 })
    setStreak(0)
  }, [])

  const startTimed = useCallback(() => {
    resetScore()
    setModeState('timed')
    setTimeLeft(timerSeconds)
    setIsTimerActive(true)
  }, [resetScore, timerSeconds])

  useEffect(() => {
    if (!isTimerActive || mode !== 'timed') {
      return
    }
    timerId.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          if (timerId.current) {
            window.clearInterval(timerId.current)
          }
          timerId.current = null
          setIsTimerActive(false)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => {
      if (timerId.current) {
        window.clearInterval(timerId.current)
        timerId.current = null
      }
    }
  }, [isTimerActive, mode])

  useEffect(() => {
    historyRef.current = [targetNote, ...historyRef.current]
      .slice(0, historySize)
      .filter(Boolean)
  }, [targetNote, historySize])

  useEffect(() => resetTimer, [resetTimer])

  const setMode = useCallback(
    (nextMode: DrillMode) => {
      if (nextMode === 'practice') {
        setModeState('practice')
        resetTimer()
      } else {
        startTimed()
      }
    },
    [resetTimer, startTimed],
  )

  const resetTimed = useCallback(() => {
    resetTimer()
    resetScore()
    setModeState('practice')
  }, [resetScore, resetTimer])

  const submitAnswer = useCallback(
    (answer: Answer) => {
      const result = evaluate(targetNote, answer)
      const canonicalTarget = toCanonical(targetNote)
      setScore((previous) => ({
        attempts: previous.attempts + 1,
        correct: previous.correct + (result.correct ? 1 : 0),
      }))
      setStreak((previous) => (result.correct ? previous + 1 : 0))
      return {
        ...result,
        canonical: canonicalTarget,
      }
    },
    [evaluate, targetNote],
  )

  const nextTarget = useCallback(() => {
    selectAndStoreTarget()
  }, [selectAndStoreTarget])

  return {
    mode,
    timeLeft,
    score,
    streak,
    targetNote,
    isTimerActive,
    setMode,
    startTimed,
    resetTimed,
    nextTarget,
    submitAnswer,
  }
}

function selectNextTarget<NoteType extends Note>(
  pool: NoteType[],
  history: NoteType[],
  rng: SeededRandom,
  previous?: NoteType,
): NoteType {
  const exclusion = previous ? [previous, ...history] : history
  return pickWithExclusion(pool, exclusion, equalPitch, rng)
}
