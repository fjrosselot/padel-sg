import { describe, it, expect } from 'vitest'
import { generateRoundRobin, buildGroups, buildPlayoffs, buildFixture } from './engine'
import type { ParejaFixture, ConfigFixture, CategoriaConfig } from './types'

const defaultConfig: ConfigFixture = {
  parejas_por_grupo: 4,
  cuantos_avanzan: 2,
  con_consolacion: true,
  con_tercer_lugar: true,
  duracion_partido: 60,
  pausa_entre_partidos: 15,
  num_canchas: 2,
  hora_inicio: '09:00',
  fixture_compacto: false,
}

function makeParejas(n: number): ParejaFixture[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    nombre: `Pareja ${i + 1}`,
    jugador1_id: `j${i * 2 + 1}`,
    jugador2_id: `j${i * 2 + 2}`,
    elo1: 1200,
    elo2: 1200,
  }))
}

describe('generateRoundRobin', () => {
  it('generates correct number of matches for 4 pairs', () => {
    const matches = generateRoundRobin(makeParejas(4))
    expect(matches).toHaveLength(6) // C(4,2) = 6
  })
  it('generates correct number of matches for 3 pairs', () => {
    const matches = generateRoundRobin(makeParejas(3))
    expect(matches).toHaveLength(3) // C(3,2) = 3
  })
  it('each match has distinct pairs', () => {
    generateRoundRobin(makeParejas(4)).forEach(m => {
      expect(m.pareja1?.id).not.toBe(m.pareja2?.id)
    })
  })
})

describe('buildGroups', () => {
  it('creates correct number of groups', () => {
    const grupos = buildGroups(makeParejas(8), defaultConfig)
    expect(grupos).toHaveLength(2) // 8 pairs / 4 per group
  })
  it('assigns letters A, B, ...', () => {
    const grupos = buildGroups(makeParejas(8), defaultConfig)
    expect(grupos[0].letra).toBe('A')
    expect(grupos[1].letra).toBe('B')
  })
})

describe('buildPlayoffs', () => {
  it('creates semifinal for 4 classified pairs', () => {
    const playoffs = buildPlayoffs(makeParejas(4), defaultConfig)
    expect(playoffs.filter(p => p.fase === 'semifinal')).toHaveLength(2)
  })
  it('creates final when configured', () => {
    const playoffs = buildPlayoffs(makeParejas(4), defaultConfig)
    expect(playoffs.some(p => p.fase === 'final')).toBe(true)
  })
  it('creates tercer_lugar when configured', () => {
    const playoffs = buildPlayoffs(makeParejas(4), defaultConfig)
    expect(playoffs.some(p => p.fase === 'tercer_lugar')).toBe(true)
  })
})

describe('buildFixture', () => {
  it('returns a CategoriaFixture with groups and playoffs', () => {
    const cat: CategoriaConfig = { nombre: '3a', num_parejas: 8 }
    const result = buildFixture(cat, makeParejas(8), defaultConfig)
    expect(result.nombre).toBe('3a')
    expect(result.grupos.length).toBeGreaterThan(0)
    expect(result.faseEliminatoria.length).toBeGreaterThan(0)
  })
  it('assigns turnos and canchas to group matches', () => {
    const cat: CategoriaConfig = { nombre: '3a', num_parejas: 8 }
    const result = buildFixture(cat, makeParejas(8), defaultConfig)
    const first = result.grupos[0].partidos[0]
    expect(first.turno).toBeTruthy()
    expect(first.cancha).toBeGreaterThan(0)
  })
})

// --- edge cases ---

