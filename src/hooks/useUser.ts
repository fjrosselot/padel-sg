import { useQuery } from '@tanstack/react-query'
import { supabase, type Jugador } from '@/lib/supabase'
import { DEV_USER, IS_DEV_BYPASS } from '@/lib/devUser'

export function useUser() {
  return useQuery<Jugador | null>({
    queryKey: ['user'],
    queryFn: async () => {
      if (IS_DEV_BYPASS) return DEV_USER
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
