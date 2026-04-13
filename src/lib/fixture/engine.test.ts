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
