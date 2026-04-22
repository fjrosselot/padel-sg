import { useQuery } from '@tanstack/react-query'
import { Wallet, CheckCircle2, Circle, Trophy, CalendarDays, Zap, Shirt, PartyPopper } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Pago } from '@/features/tesoreria/types'

const SB = import.meta.env.VITE_SUPABASE_URL as string
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`

const TIPO_ICON: Record<string, React.ElementType> = {
  inscripcion_torneo: Trophy,
  cuota_mensual: CalendarDays,
  actividad: Zap,
  indumentaria: Shirt,
  convivencia: PartyPopper,
}
const TIPO_LABEL: Record<string, string> = {
  inscripcion_torneo: 'Torneo',
  cuota_mensual: 'Mensual',
  actividad: 'Actividad',
  indumentaria: 'Indumentaria',
  convivencia: 'Convivencia',
  otro: 'Otro',
}
const TIPO_COLOR: Record<string, string> = {
  inscripcion_torneo: 'bg-gold/10 text-gold',
  cuota_mensual: 'bg-blue-50 text-blue-600',
  actividad: 'bg-purple-50 text-purple-600',
  indumentaria: 'bg-orange-50 text-orange-600',
  convivencia: 'bg-pink-50 text-pink-600',
  otro: 'bg-surface text-muted',
}

interface CobrosResult {
  cobro_id: string
  jugador_id: string
  monto: number
  cobro: {
    id: string
    nombre: string
    tipo: string
    monto_base: number
    fecha_vencimiento: string | null
    estado: string
  }
  totalPagado: number
  pagado: boolean
}

async function fetchMisCobros(userId: string): Promise<CobrosResult[]> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ANON
  const headers = { apikey: ANON, Authorization: `Bearer ${token}`, 'Accept-Profile': 'padel' }

  // Filtrar explícitamente por jugador_id para evitar que admin vea todo
  const [cjRes, pagosRes] = await Promise.all([
    fetch(
      `${SB}/rest/v1/cobro_jugadores?jugador_id=eq.${userId}&select=cobro_id,jugador_id,monto,cobro:cobros(id,nombre,tipo,monto_base,fecha_vencimiento,estado)`,
      { headers }
    ),
    fetch(
      `${SB}/rest/v1/pagos?jugador_id=eq.${userId}&select=cobro_id,monto`,
      { headers }
    ),
  ])

  const cobrosJugador: (Omit<CobrosResult, 'totalPagado' | 'pagado'>)[] = await cjRes.json()
  const pagos: Pick<Pago, 'cobro_id' | 'monto'>[] = await pagosRes.json()

  return cobrosJugador
    .filter(cj => cj.cobro?.estado === 'activo')
    .map(cj => {
      const totalPagado = pagos.filter(p => p.cobro_id === cj.cobro_id).reduce((s, p) => s + p.monto, 0)
      return { ...cj, totalPagado, pagado: totalPagado >= cj.monto }
    })
    .sort((a, b) => Number(a.pagado) - Number(b.pagado))
}

export default function FinanzasPage() {
  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
  })

  const userId = session?.user.id

  const { data: cobros = [], isLoading } = useQuery({
    queryKey: ['mis-cobros', userId],
    enabled: !!userId,
    queryFn: () => fetchMisCobros(userId!),
  })

  const pendientes = cobros.filter(c => !c.pagado)
  const pagados = cobros.filter(c => c.pagado)
  const totalPendiente = pendientes.reduce((s, c) => s + (c.monto - c.totalPagado), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Mis Pagos</h1>
      </div>

      {isLoading || !userId ? (
        <div className="rounded-xl bg-white shadow-card p-8 text-center text-sm text-muted">Cargando…</div>
      ) : cobros.length === 0 ? (
        <div className="rounded-xl bg-white shadow-card p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
          <p className="font-manrope text-base font-bold text-navy">Todo al día</p>
          <p className="font-inter text-sm text-muted mt-1">No tienes cobros pendientes.</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white shadow-card p-4">
              <p className={`font-manrope text-2xl font-bold ${totalPendiente > 0 ? 'text-defeat' : 'text-green-600'}`}>
                {fmt(totalPendiente)}
              </p>
              <p className="font-inter text-[10px] uppercase tracking-wider text-muted mt-1">Saldo pendiente</p>
            </div>
            <div className="rounded-xl bg-white shadow-card p-4">
              <p className="font-manrope text-2xl font-bold text-green-600">{pagados.length}</p>
              <p className="font-inter text-[10px] uppercase tracking-wider text-muted mt-1">Pagos completados</p>
            </div>
          </div>

          {/* Pendientes */}
          {pendientes.length > 0 && (
            <div className="rounded-xl bg-white shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-navy/8 flex items-center justify-between">
                <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted">
                  Pendientes ({pendientes.length})
                </p>
                <p className="font-inter text-xs font-semibold text-defeat">{fmt(totalPendiente)} total</p>
              </div>
              <div className="divide-y divide-navy/5">
                {pendientes.map(c => {
                  const Icon = TIPO_ICON[c.cobro.tipo] ?? Wallet
                  return (
                    <div key={c.cobro_id} className="flex items-center gap-3 px-5 py-4">
                      <Circle className="h-5 w-5 text-navy/15 shrink-0" />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface">
                        <Icon className="h-4 w-4 text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-inter text-sm font-medium text-navy truncate">{c.cobro.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`rounded px-1.5 py-0.5 font-inter text-[10px] font-semibold ${TIPO_COLOR[c.cobro.tipo]}`}>
                            {TIPO_LABEL[c.cobro.tipo] ?? c.cobro.tipo}
                          </span>
                          {c.cobro.fecha_vencimiento && (
                            <span className="font-inter text-[10px] text-muted">Vence {c.cobro.fecha_vencimiento}</span>
                          )}
                        </div>
                      </div>
                      <p className="font-manrope text-base font-bold text-defeat shrink-0">
                        {fmt(c.monto - c.totalPagado)}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="px-5 py-3 bg-surface border-t border-navy/5">
                <p className="font-inter text-xs text-muted">
                  Transfiere a la cuenta de la rama y avisa al admin para registrar tu pago.
                </p>
              </div>
            </div>
          )}

          {/* Pagados */}
          {pagados.length > 0 && (
            <div className="rounded-xl bg-white shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-navy/8">
                <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted">
                  Pagados ({pagados.length})
                </p>
              </div>
              <div className="divide-y divide-navy/5">
                {pagados.map(c => {
                  const Icon = TIPO_ICON[c.cobro.tipo] ?? Wallet
                  return (
                    <div key={c.cobro_id} className="flex items-center gap-3 px-5 py-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface">
                        <Icon className="h-4 w-4 text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-inter text-sm text-navy truncate">{c.cobro.nombre}</p>
                        <span className={`rounded px-1.5 py-0.5 font-inter text-[10px] font-semibold ${TIPO_COLOR[c.cobro.tipo]}`}>
                          {TIPO_LABEL[c.cobro.tipo] ?? c.cobro.tipo}
                        </span>
                      </div>
                      <p className="font-inter text-sm font-semibold text-green-600 shrink-0">{fmt(c.totalPagado)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
