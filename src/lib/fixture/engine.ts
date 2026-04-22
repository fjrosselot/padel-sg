import type {
  ParejaFixture,
  PartidoFixture,
  GrupoFixture,
  CategoriaFixture,
  ConfigFixture,
  CategoriaConfig,
} from './types'

let _matchCounter = 0
function nextId() { return `match_${++_matchCounter}` }

export function generateRoundRobin(
  parejas: ParejaFixture[],
  fase: PartidoFixture['fase'] = 'grupo',
  grupo: string | null = null
): PartidoFixture[] {
  const partidos: PartidoFixture[] = []
  const list = [...parejas]
  if (list.length % 2 !== 0) {
    list.push({ id: 'bye', nombre: 'BYE', jugador1_id: null, jugador2_id: null, elo1: 0, elo2: 0 })
  }
  const total = list.length
  let num = 1

  for (let round = 0; round < total - 1; round++) {
    for (let i = 0; i < total / 2; i++) {
      const p1 = list[i]
      const p2 = list[total - 1 - i]
      if (p1.id !== 'bye' && p2.id !== 'bye') {
        partidos.push({
          id: nextId(),
          fase,
          grupo,
          numero: num++,
          pareja1: p1,
          pareja2: p2,
          cancha: null,
          turno: null,
          ganador: null,
          resultado: null,
          resultado_bloqueado: false,
        })
      }
    }
    list.splice(1, 0, list.pop()!)
  }
  return partidos
}

export function buildGroups(
  parejas: ParejaFixture[],
  config: ConfigFixture,
  letraInicio: string = 'A'
): GrupoFixture[] {
  const { parejas_por_grupo } = config
  const numGrupos = Math.ceil(parejas.length / parejas_por_grupo)
  const groupArrays: ParejaFixture[][] = Array.from({ length: numGrupos }, () => [])

  const sorted = [...parejas].sort((a, b) => (b.elo1 + b.elo2) - (a.elo1 + a.elo2))
  sorted.forEach((p, i) => {
    groupArrays[i % numGrupos].push(p)
  })

  return groupArrays.map((gparejas, idx) => {
    const letra = String.fromCharCode(letraInicio.charCodeAt(0) + idx)
    const partidos = generateRoundRobin(gparejas, 'grupo', letra)
    return { letra, parejas: gparejas, partidos }
  })
}

export function buildPlayoffs(
  classified: ParejaFixture[],
  config: ConfigFixture
): PartidoFixture[] {
  const { con_consolacion, con_tercer_lugar } = config
  const partidos: PartidoFixture[] = []
  const n = classified.length

  if (n <= 1) return []

  if (n === 2) {
    partidos.push({
      id: nextId(), fase: 'final', grupo: null, numero: 1,
      pareja1: classified[0], pareja2: classified[1],
      cancha: null, turno: null, ganador: null, resultado: null, resultado_bloqueado: false,
    })
    return partidos
  }

  if (n >= 4) {
    partidos.push({
      id: nextId(), fase: 'semifinal', grupo: null, numero: 1,
      pareja1: classified[0], pareja2: classified[3],
      cancha: null, turno: null, ganador: null, resultado: null, resultado_bloqueado: false,
    })
    partidos.push({
      id: nextId(), fase: 'semifinal', grupo: null, numero: 2,
      pareja1: classified[1], pareja2: classified[2],
      cancha: null, turno: null, ganador: null, resultado: null, resultado_bloqueado: false,
    })

    if (con_consolacion) {
      partidos.push({
        id: nextId(), fase: 'consolacion_final', grupo: null, numero: 1,
        pareja1: null, pareja2: null,
        cancha: null, turno: null, ganador: null, resultado: null, resultado_bloqueado: false,
      })
    }

    if (con_tercer_lugar) {
      partidos.push({
        id: nextId(), fase: 'tercer_lugar', grupo: null, numero: 1,
        pareja1: null, pareja2: null,
        cancha: null, turno: null, ganador: null, resultado: null, resultado_bloqueado: false,
      })
    }
  }

  partidos.push({
    id: nextId(), fase: 'final', grupo: null, numero: 1,
    pareja1: null, pareja2: null,
    cancha: null, turno: null, ganador: null, resultado: null, resultado_bloqueado: false,
  })

  return partidos
}

