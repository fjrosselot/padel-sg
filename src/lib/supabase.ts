import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

const IS_DEV_BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS === 'true'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  IS_DEV_BYPASS && import.meta.env.VITE_SUPABASE_SERVICE_KEY
    ? import.meta.env.VITE_SUPABASE_SERVICE_KEY
    : import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export type Jugador = Database['padel']['Tables']['jugadores']['Row']
export type Temporada = Database['padel']['Tables']['temporadas']['Row']
export type Torneo = Database['padel']['Tables']['torneos']['Row']
export type Partido = Database['padel']['Tables']['partidos']['Row']
export type Liga = Database['padel']['Tables']['ligas']['Row']
export type Anuncio = Database['padel']['Tables']['anuncios']['Row']
