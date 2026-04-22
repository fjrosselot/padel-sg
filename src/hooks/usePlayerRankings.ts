import { useQuery } from '@tanstack/react-query'
import { padelApi } from '@/lib/padelApi'

export interface PlayerRankingEntry {
  categoria: string
  sexo: string
  puntos_total: number
  eventos_jugados: number
  posicion: number
}

export function usePlayerRankings(jugadorId: string | undefined) {
  return useQuery({
    queryKey: ['player-rankings', jugadorId],
    queryFn: () =>
      padelApi.rpc<PlayerRankingEntry[]>('get_player_rankings', { p_jugador_id: jugadorId }),
    enabled: !!jugadorId,
  })
}
