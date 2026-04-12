// ============================================================
// Cálculo de ranking por temporada
// ============================================================

// Puntos por desempeño (sistema 'puntos')
const PUNTOS_TORNEO = {
  participo:   5,   // por partido de grupos jugado (ganado o perdido)
  ganó_grupo:  3,   // bonus por cada victoria en grupos
  clasificó:   10,  // avanzar del grupo al bracket
  ganó_octavos: 8,
  ganó_cuartos: 12,
  ganó_semifinal: 18,
  subcampeón:   25,
  campeón:      40,
  tercer_lugar: 15,
}

const ELO_K = 32

function eloEsperado(rA, rB) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400))
}

/**
 * Calcula ranking desde los datos de un torneo finalizado.
 * @param {Array} partidos — todos los partidos del torneo (grupos + bracket)
 * @param {string} torneoId
 * @param {string} sistema — 'puntos' | 'elo' | 'wdl'
 * @param {Object} wizardConfig
 * @returns {Map<jugadorId, { pts, PJ, PG, PP, SW, SL, GW, GL }>}
 */
export function calcularRankingTorneo(partidos, sistema, wizardConfig = {}) {
  const jugadores = new Map()

  function get(id) {
    if (!jugadores.has(id)) {
      jugadores.set(id, { pts: sistema === 'elo' ? 1200 : 0, PJ: 0, PG: 0, PP: 0, SW: 0, SL: 0, GW: 0, GL: 0 })
    }
    return jugadores.get(id)
  }

  function registrarPar(j1, j2, gano, fase, sets_f, sets_c, games_f, games_c) {
    if (!j1 || !j2) return
    ;[j1, j2].forEach(id => {
      const e = get(id)
      e.PJ++
      e.SW += sets_f ?? 0;  e.SL += sets_c ?? 0
      e.GW += games_f ?? 0; e.GL += games_c ?? 0
      if (gano) { e.PG++; } else { e.PP++ }
    })
  }

  for (const p of partidos) {
    if (p.estado !== 'jugado') continue

    const j1_ids = [p.pareja1_j1, p.pareja1_j2].filter(Boolean)
    const j2_ids = [p.pareja2_j1, p.pareja2_j2].filter(Boolean)

    const p1gana = p.ganador === 1

    // Acumular estadísticas
    j1_ids.forEach(id => registrarPar(id, null, p1gana, p.fase, p.sets_pareja1, p.sets_pareja2, p.games_pareja1, p.games_pareja2))
    j2_ids.forEach(id => registrarPar(id, null, !p1gana, p.fase, p.sets_pareja2, p.sets_pareja1, p.games_pareja2, p.games_pareja1))

    if (sistema === 'puntos') {
      // Puntos base por participar
      ;[...j1_ids, ...j2_ids].forEach(id => { get(id).pts += PUNTOS_TORNEO.participo })

      if (p.fase === 'grupo') {
        ;(p1gana ? j1_ids : j2_ids).forEach(id => { get(id).pts += PUNTOS_TORNEO.ganó_grupo })
      } else if (p.fase !== 'tercer_lugar') {
        // Bracket match
        const ganadorIds = p1gana ? j1_ids : j2_ids
        const faseBonus = {
          octavos:   PUNTOS_TORNEO.ganó_octavos,
          cuartos:   PUNTOS_TORNEO.ganó_cuartos,
          semifinal: PUNTOS_TORNEO.ganó_semifinal,
          final:     PUNTOS_TORNEO.campeón,
        }
        const bonus = faseBonus[p.fase] ?? 5
        ganadorIds.forEach(id => { get(id).pts += bonus })

        // Subcampeón (pierde la final)
        if (p.fase === 'final') {
          const perdedorIds = p1gana ? j2_ids : j1_ids
          perdedorIds.forEach(id => { get(id).pts += PUNTOS_TORNEO.subcampeón })
        }
      } else {
        // 3° lugar
        ;(p1gana ? j1_ids : j2_ids).forEach(id => { get(id).pts += PUNTOS_TORNEO.tercer_lugar })
      }
    }

    if (sistema === 'elo') {
      // ELO promedio de la pareja
      const elo1 = (get(j1_ids[0] ?? '').pts + get(j1_ids[1] ?? '').pts) / (j1_ids.length || 1)
      const elo2 = (get(j2_ids[0] ?? '').pts + get(j2_ids[1] ?? '').pts) / (j2_ids.length || 1)
      const ea = eloEsperado(elo1, elo2)
      const delta1 = Math.round(ELO_K * ((p1gana ? 1 : 0) - ea))
      j1_ids.forEach(id => { get(id).pts += delta1 })
      j2_ids.forEach(id => { get(id).pts -= delta1 })
    }
  }

  return jugadores
}

/**
 * Combina rankings de múltiples torneos en la temporada.
 * @param {Array<Map>} rankingsMaps
 * @param {string} sistema
 * @returns {Map<jugadorId, combinado>}
 */
export function combinarRankings(rankingsMaps, sistema) {
  const total = new Map()
  for (const mapa of rankingsMaps) {
    for (const [id, datos] of mapa.entries()) {
      if (!total.has(id)) {
        total.set(id, { pts: sistema === 'elo' ? 1200 : 0, PJ: 0, PG: 0, PP: 0, SW: 0, SL: 0, GW: 0, GL: 0 })
      }
      const t = total.get(id)
      t.PJ += datos.PJ;  t.PG += datos.PG;  t.PP += datos.PP
      t.SW += datos.SW;  t.SL += datos.SL
      t.GW += datos.GW;  t.GL += datos.GL
      t.pts = sistema === 'elo' ? datos.pts : t.pts + datos.pts
    }
  }
  return total
}

/** Ordena jugadores del ranking para mostrar */
export function ordenarRanking(jugadoresMap, sistema) {
  return [...jugadoresMap.entries()]
    .map(([id, d]) => ({
      id,
      pts: Math.round(d.pts),
      PJ: d.PJ, PG: d.PG, PP: d.PP,
      SW: d.SW, SL: d.SL, GW: d.GW, GL: d.GL,
      pct: d.PJ > 0 ? Math.round((d.PG / d.PJ) * 100) : 0,
    }))
    .sort((a, b) => {
      if (sistema === 'wdl') return b.pct - a.pct || b.PG - a.PG
      return b.pts - a.pts || b.PG - a.PG
    })
}
