import { useQuery } from '@tanstack/react-query'
import { supabase, type Temporada } from '@/lib/supabase'

export function useTemporadas() {
  return useQuery<Temporada[]>({
    queryKey: ['temporadas'],
    queryFn: async () => {
      const { data } = await supabase
        .schema('padel')
        .from('temporadas')
        .select('*')
        .order('fecha_inicio', { ascending: false })
      return data ?? []
    },
  })
}
