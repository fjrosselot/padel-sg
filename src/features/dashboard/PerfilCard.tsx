import type { Jugador } from '@/lib/supabase'
import type { PlayerRankingEntry } from '@/hooks/usePlayerRankings'

interface Props {
  user: Jugador | null | undefined
  stats: { jugados: number; victorias: number } | undefined
  rankings: PlayerRankingEntry[] | undefined
  torneosJugados: number | undefined
}

export function PerfilCard({ user, stats, rankings, torneosJugados }: Props) {
  const nombre = user?.nombre_pila ?? user?.nombre?.split(' ')[0] ?? ''
  const apellido = user?.apellido ?? ''
  const initials = `${nombre[0] ?? 'J'}${apellido[0] ?? ''}`.toUpperCase()

  const jugados = stats?.jugados ?? 0
  const victorias = stats?.victorias ?? 0
  const winRate = jugados > 0 ? Math.round((victorias / jugados) * 100) : null
  const bestRanking = rankings?.[0]

  const statsRow = [
    { label: 'Ranking',  value: bestRanking ? `#${bestRanking.posicion}` : '—', sub: bestRanking ? `${bestRanking.puntos_total} pts` : undefined },
    { label: 'Torneos',  value: torneosJugados ?? '—',                           sub: 'jugados' as string | undefined },
    { label: 'Partidos', value: jugados || '—',                                  sub: undefined as string | undefined },
    { label: 'Ganados',  value: victorias || '—',                                sub: winRate !== null ? `${winRate}%` : undefined },
  ]

  return (
    <div className="rounded-xl overflow-hidden shadow-card">
      <div className="px-5 py-3.5 flex items-center gap-3.5 bg-navy">
        {user?.foto_url ? (
          <img src={user.foto_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-manrope font-bold text-sm shrink-0 bg-gold text-navy">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-manrope text-base font-bold text-white leading-tight">{nombre} {apellido}</p>
          <p className="font-inter text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Rama Pádel Saint George's
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-manrope text-2xl font-bold text-gold leading-none">{user?.categoria ?? '—'}</p>
          <p className="font-inter text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Categoría</p>
        </div>
      </div>
      <div className="grid grid-cols-4 bg-white">
        {statsRow.map((s, i) => (
          <div key={s.label} className="py-2.5 text-center" style={{ borderRight: i < 3 ? '1px solid rgba(22,40,68,0.08)' : 'none' }}>
            <p className="font-manrope text-xl font-bold text-navy leading-none">{String(s.value)}</p>
            <p className="font-inter text-[10px] uppercase tracking-wider text-muted mt-1">{s.label}</p>
            {s.sub && <p className="font-inter text-[9px] text-muted/80 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
