import { describe, it, expect } from 'vitest'
import { expectedScore, newElo, applyEloMatch } from './elo'

describe('expectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5)
  })
  it('returns >0.5 for higher-rated player', () => {
    expect(expectedScore(1400, 1200)).toBeGreaterThan(0.5)
  })
  it('returns <0.5 for lower-rated player', () => {
    expect(expectedScore(1000, 1200)).toBeLessThan(0.5)
  })
})

describe('newElo', () => {
  it('increases ELO for winner (score=1)', () => {
    expect(newElo(1200, 1200, 1)).toBeGreaterThan(1200)
  })
  it('decreases ELO for loser (score=0)', () => {
    expect(newElo(1200, 1200, 0)).toBeLessThan(1200)
  })
  it('uses K=32 by default', () => {
    expect(newElo(1200, 1200, 1)).toBeCloseTo(1216, 0)
  })
})

describe('applyEloMatch', () => {
  it('returns 4 updated ratings', () => {
    const result = applyEloMatch([1200, 1200], [1200, 1200], 'pareja1')
    expect(result).toHaveProperty('pareja1')
    expect(result).toHaveProperty('pareja2')
    expect(result.pareja1).toHaveLength(2)
    expect(result.pareja2).toHaveLength(2)
  })
  it('increases winner ratings and decreases loser ratings', () => {
    const result = applyEloMatch([1200, 1200], [1200, 1200], 'pareja1')
    expect(result.pareja1[0]).toBeGreaterThan(1200)
    expect(result.pareja2[0]).toBeLessThan(1200)
  })
})
