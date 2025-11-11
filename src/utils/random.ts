/**
 * Deterministic pseudo-random utilities for reproducible practice drills.
 * Implementation based on Mulberry32.
 */

export interface SeededRandom {
  next(): number
  nextInt(max: number): number
  pick<T>(values: readonly T[]): T
  shuffle<T>(values: readonly T[]): T[]
}

export function createSeededRandom(seed: number = Date.now()): SeededRandom {
  let state = seed >>> 0

  const next = () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    nextInt(max) {
      if (max <= 0) {
        throw new Error('max must be greater than 0')
      }
      return Math.floor(next() * max)
    },
    pick(values) {
      if (values.length === 0) {
        throw new Error('Cannot pick from an empty list')
      }
      return values[this.nextInt(values.length)]
    },
    shuffle(values) {
      const copy = [...values]
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = this.nextInt(i + 1)
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    },
  }
}

export function pickWithExclusion<T>(
  values: readonly T[],
  exclude: readonly T[],
  isEqual: (a: T, b: T) => boolean,
  rng: SeededRandom,
): T {
  const filtered = values.filter(
    (candidate) => !exclude.some((value) => isEqual(value, candidate)),
  )
  if (filtered.length === 0) {
    return rng.pick(values)
  }
  return rng.pick(filtered)
}
