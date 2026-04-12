import { useQuery } from '@tanstack/react-query'
import { supabase, type Jugador } from '@/lib/supabase'

export function useUser() {
  return useQuery<Jugador | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('*')
        .eq('id', user.id)
        .single()
      return data ?? null
    },
  })
}
