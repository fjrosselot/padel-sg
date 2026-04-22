import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, Plus, Users, Banknote, AlertCircle, Archive } from 'lucide-react'
import { adminHeaders } from '@/lib/adminHeaders'
import type { Cobro, CobroJugador, Pago } from './types'
import NuevoCobro from './NuevoCobro'

const SB = import.meta.env.VITE_SUPABASE_URL as string
const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`

const TIPO_BADGE: Record<string, string> = {
  inscripcion_torneo: 'bg-gold/10 text-gold border-gold/30',
  cuota_mensual: 'bg-blue-50 text-blue-700 border-blue-200',
  actividad: 'bg-purple-50 text-purple-700 border-purple-200',
}
const TIPO_LABEL: Record<string, string> = {
  inscripcion_torneo: 'Torneo',
  cuota_mensual: 'Mensual',
  actividad: 'Actividad',
}

type Filter = 'todos' | 'pagados' | 'pendientes'

interface JugadorRow extends CobroJugador {
  pagado: boolean
  totalPagado: number
}

export default function TesoreriaAdmin() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('todos')
  const [showNuevo, setShowNuevo] = useState(false)
  const [bulk, setBulk] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)

  const { data: cobros = [] } = useQuery<Cobro[]>({
    queryKey: ['cobros'],
    queryFn: async () => {
      const h = await adminHeaders('read')
      const r = await fetch(`${SB}/rest/v1/cobros?select=*&order=created_at.desc`, { headers: h })
      if (!r.ok) throw new Error(`Error ${r.status}`)
      const data = await r.json()
      return Array.isArray(data) ? data : []
    },
  })

  const activeCobros = cobros.filter(c => c.estado !== 'cerrado')

  useEffect(() => {
    if (!selectedId && activeCobros.length) setSelectedId(activeCobros[0].id)
  }, [cobros])

  const selectedCobro = cobros.find(c => c.id === selectedId)

  const { data: detail, isLoading: detailLoading } = useQuery<{ jugadores: CobroJugador[]; pagos: Pago[] }>({
    queryKey: ['cobro-detail', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const h = await adminHeaders('read')
      const [jRes, pRes] = await Promise.all([
        fetch(`${SB}/rest/v1/cobro_jugadores?cobro_id=eq.${selectedId}&select=*,jugador:jugadores(nombre_pila,apellido)&order=jugador.apellido.asc`, { headers: h }),
        fetch(`${SB}/rest/v1/pagos?cobro_id=eq.${selectedId}&select=*`, { headers: h }),
      ])
      if (!jRes.ok) throw new Error(`Error cobro_jugadores ${jRes.status}`)
      if (!pRes.ok) throw new Error(`Error pagos ${pRes.status}`)
      const [jugadores, pagos] = await Promise.all([jRes.json(), pRes.json()])
      return { jugadores: Array.isArray(jugadores) ? jugadores : [], pagos: Array.isArray(pagos) ? pagos : [] }
    },
  })

  const rows: JugadorRow[] = (detail?.jugadores ?? []).map(cj => {
    const pagosJugador = (detail?.pagos ?? []).filter(p => p.jugador_id === cj.jugador_id)
    const totalPagado = pagosJugador.reduce((s, p) => s + p.monto, 0)
    return { ...cj, pagado: totalPagado >= cj.monto, totalPagado }
  })

  const filtered = rows.filter(r =>
    filter === 'todos' ? true : filter === 'pagados' ? r.pagado : !r.pagado
  )

  const pagados = rows.filter(r => r.pagado).length
  const pendientes = rows.length - pagados
  const recaudado = rows.reduce((s, r) => s + r.totalPagado, 0)
  const esperado = rows.reduce((s, r) => s + r.monto, 0)

  const togglePago = useMutation({
    mutationFn: async ({ row }: { row: JugadorRow }) => {
      const h = await adminHeaders('write')
      if (row.pagado) {
        await fetch(`${SB}/rest/v1/pagos?cobro_id=eq.${selectedId}&jugador_id=eq.${row.jugador_id}`, { method: 'DELETE', headers: h })
      } else {
        await fetch(`${SB}/rest/v1/pagos`, {
          method: 'POST', headers: h,
          body: JSON.stringify({ cobro_id: selectedId, jugador_id: row.jugador_id, monto: row.monto, fecha_pago: new Date().toISOString().slice(0, 10), metodo: 'transferencia' }),
        })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cobro-detail', selectedId] }),
  })

  const marcarBulk = useMutation({
    mutationFn: async () => {
      const h = await adminHeaders('write')
      const pendientesBulk = Array.from(bulk).map(jid => rows.find(r => r.jugador_id === jid)).filter(r => r && !r.pagado) as JugadorRow[]
      if (!pendientesBulk.length) return
      await fetch(`${SB}/rest/v1/pagos`, {
        method: 'POST', headers: h,
        body: JSON.stringify(pendientesBulk.map(r => ({
          cobro_id: selectedId, jugador_id: r.jugador_id, monto: r.monto,
          fecha_pago: new Date().toISOString().slice(0, 10), metodo: 'transferencia',
        }))),
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cobro-detail', selectedId] }); setBulk(new Set()); setBulkMode(false) },
  })

  const activarCobro = useMutation({
    mutationFn: async (id: string) => {
      const h = await adminHeaders('write')
      await fetch(`${SB}/rest/v1/cobros?id=eq.${id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ estado: 'activo' }) })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cobros'] }),
  })

  const morosos = (() => {
    const map = new Map<string, { nombre: string; count: number }>()
    cobros.filter(c => c.estado === 'activo').forEach(cobro => {
      const det = qc.getQueryData<{ jugadores: CobroJugador[]; pagos: Pago[] }>(['cobro-detail', cobro.id])
      if (!det) return
      det.jugadores.forEach(cj => {
        const pagado = det.pagos.filter(p => p.jugador_id === cj.jugador_id).reduce((s, p) => s + p.monto, 0) >= cj.monto
        if (!pagado) {
          const prev = map.get(cj.jugador_id)
          map.set(cj.jugador_id, { nombre: `${cj.jugador.apellido}, ${cj.jugador.nombre_pila}`, count: (prev?.count ?? 0) + 1 })
        }
      })
    })
    return Array.from(map.entries()).filter(([, v]) => v.count > 1).sort((a, b) => b[1].count - a[1].count)
  })()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-manrope text-2xl font-bold text-navy">Tesorería</h1>
        <button onClick={() => setShowNuevo(true)} className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 font-inter text-sm font-bold text-navy hover:bg-gold/90">
          <Plus className="h-4 w-4" /> Nueva cuota
        </button>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Banknote, label: 'Cobros activos', value: cobros.filter(c => c.estado === 'activo').length },
          { icon: Users, label: 'Pendientes hoy', value: cobros.filter(c => c.estado === 'activo').length > 0 ? '—' : 0 },
          { icon: AlertCircle, label: 'Morosos', value: morosos.length },
        ].map(k => (
          <div key={k.label} className="rounded-xl bg-white shadow-card p-4">
            <p className="font-manrope text-2xl font-bold text-navy">{k.value}</p>
            <p className="font-inter text-[10px] uppercase tracking-wider text-muted mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Pills de cobros */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {activeCobros.length === 0 && <p className="text-sm text-muted">Sin cobros activos. Crea uno arriba.</p>}
        {activeCobros.map(c => (
          <button
            key={c.id}
            onClick={() => { setSelectedId(c.id); setFilter('todos'); setBulk(new Set()); setBulkMode(false) }}
            className={`shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5 font-inter text-xs font-medium transition-colors ${selectedId === c.id ? 'bg-navy text-white border-navy' : 'border-navy/20 text-muted hover:border-navy/40'}`}
          >
            {c.estado === 'borrador' && <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />}
            {c.nombre}
            <span className={`rounded px-1.5 py-0.5 text-[10px] border ${TIPO_BADGE[c.tipo]}`}>{TIPO_LABEL[c.tipo]}</span>
          </button>
        ))}
      </div>

      {/* Detalle cobro seleccionado */}
      {selectedCobro && (
        <div className="rounded-xl bg-white shadow-card overflow-hidden">
          {/* Header cobro */}
          <div className="px-5 py-4 border-b border-navy/8 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-manrope text-base font-bold text-navy">{selectedCobro.nombre}</p>
                {selectedCobro.estado === 'borrador' && (
                  <button onClick={() => activarCobro.mutate(selectedCobro.id)} className="text-[10px] rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 px-2 py-0.5 font-inter font-semibold hover:bg-yellow-100">
                    Borrador — activar
                  </button>
                )}
              </div>
              <p className="font-inter text-xs text-muted mt-0.5">
                {fmt(selectedCobro.monto_base)} · {selectedCobro.fecha_vencimiento ? `Vence ${selectedCobro.fecha_vencimiento}` : 'Sin vencimiento'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-manrope text-lg font-bold text-navy">{pagados}/{rows.length}</p>
              <p className="font-inter text-[10px] text-muted">{fmt(recaudado)} de {fmt(esperado)}</p>
            </div>
          </div>

          {/* Barra de progreso */}
          {esperado > 0 && (
            <div className="h-1.5 bg-navy/5">
              <div className="h-full bg-gold transition-all" style={{ width: `${Math.min(100, (recaudado / esperado) * 100)}%` }} />
            </div>
          )}

          {/* Filtros + bulk */}
          <div className="px-5 py-3 flex items-center gap-2 border-b border-navy/5 flex-wrap">
            {(['todos', 'pagados', 'pendientes'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 font-inter text-xs font-medium transition-colors ${filter === f ? 'bg-navy text-white' : 'border border-navy/15 text-muted hover:border-navy/30'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pagados' && ` (${pagados})`}
                {f === 'pendientes' && ` (${pendientes})`}
              </button>
            ))}
            <button
              onClick={() => { setBulkMode(v => !v); setBulk(new Set()) }}
              className={`ml-auto rounded-full px-3 py-1 font-inter text-xs font-medium border transition-colors ${bulkMode ? 'bg-navy text-white border-navy' : 'border-navy/15 text-muted'}`}
            >
              Lote
            </button>
            {bulkMode && bulk.size > 0 && (
              <button onClick={() => marcarBulk.mutate()} disabled={marcarBulk.isPending}
                className="rounded-full px-3 py-1 font-inter text-xs font-bold bg-gold text-navy disabled:opacity-60"
              >
                Marcar {bulk.size} pagado{bulk.size !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Lista jugadores */}
          {detailLoading ? (
            <div className="py-8 text-center text-sm text-muted">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted">Sin jugadores en esta categoría</div>
          ) : (
            <div className="divide-y divide-navy/5">
              {filtered.map(row => {
                const inBulk = bulk.has(row.jugador_id)
                return (
                  <div key={row.jugador_id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface/50">
                    {bulkMode && !row.pagado && (
                      <button onClick={() => setBulk(s => { const n = new Set(s); inBulk ? n.delete(row.jugador_id) : n.add(row.jugador_id); return n })}
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${inBulk ? 'bg-gold border-gold' : 'border-navy/20'}`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-sm font-medium text-navy truncate">
                        {row.jugador.apellido}, {row.jugador.nombre_pila}
                      </p>
                      <p className="font-inter text-[11px] text-muted">{fmt(row.monto)}</p>
                    </div>
                    <button
                      onClick={() => !bulkMode && togglePago.mutate({ row })}
                      disabled={togglePago.isPending}
                      className="flex items-center gap-1.5 font-inter text-xs font-medium transition-colors"
                    >
                      {row.pagado ? (
                        <><CheckCircle2 className="h-5 w-5 text-green-500" /><span className="text-green-600">Pagado</span></>
                      ) : (
                        <><Circle className="h-5 w-5 text-navy/25" /><span className="text-muted">Pendiente</span></>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Morosos */}
      {morosos.length > 0 && (
        <div className="rounded-xl bg-white shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-navy/8 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-defeat" />
            <p className="font-inter text-sm font-semibold text-navy">Morosos ({morosos.length})</p>
          </div>
          <div className="divide-y divide-navy/5">
            {morosos.map(([jid, { nombre, count }]) => (
              <div key={jid} className="flex items-center justify-between px-5 py-3">
                <p className="font-inter text-sm text-navy">{nombre}</p>
                <span className="rounded-full bg-defeat/10 border border-defeat/20 text-defeat px-2 py-0.5 font-inter text-[11px] font-semibold">
                  {count} deudas
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cobros cerrados */}
      {cobros.filter(c => c.estado === 'cerrado').length > 0 && (
        <details className="rounded-xl bg-white shadow-card overflow-hidden">
          <summary className="flex items-center gap-2 px-5 py-4 cursor-pointer font-inter text-sm text-muted hover:text-navy">
            <Archive className="h-4 w-4" /> Cobros cerrados ({cobros.filter(c => c.estado === 'cerrado').length})
          </summary>
          <div className="divide-y divide-navy/5 border-t border-navy/8">
            {cobros.filter(c => c.estado === 'cerrado').map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <p className="font-inter text-sm text-muted">{c.nombre}</p>
                <span className="font-inter text-xs text-muted">{fmt(c.monto_base)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {showNuevo && (
        <NuevoCobro
          onClose={() => setShowNuevo(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['cobros'] }); setShowNuevo(false) }}
        />
      )}
    </div>
  )
}