describe('generateRoundRobin — edge cases', () => {
  it('2 parejas generates 1 match', () => {
    const matches = generateRoundRobin(makeParejas(2))
    expect(matches).toHaveLength(1)
  })

  it('no pareja plays itself', () => {
    const matches = generateRoundRobin(makeParejas(4))
    for (const m of matches) {
      if (m.pareja1 && m.pareja2) {
        expect(m.pareja1.id).not.toBe(m.pareja2.id)
      }
    }
  })

  it('each pareja appears equal number of times for 4 parejas', () => {
    const parejas = makeParejas(4)
    const matches = generateRoundRobin(parejas)
    const counts: Record<string, number> = {}
    for (const m of matches) {
      if (m.pareja1) counts[m.pareja1.id] = (counts[m.pareja1.id] ?? 0) + 1
      if (m.pareja2) counts[m.pareja2.id] = (counts[m.pareja2.id] ?? 0) + 1
    }
    const values = Object.values(counts)
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1)
  })

  it('odd number of parejas (3) generates exactly 3 real matches (no BYE matchups)', () => {
    const matches = generateRoundRobin(makeParejas(3))
    const realMatches = matches.filter(m => m.pareja1 !== null && m.pareja2 !== null)
    expect(realMatches).toHaveLength(3)
  })

  it('grupo label is set on each match', () => {
    const matches = generateRoundRobin(makeParejas(4), 'grupo', 'B')
    expect(matches.every(m => m.grupo === 'B')).toBe(true)
  })
})

describe('buildGroups — edge cases', () => {
  it('2 groups of 4: each group has 4 parejas', () => {
    const result = buildGroups(makeParejas(8), defaultConfig)
    expect(result).toHaveLength(2)
    expect(result[0].parejas).toHaveLength(4)
    expect(result[1].parejas).toHaveLength(4)
  })

  it('snake distribution: top seed in group A, 2nd in group B', () => {
    // 8 parejas with descending ELO → 2 groups of 4
    // snake: seed0→groupA, seed1→groupB, seed2→groupA, ...
    const parejas: ParejaFixture[] = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i + 1}`,
      nombre: `Pareja ${i + 1}`,
      jugador1_id: `j${i * 2 + 1}`,
      jugador2_id: `j${i * 2 + 2}`,
      elo1: 1800 - i * 100,
      elo2: 1800 - i * 100,
    }))
    const result = buildGroups(parejas, defaultConfig)
    // p1 (highest ELO, idx 0 after sort) → idx 0 % 2 = group A
    expect(result[0].parejas.some(p => p.id === 'p1')).toBe(true)
    // p2 (second highest, idx 1 after sort) → idx 1 % 2 = group B
    expect(result[1].parejas.some(p => p.id === 'p2')).toBe(true)
  })

  it('each group has round-robin partidos generated', () => {
    const result = buildGroups(makeParejas(8), defaultConfig)
    // 4 parejas per group → 6 matches each
    expect(result[0].partidos).toHaveLength(6)
    expect(result[1].partidos).toHaveLength(6)
  })
})

describe('buildPlayoffs — edge cases', () => {
  it('returns empty array for 1 classified pair', () => {
    const playoffs = buildPlayoffs(makeParejas(1), defaultConfig)
    expect(playoffs).toHaveLength(0)
  })

  it('2 classified pairs creates only a final', () => {
    const playoffs = buildPlayoffs(makeParejas(2), defaultConfig)
    expect(playoffs.filter(p => p.fase === 'final')).toHaveLength(1)
    expect(playoffs.filter(p => p.fase === 'semifinal')).toHaveLength(0)
  })

  it('no tercer_lugar when con_tercer_lugar is false', () => {
    const cfg = { ...defaultConfig, con_tercer_lugar: false }
    const playoffs = buildPlayoffs(makeParejas(4), cfg)
    expect(playoffs.some(p => p.fase === 'tercer_lugar')).toBe(false)
  })

  it('no consolacion when con_consolacion is false', () => {
    const cfg = { ...defaultConfig, con_consolacion: false }
    const playoffs = buildPlayoffs(makeParejas(4), cfg)
    expect(playoffs.some(p => p.fase === 'consolacion_final')).toBe(false)
  })
})
