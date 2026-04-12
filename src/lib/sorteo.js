// ============================================================
// Sorteo de grupos — lógica cliente (fallback / preview)
// La versión definitiva usa padel.sortear_grupos() en Supabase
// ============================================================

// Mezcla aleatoria Fisher-Yates
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Distribución serpentina en grupos
function distribuirEnGrupos(parejas, tamGrupo) {
  const numGrupos = Math.ceil(parejas.length / tamGrupo)
  const grupos = Array.from({ length: numGrupos }, (_, g) => ({
    letra: String.fromCharCode(65 + g),
    parejas: [],
  }))
  for (let i = 0; i < parejas.length; i++) {
    grupos[i % numGrupos].parejas.push(parejas[i])
  }
  return grupos
}

// Genera partidos round-robin para un grupo (polygon method)
function partidosRR(grupo, torneoId) {
  const arr = [...grupo.parejas]
  if (arr.length % 2 !== 0) arr.push(null) // bye
  const N = arr.length
  const fijo = arr[0]
  const rotando = arr.slice(1)
  const partidos = []

  for (let r = 0; r < N - 1; r++) {
    const actual = [fijo, ...rotando]
    for (let i = 0; i < N / 2; i++) {
      const p1 = actual[i]
      const p2 = actual[N - 1 - i]
      if (p1 && p2) {
        partidos.push({
          torneo_id: torneoId,
          tipo: 'torneo',
          fase: 'grupo',
          grupo: grupo.letra,
          pareja1_j1: p1.jugador1_id,
          pareja1_j2: p1.jugador2_id,
          pareja2_j1: p2.jugador1_id,
          pareja2_j2: p2.jugador2_id,
          estado: 'pendiente',
          detalle_sets: '[]',
          deporte_id: 'padel',
        })
      }
    }
    rotando.unshift(rotando.pop())
  }
  return partidos
}

// Exportada: genera la lista de partidos a insertar
export function generarPartidosGrupos(inscripciones, wizardConfig, torneoId) {
  const { tam_grupo = 4, formato = 'grupos_eliminatoria' } = wizardConfig
  const mezcladas = shuffle(inscripciones)

  if (formato === 'round_robin') {
    return partidosRR({ letra: 'RR', parejas: mezcladas }, torneoId)
  }

  const grupos = distribuirEnGrupos(mezcladas, tam_grupo)
  return grupos.flatMap(g => partidosRR(g, torneoId))
}

// Previsualización de grupos (sin IDs reales, solo nombres)
export function previsualizarSorteo(inscripciones, wizardConfig) {
  const { tam_grupo = 4, formato = 'grupos_eliminatoria' } = wizardConfig
  const mezcladas = shuffle(inscripciones)
  if (formato === 'round_robin') return [{ letra: 'RR', parejas: mezcladas }]
  return distribuirEnGrupos(mezcladas, tam_grupo)
}
