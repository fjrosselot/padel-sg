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

// --- edge cases ---

describe('expectedScore — edge cases', () => {
  it('400-point gap gives ~0.909 expected score', () => {
    expect(expectedScore(1600, 1200)).toBeCloseTo(0.909, 2)
  })
  it('lower rated player has E < 0.5', () => {
    expect(expectedScore(1000, 1200)).toBeLessThan(0.5)
  })
  it('returns between 0 and 1 for extreme gap (2000 vs 800)', () => {
    const e = expectedScore(2000, 800)
    expect(e).toBeGreaterThan(0)
    expect(e).toBeLessThan(1)
  })
})

describe('newElo — edge cases', () => {
  it('ELO change is symmetric for equal players', () => {
    const gain = newElo(1200, 1200, 1) - 1200
    const loss = 1200 - newElo(1200, 1200, 0)
    expect(gain).toBe(loss)
  })
  it('heavy favorite gains little when winning', () => {
    const gain = newElo(1600, 1200, 1) - 1600
    expect(gain).toBeLessThan(5)
  })
  it('heavy underdog gains a lot when winning', () => {
    const gain = newElo(1200, 1600, 1) - 1200
    expect(gain).toBeGreaterThan(25)
  })
  it('draw (0.5) keeps ELO unchanged for equal players', () => {
    const result = newElo(1200, 1200, 0.5)
    expect(result).toBe(1200)
  })
  it('respects custom K factor', () => {
    const highK = newElo(1200, 1200, 1, 64)
    const lowK = newElo(1200, 1200, 1, 16)
    expect(highK - 1200).toBeGreaterThan(lowK - 1200)
  })
})

describe('applyEloMatch — edge cases', () => {
  it('pareja2 wins: pareja2 gains ELO', () => {
    const result = applyEloMatch([1200, 1200], [1200, 1200], 'pareja2')
    expect(result.pareja2[0]).toBeGreaterThan(1200)
    expect(result.pareja1[0]).toBeLessThan(1200)
  })
  it('uses average opponent ELO for calculation', () => {
    // pareja2 avg = (1000+1400)/2 = 1200 = same as p1 avg → symmetric result
    const result = applyEloMatch([1200, 1200], [1000, 1400], 'pareja1')
    expect(result.pareja1[0]).toBeGreaterThan(1200)
  })
  it('returns all four players in result', () => {
    const result = applyEloMatch([1200, 1300], [1100, 1400], 'pareja1')
    expect(result.pareja1).toHaveLength(2)
    expect(result.pareja2).toHaveLength(2)
  })
  it('both players in winning pareja gain ELO', () => {
    const result = applyEloMatch([1200, 1200], [1200, 1200], 'pareja1')
    expect(result.pareja1[0]).toBeGreaterThan(1200)
    expect(result.pareja1[1]).toBeGreaterThan(1200)
  })
  it('both players in losing pareja lose ELO', () => {
    const result = applyEloMatch([1200, 1200], [1200, 1200], 'pareja1')
    expect(result.pareja2[0]).toBeLessThan(1200)
    expect(result.pareja2[1]).toBeLessThan(1200)
  })
})
