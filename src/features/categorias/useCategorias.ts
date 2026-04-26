import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/types/database.types'

export type CategoriaRow = Database['padel']['Tables']['categorias']['Row']

export const FALLBACK_COLORS = {
  color_fondo: '#f1f5f9',
  color_borde: '#94a3b8',
  color_texto: '#334155',
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('padel')
        .from('categorias')
        .select('*')
        .order('orden')
      if (error) throw error
      return data as CategoriaRow[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
