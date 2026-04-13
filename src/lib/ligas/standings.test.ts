import { describe, it, expect } from 'vitest'
import { calcStandings } from './standings'

interface PartidoSimple {
  id: string
  pareja1_j1: string | null
  pareja1_j2: string | null
  pareja2_j1: string | null
  pareja2_j2: string | null
  sets_pareja1: number | null
  sets_pareja2: number | null
  ganador: 1 | 2 | null
  estado: 'pendiente' | 'en_curso' | 'jugado' | 'walkover'
}

const jugadores = ['j1', 'j2', 'j3', 'j4']

const partidos: PartidoSimple[] = [
  {
    id: 'p1', pareja1_j1: 'j1', pareja1_j2: 'j2',
    pareja2_j1: 'j3', pareja2_j2: 'j4',
    sets_pareja1: 2, sets_pareja2: 1, ganador: 1, estado: 'jugado',
  },
]

describe('calcStandings', () => {
  it('returns one entry per jugador', () => {
    const standings = calcStandings(jugadores, partidos)
    expect(standings).toHaveLength(4)
  })

  it('winner gets 3 points, loser 0', () => {
    const standings = calcStandings(jugadores, partidos)
    const j1 = standings.find(s => s.jugador_id === 'j1')!
    const j3 = standings.find(s => s.jugador_id === 'j3')!
    expect(j1.puntos).toBe(3)
    expect(j3.puntos).toBe(0)
  })

  it('counts sets correctly', () => {
    const standings = calcStandings(jugadores, partidos)
    const j1 = standings.find(s => s.jugador_id === 'j1')!
    expect(j1.sets_favor).toBe(2)
    expect(j1.sets_contra).toBe(1)
  })

  it('sorts by puntos desc, then sets diff desc', () => {
    const standings = calcStandings(jugadores, partidos)
    expect(standings[0].puntos).toBeGreaterThanOrEqual(standings[1].puntos)
  })

  it('returns 0 puntos for players with no matches', () => {
    const standings = calcStandings(['jX'], [])
    expect(standings[0].puntos).toBe(0)
    expect(standings[0].partidos_jugados).toBe(0)
  })
})

// --- edge cases ---

describe('calcStandings — edge cases', () => {
  const makePartido = (
    id: string,
    j1: string, j2: string | null,
    j3: string, j4: string | null,
    sets1: number, sets2: number,
    ganador: 1 | 2
  ): PartidoSimple => ({
    id,
    pareja1_j1: j1, pareja1_j2: j2,
    pareja2_j1: j3, pareja2_j2: j4,
    sets_pareja1: sets1, sets_pareja2: sets2,
    ganador,
    estado: 'jugado',
  })

  it('empty partidos array returns all zeros', () => {
    const s = calcStandings(['a', 'b', 'c'], [])
    expect(s.every(r => r.puntos === 0 && r.partidos_jugados === 0)).toBe(true)
  })

  it('ignores partidos with estado !== jugado', () => {
    const s = calcStandings(['a', 'b'], [{
      id: 'x', pareja1_j1: 'a', pareja1_j2: null,
      pareja2_j1: 'b', pareja2_j2: null,
      sets_pareja1: 2, sets_pareja2: 0, ganador: 1, estado: 'pendiente',
    }])
    expect(s.find(r => r.jugador_id === 'a')!.puntos).toBe(0)
  })

  it('ignores partidos with ganador === null', () => {
    const s = calcStandings(['a', 'b'], [{
      id: 'x', pareja1_j1: 'a', pareja1_j2: null,
      pareja2_j1: 'b', pareja2_j2: null,
      sets_pareja1: 2, sets_pareja2: 0, ganador: null, estado: 'jugado',
    }])
    expect(s.every(r => r.puntos === 0)).toBe(true)
  })

  it('tiebreaker: same points sorted by sets diff desc', () => {
    // a beats c 2-0 (diff +2), b beats d 2-1 (diff +1) → a ranked above b
    const s = calcStandings(['a', 'b', 'c', 'd'], [
      makePartido('p1', 'a', null, 'c', null, 2, 0, 1),
      makePartido('p2', 'b', null, 'd', null, 2, 1, 1),
    ])
    const aIdx = s.findIndex(r => r.jugador_id === 'a')
    const bIdx = s.findIndex(r => r.jugador_id === 'b')
    expect(aIdx).toBeLessThan(bIdx)
  })

  it('player in partido but not in jugadorIds is ignored', () => {
    // 'z' not in jugadorIds → result for 'a' only contains 1 entry
    const s = calcStandings(['a'], [{
      id: 'x', pareja1_j1: 'z', pareja1_j2: null,
      pareja2_j1: 'a', pareja2_j2: null,
      sets_pareja1: 2, sets_pareja2: 0, ganador: 1, estado: 'jugado',
    }])
    expect(s).toHaveLength(1)
    // 'a' is in pareja2, ganador=1 means 'a' loses
    expect(s.find(r => r.jugador_id === 'a')!.puntos).toBe(0)
    expect(s.find(r => r.jugador_id === 'a')!.partidos_jugados).toBe(1)
  })

  it('double-pair match credits both players in winning pair', () => {
    const s = calcStandings(['a', 'b', 'c', 'd'], [
      makePartido('x', 'a', 'b', 'c', 'd', 2, 1, 1),
    ])
    expect(s.find(r => r.jugador_id === 'a')!.puntos).toBe(3)
    expect(s.find(r => r.jugador_id === 'b')!.puntos).toBe(3)
    expect(s.find(r => r.jugador_id === 'c')!.puntos).toBe(0)
    expect(s.find(r => r.jugador_id === 'd')!.puntos).toBe(0)
  })

  it('partidos_ganados and partidos_perdidos are tracked independently', () => {
    // a wins vs c, then loses vs b
    const s = calcStandings(['a', 'b', 'c'], [
      makePartido('p1', 'a', null, 'c', null, 2, 0, 1),
      makePartido('p2', 'b', null, 'a', null, 2, 1, 1),
    ])
    const a = s.find(r => r.jugador_id === 'a')!
    expect(a.partidos_ganados).toBe(1)
    expect(a.partidos_perdidos).toBe(1)
    expect(a.partidos_jugados).toBe(2)
  })

  it('diff_sets is correctly computed', () => {
    const s = calcStandings(['a', 'b'], [
      makePartido('p1', 'a', null, 'b', null, 2, 1, 1),
    ])
    const a = s.find(r => r.jugador_id === 'a')!
    expect(a.diff_sets).toBe(1)
    const b = s.find(r => r.jugador_id === 'b')!
    expect(b.diff_sets).toBe(-1)
  })
})
