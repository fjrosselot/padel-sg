// ============================================================
// Cálculo de resultados de pádel
// Formato: 2 sets + supertiebreak (10 pts) si hay 1-1
// ============================================================

// Determina ganador de un set normal (primero en 6 con ventaja, o 7-6 tiebreak)
function ganadorSet(g1, g2) {
  if (g1 == null || g2 == null) return null
  const a = Number(g1), b = Number(g2)
  if ((a === 6 && b <= 4) || (a === 7 && b === 6) || (a === 6 && b === 5 && false)) return 1
  if ((b === 6 && a <= 4) || (b === 7 && a === 6)) return 2
  // Permissivo: si hay diferencia de 2 o más desde 6
  if (a >= 6 && a - b >= 2) return 1
  if (b >= 6 && b - a >= 2) return 2
  return null
}

// Determina ganador de supertiebreak (primero en 10 con +2 de diferencia)
function ganadorSupertiebreak(pts1, pts2) {
  if (pts1 == null || pts2 == null) return null
  const a = Number(pts1), b = Number(pts2)
  if (a >= 10 && a - b >= 2) return 1
  if (b >= 10 && b - a >= 2) return 2
  return null
}

/**
 * Calcula el resultado completo a partir de los sets ingresados.
 * @param {Array<{g1: number, g2: number}>} sets  — hasta 2 sets normales
 * @param {{pts1: number, pts2: number}|null} supertb — supertiebreak si hubo
 * @returns {{ sets_p1, sets_p2, games_p1, games_p2, ganador: 1|2|null, detalle }}
 */
export function calcularResultado(sets, supertb = null) {
  let sets_p1 = 0, sets_p2 = 0
  let games_p1 = 0, games_p2 = 0
  const detalle = []

  for (const { g1, g2 } of sets) {
    const g1n = Number(g1 ?? 0)
    const g2n = Number(g2 ?? 0)
    games_p1 += g1n
    games_p2 += g2n
    detalle.push({ g1: g1n, g2: g2n })
    const w = ganadorSet(g1n, g2n)
    if (w === 1) sets_p1++
    else if (w === 2) sets_p2++
  }

  let ganador = null

  // Caso normal: alguien ganó 2 sets
  if (sets_p1 === 2) ganador = 1
  else if (sets_p2 === 2) ganador = 2
  else if (sets_p1 === 1 && sets_p2 === 1 && supertb) {
    // Supertiebreak para desempate
    const pts1 = Number(supertb.pts1 ?? 0)
    const pts2 = Number(supertb.pts2 ?? 0)
    detalle.push({ supertiebreak: true, g1: pts1, g2: pts2 })
    games_p1 += pts1
    games_p2 += pts2
    ganador = ganadorSupertiebreak(pts1, pts2)
  }

  return {
    sets_pareja1: sets_p1,
    sets_pareja2: sets_p2,
    games_pareja1: games_p1,
    games_pareja2: games_p2,
    ganador,
    detalle_sets: JSON.stringify(detalle),
  }
}

// Formatea score para mostrar: "6-3  3-6  10-7"
export function formatearScore(detalleJson) {
  try {
    const sets = JSON.parse(detalleJson ?? '[]')
    return sets.map(s => `${s.g1}-${s.g2}`).join('  ')
  } catch {
    return ''
  }
}

// Valida que los sets tienen valores razonables antes de guardar
export function validarSets(sets, supertb) {
  if (!sets.length) return 'Ingresá al menos un set.'
  for (const { g1, g2 } of sets) {
    if (g1 === '' || g2 === '' || g1 == null || g2 == null) return 'Completá todos los games.'
    if (Number(g1) < 0 || Number(g2) < 0) return 'Los games no pueden ser negativos.'
  }
  const res = calcularResultado(sets, supertb)
  if (res.ganador === null) return 'Los sets ingresados no determinan un ganador válido.'
  return null
}