function slotToTurno(slotIdx: number, config: ConfigFixture): string {
  const { hora_inicio, duracion_partido, pausa_entre_partidos } = config
  const slotMinutes = duracion_partido + pausa_entre_partidos
  const [startH, startM] = hora_inicio.split(':').map(Number)
  const totalMinutes = startH * 60 + startM + slotIdx * slotMinutes
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function distributeTurnos(
  partidos: PartidoFixture[],
  config: ConfigFixture
): PartidoFixture[] {
  const { num_canchas } = config
  // slot → pair IDs playing in that slot
  const slotPairs = new Map<number, Set<string>>()
  // slot → courts used
  const slotCourts = new Map<number, number>()

  return partidos.map(p => {
    const p1id = p.pareja1?.id
    const p2id = p.pareja2?.id

    // Find earliest slot with no conflict and a free court
    let slotIdx = 0
    while (true) {
      const playing = slotPairs.get(slotIdx) ?? new Set<string>()
      const courtsUsed = slotCourts.get(slotIdx) ?? 0
      const conflict = (p1id && p1id !== 'bye' && playing.has(p1id)) ||
                       (p2id && p2id !== 'bye' && playing.has(p2id))
      if (!conflict && courtsUsed < num_canchas) break
      slotIdx++
    }

    if (!slotPairs.has(slotIdx)) slotPairs.set(slotIdx, new Set())
    if (!slotCourts.has(slotIdx)) slotCourts.set(slotIdx, 0)

    const playing = slotPairs.get(slotIdx)!
    if (p1id && p1id !== 'bye') playing.add(p1id)
    if (p2id && p2id !== 'bye') playing.add(p2id)

    const cancha = slotCourts.get(slotIdx)! + 1
    slotCourts.set(slotIdx, cancha)

    return { ...p, cancha, turno: slotToTurno(slotIdx, config) }
  })
}

export function buildFixture(
  categoriaConfig: CategoriaConfig,
  parejas: ParejaFixture[],
  config: ConfigFixture
): CategoriaFixture {
  _matchCounter = 0
  const grupos = buildGroups(parejas, config)
  const todosGrupo = grupos.flatMap(g => g.partidos)
  const conTurnos = distributeTurnos(todosGrupo, config)

  const gruposConTurnos: GrupoFixture[] = grupos.map(g => ({
    ...g,
    partidos: conTurnos.filter(p => p.grupo === g.letra),
  }))

  const classified = grupos.flatMap(g => g.parejas.slice(0, config.cuantos_avanzan))
  const playoffs = buildPlayoffs(classified, config)

  const consola = playoffs.filter(p =>
    p.fase === 'consolacion_sf' || p.fase === 'consolacion_final'
  )
  const bracket = playoffs.filter(p =>
    p.fase !== 'consolacion_sf' && p.fase !== 'consolacion_final'
  )

  return {
    nombre: categoriaConfig.nombre,
    formato: categoriaConfig.formato ?? 'americano_grupos',
    grupos: gruposConTurnos,
    faseEliminatoria: bracket,
    consola,
  }
}

export function buildDesafioFixture(
  cat: CategoriaConfig,
  parejas: ParejaFixture[],
  config: ConfigFixture
): CategoriaFixture {
  _matchCounter = 0
  const [h, m] = config.hora_inicio.split(':').map(Number)
  const slot = config.duracion_partido + config.pausa_entre_partidos

  const partidos: PartidoFixture[] = parejas.map((pareja, idx) => {
    const cancha = (idx % config.num_canchas) + 1
    const ronda = Math.floor(idx / config.num_canchas)
    const minuteOffset = ronda * slot

    const totalMinutes = h * 60 + m + minuteOffset
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const mm = String(totalMinutes % 60).padStart(2, '0')

    return {
      id: nextId(),
      fase: 'desafio',
      grupo: null,
      numero: idx + 1,
      pareja1: pareja,
      pareja2: null,
      cancha,
      turno: `${hh}:${mm}`,
      ganador: null,
      resultado: null,
      resultado_bloqueado: false,
    }
  })

  return {
    nombre: cat.nombre,
    formato: 'desafio_puntos',
    grupos: [],
    faseEliminatoria: [],
    consola: [],
    partidos,
  }
}
