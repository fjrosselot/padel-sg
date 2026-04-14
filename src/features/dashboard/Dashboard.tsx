import { useNavigate } from 'react-router-dom'
import { Grid3x3, Layers, Handshake, Trophy, ChevronRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

const QUICK_LINKS = [
  { to: '/torneos', icon: Grid3x3, label: 'Torneos', desc: 'Inscripciones y resultados' },
  { to: '/ligas', icon: Layers, label: 'Ligas', desc: 'Round robin y escalerilla' },
  { to: '/amistosos', icon: Handshake, label: 'Amistosos', desc: 'Partidos libres' },
  { to: '/ranking', icon: Trophy, label: 'Ranking', desc: 'ELO y tabla general' },
]

export function Dashboard() {
  const { data: user } = useUser()
  const navigate = useNavigate()

  const firstName = user?.nombre?.split(' ')[0] ?? 'Jugador'

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="font-manrope text-2xl font-bold text-navy">
          Hola, {firstName}
        </h1>
        <p className="font-inter text-sm text-slate">
          Bienvenido a la Rama Pádel Saint George's
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'ELO', value: (user as Record<string, unknown>)?.elo_actual ?? '—' },
          { label: 'Partidos', value: (user as Record<string, unknown>)?.partidos_jugados ?? '—' },
          { label: 'Victorias', value: (user as Record<string, unknown>)?.victorias ?? '—' },
          { label: 'Categoría', value: user?.categoria ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-card">
            <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
            <p className="mt-1 font-manrope text-2xl font-bold text-navy">{String(value)}</p>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
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
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder próximos eventos */}
      <div>
        <h2 className="mb-3 font-manrope text-sm font-bold uppercase tracking-widest text-slate">
          Próximos eventos
        </h2>
        <div className="rounded-xl bg-white p-6 text-center shadow-card">
          <p className="font-inter text-sm text-muted">
            El calendario estará disponible próximamente
          </p>
        </div>
      </div>
    </div>
  )
}
