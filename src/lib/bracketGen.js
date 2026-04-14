// ============================================================
// Generación del bracket eliminatorio
// ============================================================

const FASE_POR_N = { 2: 'final', 4: 'semifinal', 8: 'cuartos', 16: 'octavos' }

function faseParaN(n) {
  return FASE_POR_N[n] ?? `ronda_${n}`
}

/**
 * Genera la primera ronda del bracket con seeding estándar crossover.
 * clasificados: [{grupo, pos, j1, j2, pareja1_j1?, pareja1_j2?}]
 *   (j1/j2 son objetos con id, nombre)
 */
export function generarPrimeraRonda(clasificados, torneoId) {
  // Separar por posición dentro del grupo
  const porPos = {}
  for (const c of clasificados) {
    if (!porPos[c.pos]) porPos[c.pos] = []
    porPos[c.pos].push(c)
  }

  // Todos los clasificados en orden de seeding:
  // primeros por grupo (A, B, C...) luego segundos (A, B, C...) etc.
  const grupos = [...new Set(clasificados.map(c => c.grupo))].sort()
  const seeds = []
  const posiciones = Object.keys(porPos).map(Number).sort()
  for (const pos of posiciones) {
    for (const g of grupos) {
      const e = clasificados.find(c => c.grupo === g && c.pos === pos)
      if (e) seeds.push(e)
    }
  }

  const n = seeds.length
  if (n < 2) return []

  // Standard bracket: 1 vs n, 2 vs n-1, etc.
  const partidos = []
  const mitad = Math.floor(n / 2)
  const fase = faseParaN(n)

  for (let i = 0; i < mitad; i++) {
    const s1 = seeds[i]
    const s2 = seeds[n - 1 - i]
    if (!s1 || !s2) continue
    partidos.push({
      torneo_id:      torneoId,
      tipo:           'torneo',
      fase,
      grupo:          null,
      pareja1_j1:     s1.j1?.id,
      pareja1_j2:     s1.j2?.id,
      pareja2_j1:     s2.j1?.id,
      pareja2_j2:     s2.j2?.id,
      posicion_bracket: `R1-${i + 1}`,
      estado:         'pendiente',
      detalle_sets:   '[]',
      deporte_id:     'padel',
    })
  }

  return partidos
}

/**
 * Genera la siguiente ronda a partir de los matches completados.
 * Empareja ganadores: match 1 vs match 2, match 3 vs match 4, etc.
 */
export function generarSiguienteRonda(matchesActuales, torneoId) {
  const sorted = [...matchesActuales].sort((a, b) => {
    const posA = parseInt(a.posicion_bracket?.split('-')[1] ?? '0')
    const posB = parseInt(b.posicion_bracket?.split('-')[1] ?? '0')
    return posA - posB
  })

  const rondaActual = parseInt(matchesActuales[0]?.posicion_bracket?.split('-')[0]?.replace('R', '') ?? '1')
  const proximaRonda = rondaActual + 1
  const n = Math.floor(sorted.length / 2)
  const fase = faseParaN(n)

  const partidos = []
  for (let i = 0; i < sorted.length; i += 2) {
    const m1 = sorted[i]
    const m2 = sorted[i + 1]
    if (!m1 || !m2) continue

    const g1 = m1.ganador === 1
      ? { j1: m1.pareja1_j1, j2: m1.pareja1_j2 }
      : { j1: m1.pareja2_j1, j2: m1.pareja2_j2 }
    const g2 = m2.ganador === 1
      ? { j1: m2.pareja1_j1, j2: m2.pareja1_j2 }
      : { j1: m2.pareja2_j1, j2: m2.pareja2_j2 }

    partidos.push({
      torneo_id:        torneoId,
      tipo:             'torneo',
      fase,
      grupo:            null,
      pareja1_j1:       g1.j1,
      pareja1_j2:       g1.j2,
      pareja2_j1:       g2.j1,
      pareja2_j2:       g2.j2,
      posicion_bracket: `R${proximaRonda}-${i / 2 + 1}`,
      estado:           'pendiente',
      detalle_sets:     '[]',
      deporte_id:       'padel',
    })
  }

  return partidos
}

/**
 * Genera el partido por 3° y 4° lugar (perdedores de semifinal).
 */
export function generarTercerLugar(semifinales, torneoId) {
  const sorted = [...semifinales].sort((a, b) => {
    const posA = parseInt(a.posicion_bracket?.split('-')[1] ?? '0')
    const posB = parseInt(b.posicion_bracket?.split('-')[1] ?? '0')
    return posA - posB
  })

  const perdedores = sorted.map(m => m.ganador === 1
    ? { j1: m.pareja2_j1, j2: m.pareja2_j2 }
    : { j1: m.pareja1_j1, j2: m.pareja1_j2 })

  if (perdedores.length < 2) return []

  return [{
    torneo_id:        torneoId,
    tipo:             'torneo',
    fase:             'tercer_lugar',
    grupo:            null,
    pareja1_j1:       perdedores[0].j1,
    pareja1_j2:       perdedores[0].j2,
    pareja2_j1:       perdedores[1].j1,
    pareja2_j2:       perdedores[1].j2,
    posicion_bracket: 'T-1',
    estado:           'pendiente',
    detalle_sets:     '[]',
    deporte_id:       'padel',
  }]
}

/** Orden de display de fases en el bracket */
export const FASE_ORDEN = ['octavos', 'cuartos', 'semifinal', 'tercer_lugar', 'final']
export const FASE_LABEL = {
  octavos:      'Octavos de final',
  cuartos:      'Cuartos de final',
  semifinal:    'Semifinales',
  tercer_lugar: '3° y 4° lugar',
  final:        'Final',
}
