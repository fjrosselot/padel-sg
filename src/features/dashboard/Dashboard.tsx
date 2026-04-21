import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, BarChart3, Handshake, Medal } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { padelApi } from '@/lib/padelApi'

const QUICK_LINKS = [
  { to: '/torneos', icon: Trophy, label: 'Torneos', desc: 'Inscripciones y resultados' },
  { to: '/ligas', icon: BarChart3, label: 'Ligas', desc: 'Round robin y escalerilla' },
  { to: '/amistosos', icon: Handshake, label: 'Amistosos', desc: 'Partidos libres' },
  { to: '/rankings', icon: Medal, label: 'Ranking', desc: 'Rankings por categoría' },
]

export function Dashboard() {
  const { data: user } = useUser()
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const data = await padelApi.get<{
        pareja1_j1: string | null
        pareja1_j2: string | null
        pareja2_j1: string | null
        pareja2_j2: string | null
        ganador: 1 | 2 | null
      }[]>(
        `partidos?select=pareja1_j1,pareja1_j2,pareja2_j1,pareja2_j2,ganador&estado=eq.jugado&or=(pareja1_j1.eq.${user!.id},pareja1_j2.eq.${user!.id},pareja2_j1.eq.${user!.id},pareja2_j2.eq.${user!.id})`
      )
      const jugados = data.length
      const victorias = data.filter(p => {
        const enPareja1 = p.pareja1_j1 === user!.id || p.pareja1_j2 === user!.id
        const enPareja2 = p.pareja2_j1 === user!.id || p.pareja2_j2 === user!.id
        return (enPareja1 && p.ganador === 1) || (enPareja2 && p.ganador === 2)
      }).length
      return { jugados, victorias }
    },
  })

  const { data: rankingCat } = useQuery({
    queryKey: ['ranking-cat-pos', user?.id, user?.categoria],
    enabled: !!user?.id && !!user?.categoria,
    queryFn: async () => {
      const rows = await padelApi.get<{ jugador_id: string; puntos_total: number }[]>(
        `ranking_categoria?categoria=eq.${encodeURIComponent(user!.categoria!)}&select=jugador_id,puntos_total&order=puntos_total.desc`
      )
      const pos = rows.findIndex(r => r.jugador_id === user!.id) + 1
      const puntos = rows.find(r => r.jugador_id === user!.id)?.puntos_total ?? 0
      return { pos: pos > 0 ? pos : null, puntos, total: rows.length }
    },
  })

  const firstName = user?.nombre_pila ?? user?.nombre?.split(' ')[0] ?? 'Jugador'

  const jugados = stats?.jugados ?? 0
  const victorias = stats?.victorias ?? 0
  const winRate = jugados > 0 ? Math.round((victorias / jugados) * 100) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-manrope text-2xl font-bold text-navy">
          Hola, {firstName}
        </h1>
        <p className="font-inter text-sm text-slate">
          Bienvenido a la Rama Pádel Saint George's
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Categoría" value={user?.categoria ?? '—'} />
        <StatCard
          label="Ranking"
          value={rankingCat?.pos ? `#${rankingCat.pos}` : '—'}
          sub={rankingCat?.pos ? `${rankingCat.puntos} pts` : undefined}
        />
        <StatCard label="Partidos" value={stats ? jugados : '—'} />
        <StatCard
          label="Ganados"
          value={stats ? victorias : '—'}
          sub={winRate !== null ? `${winRate}% victorias` : undefined}
        />
      </div>

      <div>
        <h2 className="mb-3 font-manrope text-sm font-bold uppercase tracking-widest text-slate">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {QUICK_LINKS.map(({ to, icon: Icon, label, desc }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy">
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-manrope text-sm font-bold text-navy">{label}</p>
                <p className="font-inter text-xs text-muted">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 font-manrope text-2xl font-bold text-navy leading-tight">{String(value)}</p>
      {sub && <p className="font-inter text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  )
}
