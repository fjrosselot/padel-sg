import { useQuery } from '@tanstack/react-query'
import { Wallet, CheckCircle2, Circle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { CobroJugador, Pago } from '@/features/tesoreria/types'

const SB = import.meta.env.VITE_SUPABASE_URL as string
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`

export default function FinanzasPage() {
  const { data: cobros = [], isLoading } = useQuery({
    queryKey: ['mis-cobros'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ANON
      const headers = {
        apikey: ANON, Authorization: `Bearer ${token}`,
        'Accept-Profile': 'padel',
      }

      const [cjRes, pagosRes] = await Promise.all([
        fetch(`${SB}/rest/v1/cobro_jugadores?select=*,cobro:cobros(id,nombre,tipo,monto_base,fecha_vencimiento,estado)`, { headers }),
        fetch(`${SB}/rest/v1/pagos?select=*`, { headers }),
      ])

      const cobrosJugador: (CobroJugador & { cobro: { id: string; nombre: string; tipo: string; monto_base: number; fecha_vencimiento: string | null; estado: string } })[] = await cjRes.json()
      const pagos: Pago[] = await pagosRes.json()

      return cobrosJugador
        .filter(cj => cj.cobro?.estado === 'activo')
        .map(cj => {
          const misPagos = pagos.filter(p => p.cobro_id === cj.cobro_id)
          const totalPagado = misPagos.reduce((s, p) => s + p.monto, 0)
          return { ...cj, totalPagado, pagado: totalPagado >= cj.monto }
        })
        .sort((a, b) => (a.pagado ? 1 : -1))
    },
  })

  const pendientes = cobros.filter(c => !c.pagado)
  const pagados = cobros.filter(c => c.pagado)
  const totalPendiente = pendientes.reduce((s, c) => s + (c.monto - c.totalPagado), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Mis Finanzas</h1>
      </div>

      {isLoading ? (
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
              <p className="font-manrope text-2xl font-bold text-defeat">{fmt(totalPendiente)}</p>
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
              <div className="px-5 py-3 border-b border-navy/8">
                <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted">Pendientes</p>
              </div>
              <div className="divide-y divide-navy/5">
                {pendientes.map(c => (
                  <div key={c.cobro_id} className="flex items-center gap-3 px-5 py-4">
                    <Circle className="h-5 w-5 text-navy/20 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-sm font-medium text-navy">{c.cobro.nombre}</p>
                      {c.cobro.fecha_vencimiento && (
                        <p className="font-inter text-[11px] text-muted">Vence {c.cobro.fecha_vencimiento}</p>
                      )}
                    </div>
                    <p className="font-manrope text-base font-bold text-defeat shrink-0">{fmt(c.monto - c.totalPagado)}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-surface border-t border-navy/5">
                <p className="font-inter text-xs text-muted">Contacta al admin de la rama para registrar tu pago.</p>
              </div>
            </div>
          )}

          {/* Pagados */}
          {pagados.length > 0 && (
            <div className="rounded-xl bg-white shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-navy/8">
                <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted">Pagados</p>
              </div>
              <div className="divide-y divide-navy/5">
                {pagados.map(c => (
                  <div key={c.cobro_id} className="flex items-center gap-3 px-5 py-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p className="flex-1 font-inter text-sm text-navy">{c.cobro.nombre}</p>
                    <p className="font-inter text-sm font-semibold text-green-600">{fmt(c.totalPagado)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
