import type { TrainerProgress } from '../hooks/useTrainerProgress'

export type MissionId =
  | 'treble-accuracy'
  | 'guitar-streak'
  | 'ukulele-endurance'
  | 'combo-sampler'
  | 'all-star-challenge'

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
      'Answer at least 20 treble-clef questions. Stars are awarded for accuracy: 70%, 85%, and 95%.',
    evaluate: ({ treble }) => {
      const attempts = treble.totalAttempts
      const acc = accuracy(treble)
      const requirementMet = attempts >= 20
      let stars: 0 | 1 | 2 | 3 = 0
      if (requirementMet) {
        if (acc >= 0.95) stars = 3
        else if (acc >= 0.85) stars = 2
        else if (acc >= 0.7) stars = 1
      }
      return {
        requirementsMet: requirementMet,
        stars,
        detail: requirementMet
          ? `Attempts: ${attempts}, accuracy ${(acc * 100).toFixed(0)}%`
          : 'Log 20 attempts in Treble Trainer to unlock stars.',
      }
    },
  },
  {
    id: 'guitar-streak',
    title: 'Guitar Streak Hunter',
    description:
      'Build long streaks on the guitar fretboard. Stars unlock at streaks of 5, 10, and 15.',
    evaluate: ({ guitar }) => {
      const requirementMet = guitar.bestStreak >= 5
      let stars: 0 | 1 | 2 | 3 = 0
      if (requirementMet) {
        if (guitar.bestStreak >= 15) stars = 3
        else if (guitar.bestStreak >= 10) stars = 2
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
      'Rack up 25 ukulele attempts. Stars reward endurance at 25, 40, and 60 attempts.',
    evaluate: ({ ukulele }) => {
      const attempts = ukulele.totalAttempts
      let stars: 0 | 1 | 2 | 3 = 0
      if (attempts >= 60) stars = 3
      else if (attempts >= 40) stars = 2
      else if (attempts >= 25) stars = 1
      return {
        requirementsMet: attempts >= 25,
        stars,
        detail: `Attempts: ${attempts}`,
      }
    },
  },
  {
    id: 'combo-sampler',
    title: 'Combo Sampler',
    description:
      'Practice every instrument: log 15 attempts in each trainer. Extra stars for exceeding 25 and 40 attempts.',
    evaluate: ({ treble, guitar, ukulele }) => {
      const attempts = [treble.totalAttempts, guitar.totalAttempts, ukulele.totalAttempts]
      const minAttempts = Math.min(...attempts)
      let stars: 0 | 1 | 2 | 3 = 0
      if (minAttempts >= 40) stars = 3
      else if (minAttempts >= 25) stars = 2
      else if (minAttempts >= 15) stars = 1
      return {
        requirementsMet: minAttempts >= 15,
        stars,
        detail: `Treble ${treble.totalAttempts} · Guitar ${guitar.totalAttempts} · Ukulele ${ukulele.totalAttempts}`,
      }
    },
  },
  {
    id: 'all-star-challenge',
    title: 'All-Star Challenge',
    description:
      'Reach 150 combined correct answers. Stars at 150, 250, and 400 correct answers across all trainers.',
    evaluate: ({ treble, guitar, ukulele }) => {
      const totalCorrect =
        treble.totalCorrect + guitar.totalCorrect + ukulele.totalCorrect
      let stars: 0 | 1 | 2 | 3 = 0
      if (totalCorrect >= 400) stars = 3
      else if (totalCorrect >= 250) stars = 2
      else if (totalCorrect >= 150) stars = 1
      return {
        requirementsMet: totalCorrect >= 150,
        stars,
        detail: `Combined correct answers: ${totalCorrect}`,
      }
    },
  },
]

export function getMissionDefinitions(): MissionDefinition[] {
  return missions
}
