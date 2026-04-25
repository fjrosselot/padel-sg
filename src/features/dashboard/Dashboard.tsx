import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { padelApi } from '@/lib/padelApi'
import { usePlayerRankings } from '@/hooks/usePlayerRankings'
import { buildCatColorMap } from '@/features/torneos/catColors'
import type { CategoriaFixture, PartidoFixture } from '@/lib/fixture/types'
import { RankingEvolucion, PagosSummary, Novedades, RaceWidget } from './DashboardWidgets'

function isMiPartido(p: PartidoFixture, uid: string): boolean {
  return [p.pareja1?.jugador1_id, p.pareja1?.jugador2_id, p.pareja2?.jugador1_id, p.pareja2?.jugador2_id]
    .includes(uid)
}

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

  const { data: rankings } = usePlayerRankings(user?.id)

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
        <div className="rounded-xl bg-white p-4 shadow-card">
          <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">Ranking</p>
          {rankings && rankings.length > 0 ? (
            <div className="mt-1 space-y-1">
              {rankings.map(r => (
                <div key={`${r.categoria}_${r.sexo}`} className="flex items-baseline gap-1.5">
                  <span className="font-manrope text-xl font-bold text-navy leading-tight">#{r.posicion}</span>
                  <span className="font-inter text-xs text-muted">{r.categoria} · {r.puntos_total} pts</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 font-manrope text-2xl font-bold text-navy leading-tight">—</p>
          )}
        </div>
        <StatCard label="Partidos" value={stats ? jugados : '—'} />
        <StatCard
          label="Ganados"
          value={stats ? victorias : '—'}
          sub={winRate !== null ? `${winRate}% victorias` : undefined}
        />
      </div>

      {user?.id && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-manrope text-sm font-bold uppercase tracking-widest text-slate">
              Próximos partidos
            </h2>
          </div>
          <ProximosPartidos userId={user.id} />
        </div>
      )}

      {user?.id && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RankingEvolucion userId={user.id} />
          <PagosSummary userId={user.id} />
        </div>
      )}

      <RaceWidget />

      <Novedades />
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

function ProximosPartidos({ userId }: { userId: string }) {
  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ['proximos-partidos', userId],
    queryFn: async () => {
      const torneos = await padelApi.get<{ id: string; nombre: string; categorias: unknown }[]>(
        'torneos?estado=eq.en_curso&select=id,nombre,categorias&order=fecha_inicio.asc'
      )
      type Grupo = { torneoId: string; torneoNombre: string; catNombre: string; catBg: string; catDot: string; partidos: PartidoFixture[] }
      const result: Grupo[] = []
      for (const torneo of torneos) {
        const cats = (torneo.categorias as unknown as CategoriaFixture[]).filter(
          (c): c is CategoriaFixture => Array.isArray((c as CategoriaFixture).grupos) || Array.isArray((c as CategoriaFixture).partidos)
        )
        if (cats.length === 0) continue
        const colorMap = buildCatColorMap(cats.map(c => c.nombre))
        for (const cat of cats) {
          const todos: PartidoFixture[] = [
            ...(cat.grupos ?? []).flatMap(g => g.partidos),
            ...cat.faseEliminatoria,
            ...cat.consola,
            ...(cat.partidos ?? []),
          ]
          const misPartidos = todos.filter(p => !p.ganador && isMiPartido(p, userId))
          if (misPartidos.length > 0) {
            result.push({
              torneoId: torneo.id,
              torneoNombre: torneo.nombre,
              catNombre: cat.nombre,
              catBg: colorMap.get(cat.nombre)?.bg ?? '#f1f5f9',
              catDot: colorMap.get(cat.nombre)?.dot ?? '#94b0cc',
              partidos: misPartidos,
            })
          }
        }
      }
      return result
    },
  })

  const navigate = useNavigate()

  if (isLoading) return null
  if (grupos.length === 0) return (
    <div className="rounded-xl bg-white p-4 shadow-card text-center">
      <p className="font-inter text-sm text-muted">Sin partidos programados próximamente</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {grupos.map((g, i) => (
        <button
          key={i}
          type="button"
          onClick={() => navigate(`/torneos/${g.torneoId}`)}
          className="w-full text-left rounded-xl bg-white shadow-card overflow-hidden hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: g.catBg }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.catDot }} />
            <div className="flex-1 min-w-0">
              <p className="font-inter text-[11px] font-semibold text-navy truncate">{g.torneoNombre}</p>
              <p className="font-inter text-[10px] text-muted">{g.catNombre}</p>
            </div>
          </div>
          <div className="px-4">
            {g.partidos.slice(0, 3).map((p, pi) => (
              <div key={pi} className="flex items-center gap-3 py-2 border-b border-surface-high last:border-0">
                <div className="shrink-0 text-center" style={{ minWidth: 40 }}>
                  <p className="font-manrope text-[13px] font-bold text-navy">{p.turno ?? '--:--'}</p>
                  {p.cancha != null && <p className="font-inter text-[10px] text-muted">C{p.cancha}</p>}
                </div>
                <div className="w-px h-7 bg-navy/10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-[10px] text-muted mb-0.5">{p.fase === 'grupo' ? `P-${p.numero}` : p.fase}</p>
                  {(() => {
                    const rival = [p.pareja1, p.pareja2].find(pr =>
                      pr?.jugador1_id !== userId && pr?.jugador2_id !== userId
                    )
                    const rivalNombre = rival?.nombre ?? 'Por definir'
                    const pending = rivalNombre === 'Por definir'
                    return (
                      <p className={`font-inter text-[12px] truncate ${pending ? 'italic text-muted' : 'text-slate'}`}>
                        vs {rivalNombre}
                      </p>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}
