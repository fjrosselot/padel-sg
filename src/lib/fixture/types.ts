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
  fase: 'grupo' | 'cuartos' | 'semifinal' | 'tercer_lugar' | 'final' | 'consolacion_cuartos' | 'consolacion_sf' | 'consolacion_final' | 'desafio'
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

export type FormatoCategoria = 'americano_grupos' | 'desafio_puntos' | 'desafio_sembrado'

export interface CategoriaFixture {
  nombre: string
  formato?: FormatoCategoria
  sexo?: 'M' | 'F' | 'Mixto'
  color_fondo?: string
  color_borde?: string
  color_texto?: string
  grupos: GrupoFixture[]
  faseEliminatoria: PartidoFixture[]
  consola: PartidoFixture[]
  partidos?: PartidoFixture[]
  rival_pairs?: string[]
}

export interface ConfigFixture {
  con_grupos: boolean
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
  formato?: FormatoCategoria
  rival_pairs?: string[]
  color_fondo?: string
  color_borde?: string
  color_texto?: string
}

export interface FixtureResult {
  categorias: CategoriaFixture[]
  config: ConfigFixture
}
