export interface ParejaFixture {
  id: string
  nombre: string
  jugador1_id: string | null
  jugador2_id: string | null
  elo1: number
  elo2: number
}

export interface PartidoFixture {
  id: string
  fase: 'grupo' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final' | 'consolacion_sf' | 'consolacion_final'
  grupo: string | null
  numero: number
  pareja1: ParejaFixture | null
  pareja2: ParejaFixture | null
  cancha: number | null
  turno: string | null
  ganador: 1 | 2 | null
  resultado: string | null
  resultado_bloqueado: boolean
}

export interface GrupoFixture {
  letra: string
  parejas: ParejaFixture[]
  partidos: PartidoFixture[]
}

export interface CategoriaFixture {
  nombre: string
  grupos: GrupoFixture[]
  faseEliminatoria: PartidoFixture[]
  consola: PartidoFixture[]
}

export interface ConfigFixture {
  parejas_por_grupo: number
  cuantos_avanzan: number
  con_consolacion: boolean
  con_tercer_lugar: boolean
  duracion_partido: number
  pausa_entre_partidos: number
  num_canchas: number
  hora_inicio: string
  fixture_compacto: boolean
}

export interface CategoriaConfig {
  nombre: string
  num_parejas: number
  sexo: 'M' | 'F' | 'Mixto'
}

export interface FixtureResult {
  categorias: CategoriaFixture[]
  config: ConfigFixture
}
