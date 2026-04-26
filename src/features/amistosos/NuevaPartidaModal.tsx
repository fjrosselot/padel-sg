import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import type { Database } from '../../lib/types/database.types'

type PartidaRow = Database['padel']['Tables']['partidas_abiertas']['Row']
type JugadorSlot = { nombre: string; apodo: string | null } | null
export type PartidaConJugadores = PartidaRow & {
  creador:   JugadorSlot
  companero: JugadorSlot
  jugador3:  JugadorSlot
  jugador4:  JugadorSlot
}

interface Props {
  onClose: () => void
  partida?: PartidaConJugadores
}

type SlotKey = 'creador_id' | 'companero_id' | 'jugador3_id' | 'jugador4_id'

const SLOTS: { key: SlotKey; dataKey: keyof PartidaConJugadores; label: string }[] = [
  { key: 'creador_id',   dataKey: 'creador',   label: 'Jugador 1' },
  { key: 'companero_id', dataKey: 'companero', label: 'Jugador 2' },
  { key: 'jugador3_id',  dataKey: 'jugador3',  label: 'Jugador 3' },
  { key: 'jugador4_id',  dataKey: 'jugador4',  label: 'Jugador 4' },
]

function toDatetimeLocal(iso: string): string {
  return new Date(iso).toLocaleString('sv-SE', { timeZone: 'America/Santiago' }).slice(0, 16)
}

function slotName(slot: JugadorSlot): string | null {
  if (!slot) return null
  return slot.apodo ?? slot.nombre
}

