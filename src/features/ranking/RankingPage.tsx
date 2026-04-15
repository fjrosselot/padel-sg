import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Jugador } from '../../lib/supabase'

export default function RankingPage() {
  const { data: jugadores, isLoading } = useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo, categoria, elo, foto_url')
        .eq('estado_cuenta', 'activo')
        .order('elo', { ascending: false })
      if (error) throw error
      return data as Pick<Jugador, 'id' | 'nombre' | 'apodo' | 'categoria' | 'elo' | 'foto_url'>[]
    },
  })

  if (isLoading) return <div className="p-6 text-muted">Cargando ranking…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Ranking ELO</h1>
      </div>

      {!jugadores || jugadores.length === 0 ? (
        <div className="rounded-xl bg-white shadow-card p-8 text-center">
          <p className="font-inter text-sm text-muted">Sin jugadores activos en el ranking.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-card overflow-hidden">
          {jugadores.map((jugador, idx) => (
            <div
              key={jugador.id}
              className={`flex items-center gap-4 px-4 py-3 ${
                idx !== (jugadores.length - 1) ? 'border-b border-surface-high' : ''
              }`}
            >
              <span className={`w-7 shrink-0 font-manrope text-sm font-bold ${
                idx === 0 ? 'text-gold' : idx === 1 ? 'text-slate' : idx === 2 ? 'text-[#CD7F32]' : 'text-muted'
              }`}>
                #{idx + 1}
              </span>

              <div className="h-9 w-9 shrink-0 rounded-full bg-navy flex items-center justify-center overflow-hidden">
                {jugador.foto_url
                  ? <img src={jugador.foto_url} alt={jugador.nombre} className="h-full w-full object-cover" />
                  : <span className="font-manrope text-xs font-bold text-gold">
                      {jugador.nombre.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                    </span>
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-manrope text-sm font-bold text-navy truncate">
                  {jugador.apodo ?? jugador.nombre.split(' ')[0]}
                </p>
                {jugador.categoria && (
                  <p className="font-inter text-xs text-muted">{jugador.categoria}</p>
                )}
              </div>

              <span className="font-manrope text-lg font-bold text-navy shrink-0">
                {jugador.elo}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
