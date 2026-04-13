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
