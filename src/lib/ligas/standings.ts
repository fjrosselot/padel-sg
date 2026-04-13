export interface StandingRow {
  jugador_id: string
  puntos: number
  partidos_jugados: number
  partidos_ganados: number
  partidos_perdidos: number
  sets_favor: number
  sets_contra: number
  diff_sets: number
}

interface PartidoResult {
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

export function calcStandings(
  jugadorIds: string[],
  partidos: PartidoResult[]
): StandingRow[] {
  const map = new Map<string, StandingRow>()

  for (const id of jugadorIds) {
    map.set(id, {
      jugador_id: id,
      puntos: 0,
      partidos_jugados: 0,
      partidos_ganados: 0,
      partidos_perdidos: 0,
      sets_favor: 0,
      sets_contra: 0,
      diff_sets: 0,
    })
  }

  for (const p of partidos) {
    if (p.estado !== 'jugado' || p.ganador === null) continue

    const p1ids = [p.pareja1_j1, p.pareja1_j2].filter(Boolean) as string[]
    const p2ids = [p.pareja2_j1, p.pareja2_j2].filter(Boolean) as string[]
    const sets1 = p.sets_pareja1 ?? 0
    const sets2 = p.sets_pareja2 ?? 0

    for (const id of p1ids) {
      const row = map.get(id)
      if (!row) continue
      row.partidos_jugados++
      row.sets_favor += sets1
      row.sets_contra += sets2
      if (p.ganador === 1) {
        row.puntos += 3
        row.partidos_ganados++
      } else {
        row.partidos_perdidos++
      }
    }

    for (const id of p2ids) {
      const row = map.get(id)
      if (!row) continue
      row.partidos_jugados++
      row.sets_favor += sets2
      row.sets_contra += sets1
      if (p.ganador === 2) {
        row.puntos += 3
        row.partidos_ganados++
      } else {
        row.partidos_perdidos++
      }
    }
  }

  return Array.from(map.values())
    .map(r => ({ ...r, diff_sets: r.sets_favor - r.sets_contra }))
    .sort((a, b) => b.puntos - a.puntos || b.diff_sets - a.diff_sets)
}
