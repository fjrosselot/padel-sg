import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { db: { schema: 'padel' } },
)

export type Jugador = Database['padel']['Tables']['jugadores']['Row']
export type Temporada = Database['padel']['Tables']['temporadas']['Row']
export type Torneo = Database['padel']['Tables']['torneos']['Row']
export type Partido = Database['padel']['Tables']['partidos']['Row']
export type Liga = Database['padel']['Tables']['ligas']['Row']
export type Anuncio = Database['padel']['Tables']['anuncios']['Row']
