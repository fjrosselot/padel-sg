// ============================================================
// Fixture engine — generación automática de partidos
// ============================================================

// Método de rotación circular (polygon method) para round robin
function roundRobinRondas(posiciones) {
  const arr = [...posiciones]
  if (arr.length % 2 !== 0) arr.push('bye')
  const N = arr.length
  const fijo = arr[0]
  const rotando = arr.slice(1)
  const rondas = []

  for (let r = 0; r < N - 1; r++) {
    const actual = [fijo, ...rotando]
    const ronda = []
    for (let i = 0; i < N / 2; i++) {
      const a = actual[i]
      const b = actual[N - 1 - i]
      if (a !== 'bye' && b !== 'bye') ronda.push({ a, b })
    }
    rondas.push(ronda)
    rotando.unshift(rotando.pop())
  }
  return rondas
}

// Distribuye N parejas en grupos equilibrados
function distribuirEnGrupos(nParejas, tamGrupo) {
  const numGrupos = Math.ceil(nParejas / tamGrupo)
  const grupos = Array.from({ length: numGrupos }, (_, g) => ({
    letra: String.fromCharCode(65 + g),
    posiciones: [],
  }))
  // Distribución serpentina para equilibrar tamaños
  for (let i = 0; i < nParejas; i++) {
    grupos[i % numGrupos].posiciones.push(`${grupos[i % numGrupos].letra}${Math.floor(i / numGrupos) + 1}`)
  }
  return grupos
}

function nombreFase(nPartidos) {
  const mapa = { 1: 'Final', 2: 'Semifinales', 4: 'Cuartos de final', 8: 'Octavos de final' }
  return mapa[nPartidos] ?? `Ronda de ${nPartidos * 2}`
}

// Genera la estructura del bracket eliminatorio
function estructuraBracket(nClasificados, tercer_lugar) {
  let size = 1
  while (size < nClasificados) size *= 2
  const byes = size - nClasificados

  const fases = []
  let s = size
  while (s >= 2) {
    fases.push({ nombre: nombreFase(s / 2), partidos: s / 2 })
    s /= 2
  }
  if (tercer_lugar && fases.length > 0) {
    // Partido por 3er/4to lugar (misma jornada que la final)
    fases[fases.length - 1].extra = 1
  }
  const total = fases.reduce((acc, f) => acc + f.partidos + (f.extra ?? 0), 0)
  return { fases, total, size, byes }
}

// Calcula cuántos bloques entran en una jornada
export function calcularBloquesPorJornada(horaInicio, horaFin, duracionMin) {
  const toMin = h => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm }
  return Math.floor((toMin(horaFin) - toMin(horaInicio)) / duracionMin)
}

// Calcula cuántas jornadas se necesitan
export function calcularJornadas(totalPartidos, numCanchas, bloquesPorJornada) {
  const capacidad = numCanchas * bloquesPorJornada
  if (capacidad === 0) return { capacidad: 0, jornadas: 0 }
  return {
    capacidad,
    jornadas: Math.ceil(totalPartidos / capacidad),
  }
}

// ============================================================
// Función principal: calcula la estructura completa del torneo
// ============================================================
export function calcularEstructura(config) {
  const {
    max_parejas,
    formato,
    tam_grupo = 4,
    pasan_por_grupo = 2,
    tercer_lugar = true,
  } = config

  if (formato === 'round_robin') {
    const posiciones = Array.from({ length: max_parejas }, (_, i) => `P${i + 1}`)
    const rondas = roundRobinRondas(posiciones)
    const totalPartidos = rondas.reduce((acc, r) => acc + r.length, 0)
    return {
      formato,
      grupos: [{ letra: 'RR', posiciones, rondas }],
      partidos_grupos: totalPartidos,
      bracket: null,
      partidos_bracket: 0,
      total_partidos: totalPartidos,
    }
  }

  if (formato === 'grupos_eliminatoria') {
    const grupos = distribuirEnGrupos(max_parejas, tam_grupo)
    let totalGrupos = 0
    const gruposConRondas = grupos.map(g => {
      const rondas = roundRobinRondas(g.posiciones)
      const nPartidos = rondas.reduce((acc, r) => acc + r.length, 0)
      totalGrupos += nPartidos
      return { ...g, rondas, partidos: nPartidos }
    })

    const clasificados = grupos.length * pasan_por_grupo
    const bracket = estructuraBracket(clasificados, tercer_lugar)

    return {
      formato,
      grupos: gruposConRondas,
      partidos_grupos: totalGrupos,
      bracket,
      partidos_bracket: bracket.total,
      total_partidos: totalGrupos + bracket.total,
    }
  }

  if (formato === 'eliminacion_directa') {
    const bracket = estructuraBracket(max_parejas, tercer_lugar)
    return {
      formato,
      grupos: null,
      partidos_grupos: 0,
      bracket,
      partidos_bracket: bracket.total,
      total_partidos: bracket.total,
    }
  }

  return null
}

// ============================================================
// Asigna jornada, bloque y cancha a una lista plana de partidos
// ============================================================
export function asignarTurnos(partidos, numCanchas, bloquesPorJornada) {
  let jornada = 1, bloque = 1, cancha = 1
  return partidos.map(p => {
    const resultado = {
      ...p,
      jornada,
      bloque,
      cancha,
      turno: `J${jornada} / Bl.${bloque} / C${cancha}`,
    }
    cancha++
    if (cancha > numCanchas) {
      cancha = 1
      bloque++
      if (bloque > bloquesPorJornada) {
        bloque = 1
        jornada++
      }
    }
    return resultado
  })
}

// Genera la lista plana de partidos (fase de grupos) para asignar turnos
export function listaPartidosGrupos(grupos) {
  const partidos = []
  grupos?.forEach(g => {
    g.rondas?.forEach((ronda, ri) => {
      ronda.forEach(({ a, b }) => {
        partidos.push({ grupo: g.letra, ronda: ri + 1, a, b })
      })
    })
  })
  return partidos
}
