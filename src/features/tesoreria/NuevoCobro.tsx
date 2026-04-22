import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Check, Search } from 'lucide-react'
import { adminHeaders } from '@/lib/adminHeaders'
import type { JugadorSimple } from './types'

const SB = import.meta.env.VITE_SUPABASE_URL as string

const TIPOS = [
  { value: 'inscripcion_torneo', label: 'Inscripción torneo' },
  { value: 'cuota_mensual', label: 'Cuota mensual' },
  { value: 'actividad', label: 'Actividad' },
  { value: 'indumentaria', label: 'Indumentaria' },
  { value: 'convivencia', label: 'Convivencia' },
  { value: 'otro', label: 'Otro' },
] as const

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function NuevoCobro({ onClose, onCreated }: Props) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<typeof TIPOS[number]['value']>('actividad')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState('')
  const [activar, setActivar] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busqueda, setBusqueda] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: jugadores = [] } = useQuery<JugadorSimple[]>({
    queryKey: ['jugadores-simple'],
    queryFn: async () => {
      const h = await adminHeaders('read')
      const res = await fetch(
        `${SB}/rest/v1/jugadores?select=id,nombre_pila,apellido,estado_cuenta&estado_cuenta=eq.activo&order=apellido.asc`,
        { headers: h }
      )
      return res.json()
    },
  })

  useEffect(() => {
    if (jugadores.length) setSelected(new Set(jugadores.map(j => j.id)))
  }, [jugadores])

  const toggle = (id: string) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleSubmit = async () => {
    if (!nombre.trim() || !monto || selected.size === 0) {
      setError('Nombre, monto y al menos un jugador son requeridos.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const h = await adminHeaders('write')
      const cobroRes = await fetch(`${SB}/rest/v1/cobros`, {
        method: 'POST',
        headers: { ...h, Prefer: 'return=representation' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          tipo,
          monto_base: Number(monto),
          estado: activar ? 'activo' : 'borrador',
          fecha_vencimiento: fecha || null,
        }),
      })
      if (!cobroRes.ok) throw new Error('Error al crear cobro')
      const [cobro] = await cobroRes.json()

      const montoNum = Number(monto)
      const rows = Array.from(selected).map(jid => ({
        cobro_id: cobro.id,
        jugador_id: jid,
        monto: montoNum,
      }))
      const jRes = await fetch(`${SB}/rest/v1/cobro_jugadores`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(rows),
      })
      if (!jRes.ok) throw new Error('Error al agregar jugadores')
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-navy/10">
          <h2 className="font-manrope text-lg font-bold text-navy">Nueva cuota</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className="font-inter text-[11px] font-semibold uppercase tracking-wider text-muted">Nombre</label>
            <input
              value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Cuota Torneo Otoño 2026"
              className="w-full rounded-lg border border-navy/20 px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-inter text-[11px] font-semibold uppercase tracking-wider text-muted">Tipo</label>
              <select
                value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}
                className="w-full rounded-lg border border-navy/20 px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
              >
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-inter text-[11px] font-semibold uppercase tracking-wider text-muted">Monto (CLP)</label>
              <input
                type="text" inputMode="numeric"
                value={monto ? Number(monto).toLocaleString('es-CL') : ''}
                onChange={e => setMonto(e.target.value.replace(/\D/g, ''))}
                placeholder="25.000"
                className="w-full rounded-lg border border-navy/20 px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-inter text-[11px] font-semibold uppercase tracking-wider text-muted">Fecha vencimiento (opcional)</label>
            <input
              type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="w-full rounded-lg border border-navy/20 px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <span
              onClick={() => setActivar(v => !v)}
              className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${activar ? 'border-gold bg-gold' : 'border-navy/25 bg-white'}`}
            >
              {activar && <Check className="h-2.5 w-2.5 text-navy" strokeWidth={3} />}
            </span>
            <span className="font-inter text-sm text-navy">Activar inmediatamente</span>
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-inter text-[11px] font-semibold uppercase tracking-wider text-muted">
                Jugadores ({selected.size}/{jugadores.length})
              </label>
              <div className="flex gap-3 text-xs font-inter text-navy/60">
                <button onClick={() => setSelected(new Set(jugadores.map(j => j.id)))} className="hover:text-navy">Todos</button>
                <button onClick={() => setSelected(new Set())} className="hover:text-navy">Ninguno</button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar jugador…"
                className="w-full rounded-lg border border-navy/15 pl-8 pr-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-navy/10 divide-y divide-navy/5">
              {jugadores
                .filter(j => {
                  const q = busqueda.toLowerCase()
                  return !q || j.apellido.toLowerCase().includes(q) || j.nombre_pila.toLowerCase().includes(q)
                })
                .map(j => (
                  <button
                    key={j.id} type="button"
                    onClick={() => toggle(j.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${selected.has(j.id) ? 'bg-gold/5' : 'hover:bg-surface'}`}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected.has(j.id) ? 'border-gold bg-gold' : 'border-navy/20'}`}>
                      {selected.has(j.id) && <Check className="h-2.5 w-2.5 text-navy" strokeWidth={3} />}
                    </span>
                    <span className="font-inter text-sm text-navy">{j.apellido}, {j.nombre_pila}</span>
                  </button>
                ))}
            </div>
          </div>

          {error && <p className="text-defeat text-xs">{error}</p>}
        </div>

        <div className="p-5 border-t border-navy/10 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-navy/20 py-2.5 font-inter text-sm text-muted hover:bg-surface">
            Cancelar
          </button>
          <button
            onClick={handleSubmit} disabled={saving}
            className="flex-2 flex-1 rounded-lg bg-gold py-2.5 font-inter text-sm font-bold text-navy disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Crear cuota'}
          </button>
        </div>
      </div>
    </div>
  )
}
