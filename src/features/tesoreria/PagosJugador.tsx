import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle, Trophy, CalendarDays, Zap, Wallet } from 'lucide-react'
import { adminHeaders } from '@/lib/adminHeaders'
import type { Pago } from './types'

const SB = import.meta.env.VITE_SUPABASE_URL as string
const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`
const fmtFecha = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' })

const TIPO_ICON: Record<string, React.ElementType> = {
  inscripcion_torneo: Trophy,
  cuota_mensual: CalendarDays,
  actividad: Zap,
}
const TIPO_LABEL: Record<string, string> = {
  inscripcion_torneo: 'Torneo',
  cuota_mensual: 'Mensual',
  actividad: 'Actividad',
}

interface Props {
  jugadorId: string
}

export function PagosJugador({ jugadorId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['pagos-jugador', jugadorId],
    queryFn: async () => {
      const h = await adminHeaders('read')
      const [cjRes, pagosRes] = await Promise.all([
        fetch(
          `${SB}/rest/v1/cobro_jugadores?jugador_id=eq.${jugadorId}&select=cobro_id,monto,cobro:cobros(id,nombre,tipo,estado,fecha_vencimiento)`,
          { headers: h }
        ),
        fetch(
          `${SB}/rest/v1/pagos?jugador_id=eq.${jugadorId}&select=cobro_id,monto,fecha_pago,metodo`,
          { headers: h }
        ),
      ])
      const cobrosJugador: { cobro_id: string; monto: number; cobro: { id: string; nombre: string; tipo: string; estado: string; fecha_vencimiento: string | null } }[] = await cjRes.json()
      const pagos: Pick<Pago, 'cobro_id' | 'monto' | 'fecha_pago' | 'metodo'>[] = await pagosRes.json()

      return cobrosJugador
        .filter(cj => cj.cobro?.estado === 'activo')
        .map(cj => {
          const totalPagado = pagos.filter(p => p.cobro_id === cj.cobro_id).reduce((s, p) => s + p.monto, 0)
          const ultimoPago = pagos.filter(p => p.cobro_id === cj.cobro_id).sort((a, b) => b.fecha_pago.localeCompare(a.fecha_pago))[0]
          return { ...cj, totalPagado, pagado: totalPagado >= cj.monto, ultimoPago }
        })
        .sort((a, b) => Number(a.pagado) - Number(b.pagado))
    },
  })

  if (isLoading) return <p className="text-xs text-muted py-2">Cargando pagos…</p>
  if (!data || data.length === 0) return (
    <div className="flex items-center gap-2 py-2">
      <CheckCircle2 className="h-4 w-4 text-green-500" />
      <p className="font-inter text-sm text-muted">Sin cobros activos asignados</p>
    </div>
  )

  const pendientes = data.filter(d => !d.pagado)
  const pagados = data.filter(d => d.pagado)
  const totalPendiente = pendientes.reduce((s, d) => s + (d.monto - d.totalPagado), 0)

  return (
    <div className="space-y-3">
      {/* Resumen rápido */}
      <div className="flex gap-3">
        <div className={`flex-1 rounded-lg px-3 py-2 text-center ${totalPendiente > 0 ? 'bg-defeat/8 border border-defeat/20' : 'bg-green-50 border border-green-200'}`}>
          <p className={`font-manrope text-lg font-bold ${totalPendiente > 0 ? 'text-defeat' : 'text-green-600'}`}>{fmt(totalPendiente)}</p>
          <p className="font-inter text-[10px] text-muted">Pendiente</p>
        </div>
        <div className="flex-1 rounded-lg px-3 py-2 text-center bg-green-50 border border-green-200">
          <p className="font-manrope text-lg font-bold text-green-600">{fmt(data.reduce((s, d) => s + d.totalPagado, 0))}</p>
          <p className="font-inter text-[10px] text-muted">Pagado</p>
        </div>
      </div>

      {/* Lista cobros */}
      <div className="divide-y divide-navy/5 rounded-lg border border-navy/8 overflow-hidden">
        {data.map(d => {
          const Icon = TIPO_ICON[d.cobro.tipo] ?? Wallet
          return (
            <div key={d.cobro_id} className="flex items-center gap-3 px-4 py-3 bg-white">
              {d.pagado
                ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                : <Circle className="h-4 w-4 text-navy/20 shrink-0" />
              }
              <Icon className="h-4 w-4 text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-inter text-sm font-medium text-navy truncate">{d.cobro.nombre}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-inter text-[10px] text-muted">{TIPO_LABEL[d.cobro.tipo] ?? d.cobro.tipo}</span>
                  {d.cobro.fecha_vencimiento && (
                    <span className="font-inter text-[10px] text-muted">· vence {fmtFecha(d.cobro.fecha_vencimiento)}</span>
                  )}
                  {d.pagado && d.ultimoPago && (
                    <span className="font-inter text-[10px] text-green-600">· pagado {fmtFecha(d.ultimoPago.fecha_pago)}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {d.pagado ? (
                  <p className="font-inter text-sm font-semibold text-green-600">{fmt(d.totalPagado)}</p>
                ) : (
                  <>
                    <p className="font-inter text-sm font-bold text-defeat">{fmt(d.monto - d.totalPagado)}</p>
                    <p className="font-inter text-[10px] text-muted">de {fmt(d.monto)}</p>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {pendientes.length > 0 && (
        <p className="font-inter text-[11px] text-muted text-center">
          {pendientes.length} cobro{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