export default function NuevaPartidaModal({ onClose, partida }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isEdit = !!partida
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const [fecha, setFecha] = useState(partida ? toDatetimeLocal(partida.fecha) : '')
  const [cancha, setCancha] = useState(partida?.cancha ?? '')
  const [categoria, setCategoria] = useState(partida?.categoria ?? '')
  const [error, setError] = useState<string | null>(null)

  // Mutable slot state for admin
  const [slotIds, setSlotIds] = useState<Record<SlotKey, string | null>>({
    creador_id:   partida?.creador_id   ?? null,
    companero_id: partida?.companero_id ?? null,
    jugador3_id:  partida?.jugador3_id  ?? null,
    jugador4_id:  partida?.jugador4_id  ?? null,
  })
  const [slotLabels, setSlotLabels] = useState<Record<SlotKey, string | null>>({
    creador_id:   slotName(partida?.creador   ?? null),
    companero_id: slotName(partida?.companero ?? null),
    jugador3_id:  slotName(partida?.jugador3  ?? null),
    jugador4_id:  slotName(partida?.jugador4  ?? null),
  })

  const { data: jugadoresActivos } = useQuery({
    queryKey: ['jugadores-activos-modal'],
    queryFn: async () => {
      const { data } = await supabase.schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo')
        .eq('estado_cuenta', 'activo')
        .order('nombre')
      return data ?? []
    },
    enabled: isEdit && isAdmin,
  })

  function assignSlot(key: SlotKey, id: string) {
    const j = jugadoresActivos?.find(x => x.id === id)
    if (!j) return
    setSlotIds(s => ({ ...s, [key]: id }))
    setSlotLabels(s => ({ ...s, [key]: j.apodo ?? j.nombre }))
  }

  function clearSlot(key: SlotKey) {
    setSlotIds(s => ({ ...s, [key]: null }))
    setSlotLabels(s => ({ ...s, [key]: null }))
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No autenticado')
      if (!fecha) throw new Error('La fecha es obligatoria')

      if (isEdit) {
        const filled = Object.values(slotIds).filter(Boolean).length
        const newEstado: PartidaRow['estado'] = filled >= 4 ? 'completa' : 'abierta'
        const payload: Record<string, unknown> = {
            fecha,
            cancha: cancha || null,
            categoria: categoria || null,
          }
        if (isAdmin) {
          Object.assign(payload, {
            creador_id:   slotIds.creador_id,
            companero_id: slotIds.companero_id,
            jugador3_id:  slotIds.jugador3_id,
            jugador4_id:  slotIds.jugador4_id,
            estado: newEstado,
          })
        }
        const { error: err } = await supabase.schema('padel')
          .from('partidas_abiertas').update(payload).eq('id', partida!.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.schema('padel')
          .from('partidas_abiertas')
          .insert({ creador_id: user.id, fecha, cancha: cancha || null, categoria: categoria || null })
        if (err) throw err
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partidas-abiertas'] })
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  // Players currently assigned (to exclude from picker)
  const assignedIds = new Set(Object.values(slotIds).filter(Boolean) as string[])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nueva-partida-title"
        className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(13,27,42,0.14)] w-full max-w-sm mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="nueva-partida-title" className="font-manrope text-lg font-bold text-navy">
          {isEdit ? 'Partido' : 'Nuevo partido'}
        </h2>

        {/* Detalles */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="partida-fecha">Fecha y hora</Label>
            <Input
              id="partida-fecha"
              type="datetime-local"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              required
              className="mt-1"
              readOnly={isEdit && !isAdmin}
            />
          </div>
          <div>
            <Label htmlFor="partida-cancha">Cancha</Label>
            <Input
              id="partida-cancha"
              placeholder="Por definir"
              value={cancha}
              onChange={e => setCancha(e.target.value)}
              className="mt-1"
              readOnly={isEdit && !isAdmin}
            />
          </div>
          <div>
            <Label htmlFor="partida-categoria">Categoría</Label>
            <Input
              id="partida-categoria"
              placeholder="Ej: 3a, B, Open…"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="mt-1"
              readOnly={isEdit && !isAdmin}
            />
          </div>
        </div>

        {/* Jugadores — siempre visible al editar */}
        {isEdit && (
          <div className="space-y-2">
            <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">Jugadores</p>
            <div className="rounded-xl border border-navy/10 overflow-hidden divide-y divide-navy/5">
              {SLOTS.map(({ key, label }) => {
                const name = slotLabels[key]
                const isCreador = key === 'creador_id'
                return (
                  <div key={key} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="w-16 font-inter text-[11px] text-muted shrink-0">{label}</span>
                    {name ? (
                      <>
                        <span className="flex-1 font-inter text-sm font-semibold text-navy">{name}</span>
                        {isAdmin && !isCreador && (
                          <button
                            type="button"
                            onClick={() => clearSlot(key)}
                            className="shrink-0 text-muted hover:text-defeat transition-colors"
                            aria-label="Quitar jugador"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    ) : isAdmin ? (
                      <select
                        value=""
                        onChange={e => { if (e.target.value) assignSlot(key, e.target.value) }}
                        className="flex-1 rounded-lg border border-navy/20 bg-white px-2 py-1 font-inter text-sm text-navy focus:border-gold focus:outline-none"
                      >
                        <option value="">— asignar —</option>
                        {jugadoresActivos
                          ?.filter(j => !assignedIds.has(j.id))
                          .map(j => (
                            <option key={j.id} value={j.id}>{j.apodo ?? j.nombre}</option>
                          ))}
                      </select>
                    ) : (
                      <span className="flex-1 font-inter text-sm text-muted">Libre</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">
            {error}
          </div>
        )}

        {/* Mostrar botones solo si hay algo que guardar */}
        {(!isEdit || isAdmin || !isEdit) && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border border-slate/30 text-slate bg-transparent hover:bg-surface rounded-lg">
              {isEdit && !isAdmin ? 'Cerrar' : 'Cancelar'}
            </Button>
            {(!isEdit || isAdmin) && (
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 bg-gold text-navy font-bold rounded-lg"
              >
                {mutation.isPending
                  ? (isEdit ? 'Guardando…' : 'Publicando…')
                  : (isEdit ? 'Guardar' : 'Publicar')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
