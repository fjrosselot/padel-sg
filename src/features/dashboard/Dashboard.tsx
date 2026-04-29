import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { padelApi } from '@/lib/padelApi'
import { usePlayerRankings } from '@/hooks/usePlayerRankings'
import { useNavigate } from 'react-router-dom'
import { buildCatColorMap } from '@/features/torneos/catColors'
import type { CategoriaFixture, PartidoFixture } from '@/lib/fixture/types'
import { RankingEvolucion, PagosSummary, Novedades, RaceWidget } from './DashboardWidgets'
import { PerfilCard } from './PerfilCard'
import { TorneosDisponibles } from './TorneosDisponibles'
import { AmistososAbiertos } from './AmistososAbiertos'

function isMiPartido(p: PartidoFixture, uid: string): boolean {
  return [p.pareja1?.jugador1_id, p.pareja1?.jugador2_id, p.pareja2?.jugador1_id, p.pareja2?.jugador2_id]
    .includes(uid)
}

export function Dashboard() {
  const { data: user } = useUser()

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

  const { data: torneosJugados } = useQuery({
    queryKey: ['torneos-jugados', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const rows = await padelApi.get<{ torneo_id: string }[]>(
        `inscripciones?or=(jugador1_id.eq.${user!.id},jugador2_id.eq.${user!.id})&estado=eq.confirmada&select=torneo_id`
      )
      return new Set(rows.map(r => r.torneo_id)).size
    },
  })

  return (
    <div className="space-y-4">
      <PerfilCard user={user} stats={stats} rankings={rankings} torneosJugados={torneosJugados} />

      <Novedades />

      {/* Mobile — single column */}
      <div className="lg:hidden space-y-4">
        {user?.id && <ProximosPartidos userId={user.id} />}
        <TorneosDisponibles />
        <AmistososAbiertos />
        {user?.id && <PagosSummary userId={user.id} />}
        <RaceWidget />
        {user?.id && <RankingEvolucion userId={user.id} />}
      </div>

      {/* Desktop — 3 columns */}
      <div
        className="hidden lg:grid gap-5 items-start"
        style={{ gridTemplateColumns: '1fr 1fr 280px' }}
      >
        {/* Col 1: Próximos partidos + Amistosos */}
        <div className="space-y-4">
          {user?.id && <ProximosPartidos userId={user.id} />}
          <AmistososAbiertos />
        </div>

        {/* Col 2: Torneos disponibles */}
        <TorneosDisponibles />

        {/* Col 3: Pagos + Race + Ranking */}
        <div className="space-y-4">
          {user?.id && <PagosSummary userId={user.id} />}
          <RaceWidget />
          {user?.id && <RankingEvolucion userId={user.id} />}
        </div>
      </div>
    </div>
  )
}

function ProximosPartidos({ userId }: { userId: string }) {
  const navigate = useNavigate()

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
        const colorMap = buildCatColorMap(cats.map(c => ({ nombre: c.nombre, color_fondo: c.color_fondo, color_borde: c.color_borde, color_texto: c.color_texto })))
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

  if (isLoading) return null
  if (grupos.length === 0) return (
    <div className="rounded-xl bg-white p-4 shadow-card text-center">
      <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted mb-1">Próximos partidos</p>
      <p className="font-inter text-sm text-muted">Sin partidos programados próximamente</p>
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted px-1">Próximos partidos</p>
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
