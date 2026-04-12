// ============================================================
// Tabla de posiciones — fase de grupos
// ============================================================

function initEntry(key, j1, j2) {
  return { key, j1, j2, PJ: 0, PG: 0, PP: 0, SW: 0, SL: 0, GW: 0, GL: 0, Pts: 0 }
}

function cmp(a, b) {
  if (b.Pts !== a.Pts) return b.Pts - a.Pts
  const srA = (a.SW + a.SL) > 0 ? a.SW / (a.SW + a.SL) : 0
  const srB = (b.SW + b.SL) > 0 ? b.SW / (b.SW + b.SL) : 0
  if (Math.abs(srB - srA) > 0.0001) return srB - srA
  const grA = (a.GW + a.GL) > 0 ? a.GW / (a.GW + a.GL) : 0
  const grB = (b.GW + b.GL) > 0 ? b.GW / (b.GW + b.GL) : 0
  return grB - grA
}

/**
 * Calcula standings a partir de los partidos de grupos.
 * @param {Array} partidos — con p1j1, p1j2, p2j1, p2j2 (joined)
 * @returns {{ [grupoLetra]: Array<entry> }} ordenado por posición
 */
export function calcularStandings(partidos) {
  const grupos = {}

  for (const p of partidos) {
    const g = p.grupo
    if (!g) continue
    if (!grupos[g]) grupos[g] = {}

    const k1 = `${p.pareja1_j1}_${p.pareja1_j2}`
    const k2 = `${p.pareja2_j1}_${p.pareja2_j2}`

    if (!grupos[g][k1]) grupos[g][k1] = initEntry(k1, p.p1j1, p.p1j2)
    if (!grupos[g][k2]) grupos[g][k2] = initEntry(k2, p.p2j1, p.p2j2)

    if (p.estado !== 'jugado') continue

    const e1 = grupos[g][k1]
    const e2 = grupos[g][k2]

    e1.PJ++; e2.PJ++
    e1.SW += p.sets_pareja1 ?? 0;  e1.SL += p.sets_pareja2 ?? 0
    e2.SW += p.sets_pareja2 ?? 0;  e2.SL += p.sets_pareja1 ?? 0
    e1.GW += p.games_pareja1 ?? 0; e1.GL += p.games_pareja2 ?? 0
    e2.GW += p.games_pareja2 ?? 0; e2.GL += p.games_pareja1 ?? 0

    if (p.ganador === 1)      { e1.PG++; e1.Pts += 2; e2.PP++ }
    else if (p.ganador === 2) { e2.PG++; e2.Pts += 2; e1.PP++ }
  }

  const result = {}
  for (const [letra, equipos] of Object.entries(grupos)) {
    result[letra] = Object.values(equipos).sort(cmp)
  }
  return result
}

/**
 * Extrae los clasificados al bracket a partir de los standings.
 * @param {{ [letra]: Array<entry> }} standings
 * @param {number} pasanPorGrupo
 * @returns {Array<{ grupo, pos, ...entry }>}
 */
export function obtenerClasificados(standings, pasanPorGrupo = 2) {
  const result = []
  for (const [letra, tabla] of Object.entries(standings)) {
    for (let i = 0; i < Math.min(pasanPorGrupo, tabla.length); i++) {
      result.push({ grupo: letra, pos: i + 1, ...tabla[i] })
    }
  }
  return result
}

/** Nombre corto de una pareja */
export function nombrePareja(j1, j2) {
  const n = j => j?.apodo || j?.nombre?.split(' ')[0] || '?'
  return `${n(j1)} / ${n(j2)}`
}
