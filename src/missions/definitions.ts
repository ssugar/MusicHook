import type { TrainerProgress } from '../hooks/useTrainerProgress'

export type MissionId =
  | 'treble-accuracy'
  | 'guitar-streak'
  | 'ukulele-endurance'
  | 'combo-sampler'
  | 'all-star-challenge'

export type MissionRoute = '/treble' | '/guitar' | '/ukulele'

export interface MissionContext {
  treble: TrainerProgress
  guitar: TrainerProgress
  ukulele: TrainerProgress
}

export interface MissionEvaluation {
  requirementsMet: boolean
  stars: 0 | 1 | 2 | 3
  detail: string
}

export interface MissionDefinition {
  id: MissionId
  title: string
  description: string
  targetRoute: MissionRoute
  evaluate: (context: MissionContext) => MissionEvaluation
}

const accuracy = (progress: TrainerProgress): number => {
  if (progress.totalAttempts === 0) return 0
  return progress.totalCorrect / progress.totalAttempts
}

const missions: MissionDefinition[] = [
  {
    id: 'treble-accuracy',
    title: 'Treble Accuracy Sprint',
    description:
      'Answer 10 treble-clef questions to unlock stars. Accuracy tiers: 60%, 80%, and 95%.',
    targetRoute: '/treble',
    evaluate: ({ treble }) => {
      const attempts = treble.totalAttempts
      const acc = accuracy(treble)
      const requirementMet = attempts >= 10
      let stars: 0 | 1 | 2 | 3 = 0
      if (requirementMet) {
        if (acc >= 0.95) stars = 3
        else if (acc >= 0.8) stars = 2
        else if (acc >= 0.6) stars = 1
      }
      return {
        requirementsMet: requirementMet,
        stars,
        detail: requirementMet
          ? `Attempts: ${attempts}, accuracy ${(acc * 100).toFixed(0)}%`
          : 'Log 10 attempts in Treble Trainer to unlock stars.',
      }
    },
  },
  {
    id: 'guitar-streak',
    title: 'Guitar Streak Hunter',
    description:
      'Build streaks on the guitar fretboard. Stars unlock at streaks of 3, 6, and 10.',
    targetRoute: '/guitar',
    evaluate: ({ guitar }) => {
      const requirementMet = guitar.bestStreak >= 3
      let stars: 0 | 1 | 2 | 3 = 0
      if (requirementMet) {
        if (guitar.bestStreak >= 10) stars = 3
        else if (guitar.bestStreak >= 6) stars = 2
        else stars = 1
      }
      return {
        requirementsMet: requirementMet,
        stars,
        detail: `Best streak: ${guitar.bestStreak}`,
      }
    },
  },
  {
    id: 'ukulele-endurance',
    title: 'Ukulele Endurance Run',
    description:
      'Rack up 15 ukulele attempts. Stars reward endurance at 15, 25, and 40 attempts.',
    targetRoute: '/ukulele',
    evaluate: ({ ukulele }) => {
      const attempts = ukulele.totalAttempts
      let stars: 0 | 1 | 2 | 3 = 0
      if (attempts >= 40) stars = 3
      else if (attempts >= 25) stars = 2
      else if (attempts >= 15) stars = 1
      return {
        requirementsMet: attempts >= 15,
        stars,
        detail: `Attempts: ${attempts}`,
      }
    },
  },
  {
    id: 'combo-sampler',
    title: 'Combo Sampler',
    description:
      'Practice every instrument: log 8 attempts in each trainer. Extra stars for exceeding 15 and 25 attempts.',
    targetRoute: '/treble',
    evaluate: ({ treble, guitar, ukulele }) => {
      const attempts = [treble.totalAttempts, guitar.totalAttempts, ukulele.totalAttempts]
      const minAttempts = Math.min(...attempts)
      let stars: 0 | 1 | 2 | 3 = 0
      if (minAttempts >= 25) stars = 3
      else if (minAttempts >= 15) stars = 2
      else if (minAttempts >= 8) stars = 1
      return {
        requirementsMet: minAttempts >= 8,
        stars,
        detail: `Treble ${treble.totalAttempts} · Guitar ${guitar.totalAttempts} · Ukulele ${ukulele.totalAttempts}`,
      }
    },
  },
  {
    id: 'all-star-challenge',
    title: 'All-Star Challenge',
    description:
      'Reach 60 combined correct answers. Stars at 60, 120, and 200 correct answers across all trainers.',
    targetRoute: '/treble',
    evaluate: ({ treble, guitar, ukulele }) => {
      const totalCorrect =
        treble.totalCorrect + guitar.totalCorrect + ukulele.totalCorrect
      let stars: 0 | 1 | 2 | 3 = 0
      if (totalCorrect >= 200) stars = 3
      else if (totalCorrect >= 120) stars = 2
      else if (totalCorrect >= 60) stars = 1
      return {
        requirementsMet: totalCorrect >= 60,
        stars,
        detail: `Combined correct answers: ${totalCorrect}`,
      }
    },
  },
]

export function getMissionDefinitions(): MissionDefinition[] {
  return missions
}
