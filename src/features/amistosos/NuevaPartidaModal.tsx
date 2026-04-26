import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { PlayerCombobox, type JugadorOption } from '../torneos/PlayerCombobox'
import { useCategorias, FALLBACK_COLORS } from '../categorias/useCategorias'
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
  isPasado?: boolean
}

type SlotKey = 'creador_id' | 'companero_id' | 'jugador3_id' | 'jugador4_id'


const SLOTS: { key: SlotKey; dataKey: keyof PartidaConJugadores; label: string }[] = [
  { key: 'creador_id',   dataKey: 'creador',   label: 'Jugador 1' },
  { key: 'companero_id', dataKey: 'companero', label: 'Jugador 2' },
  { key: 'jugador3_id',  dataKey: 'jugador3',  label: 'Jugador 3' },
  { key: 'jugador4_id',  dataKey: 'jugador4',  label: 'Jugador 4' },
]

const WEEKLY_RANKED_LIMIT = 2

function toDatetimeLocal(iso: string): string {
  return new Date(iso).toLocaleString('sv-SE', { timeZone: 'America/Santiago' }).slice(0, 16)
}

function getWeekBounds(fechaLocal: string): { weekStart: string; weekEnd: string } {
  const [y, m, d] = fechaLocal.slice(0, 10).split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dow = date.getDay()
  const diffToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(date)
  monday.setDate(date.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}T00:00:00`
  return { weekStart: fmt(monday), weekEnd: fmt(sunday) }
}

function slotName(slot: JugadorSlot): string | null {
  if (!slot) return null
  return slot.apodo ?? slot.nombre
}

export default function NuevaPartidaModal({ onClose, partida, isPasado = false }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isEdit = !!partida
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const { data: categoriasList } = useCategorias()

  const [fecha, setFecha] = useState(partida ? toDatetimeLocal(partida.fecha) : '')
  const [cancha, setCancha] = useState(partida?.cancha ?? '')
  const [categorias, setCategorias] = useState<string[]>(
    partida?.categoria ? partida.categoria.split('/').map(s => s.trim()).filter(Boolean) : []
  )
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
        .select('id, nombre, apodo, sexo')
        .eq('estado_cuenta', 'activo')
        .order('nombre')
      return (data ?? []) as JugadorOption[]
    },
    enabled: (isEdit && isAdmin) || isPasado,
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

  const esDueno = isEdit && partida?.creador_id === user?.id
  const puedeEditar = isAdmin || esDueno || isPasado
  const puedeCancelar = isAdmin || esDueno

  const mutation = useMutation({
    mutationFn: async (): Promise<{ cuentaRanking: boolean }> => {
      if (!user) throw new Error('No autenticado')
      if (!fecha) throw new Error('La fecha es obligatoria')

      if (isEdit) {
        if (isAdmin && !slotIds.creador_id) throw new Error('El jugador 1 es obligatorio')
        const filled = Object.values(slotIds).filter(Boolean).length
        const newEstado: PartidaRow['estado'] = filled >= 4 ? 'completa' : 'abierta'
        const categoriaStr = categorias.length > 0 ? categorias.join('/') : null
        const payload: Record<string, unknown> = { fecha, cancha: cancha || null, categoria: categoriaStr }
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
        return { cuentaRanking: true }
      } else {
        const categoriaStr = categorias.length > 0 ? categorias.join('/') : null
        if (isPasado) {
          const { creador_id, companero_id, jugador3_id, jugador4_id } = slotIds
          if (!creador_id || !companero_id || !jugador3_id || !jugador4_id) {
            throw new Error('Los 4 jugadores son obligatorios para registrar un partido jugado')
          }
          // Check weekly ranked limit per player — don't block, just flag
          const { weekStart, weekEnd } = getWeekBounds(fecha)
          const playerIds = [creador_id, companero_id, jugador3_id, jugador4_id]
          const counts = await Promise.all(playerIds.map(pid =>
            supabase.schema('padel')
              .from('partidas_abiertas')
              .select('id', { count: 'exact', head: true })
              .eq('estado', 'jugada')
              .eq('cuenta_ranking', true)
              .gte('fecha', weekStart)
              .lt('fecha', weekEnd)
              .or(`creador_id.eq.${pid},companero_id.eq.${pid},jugador3_id.eq.${pid},jugador4_id.eq.${pid}`)
          ))
          const cuentaRanking = counts.every(r => (r.count ?? 0) < WEEKLY_RANKED_LIMIT)
          const { error: err } = await supabase.schema('padel')
            .from('partidas_abiertas')
            .insert({
              creador_id,
              companero_id,
              jugador3_id,
              jugador4_id,
              fecha,
              cancha: cancha || null,
              categoria: categoriaStr,
              estado: 'jugada',
              cuenta_ranking: cuentaRanking,
            })
          if (err) throw err
          return { cuentaRanking }
        } else {
          const { error: err } = await supabase.schema('padel')
            .from('partidas_abiertas')
            .insert({ creador_id: user.id, fecha, cancha: cancha || null, categoria: categoriaStr })
          if (err) throw err
          return { cuentaRanking: true }
        }
      }
    },
    onSuccess: ({ cuentaRanking }) => {
      qc.invalidateQueries({ queryKey: ['partidas-abiertas'] })
      if (isPasado) {
        if (cuentaRanking) {
          toast.success('Partido registrado y cuenta para el ranking')
        } else {
          toast.warning('Partido registrado — no cuenta para el ranking (límite semanal alcanzado)')
        }
      }
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  const cancelarPartido = useMutation({
    mutationFn: async () => {
      const { error: err } = await supabase.schema('padel')
        .from('partidas_abiertas').update({ estado: 'cancelada' }).eq('id', partida!.id)
      if (err) throw err
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
          {isEdit ? 'Partido' : isPasado ? 'Registrar partido pasado' : 'Nuevo partido'}
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
              {...(!isPasado ? { max: undefined, min: new Date().toISOString().slice(0, 16) } : {})}
              required
              className="mt-1"
              readOnly={isEdit && !puedeEditar}
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
              readOnly={isEdit && !puedeEditar}
            />
          </div>
          <div>
            <Label>
              Categoría
              {categorias.length > 0 && (
                <span className="ml-2 font-inter text-xs font-semibold text-gold">{categorias.join('/')}</span>
              )}
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {(categoriasList ?? []).map(cat => {
                const active = categorias.includes(cat.id)
                const { color_fondo, color_borde, color_texto } = active ? cat : FALLBACK_COLORS
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isEdit && !puedeEditar}
                    onClick={() => setCategorias(prev =>
                      active ? prev.filter(x => x !== cat.id) : [...prev, cat.id]
                    )}
                    className="px-3 py-1 rounded-full font-inter text-xs font-semibold border transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={active
                      ? { background: color_fondo, borderColor: color_borde, color: color_texto }
                      : { background: '#fff', borderColor: '#cbd5e1', color: '#64748b' }
                    }
                  >
                    {cat.nombre}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Jugadores — visible al editar o en modo pasado */}
        {(isEdit || isPasado) && (
          <div className="space-y-2">
            <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">Jugadores</p>
            <div className="rounded-xl border border-navy/10 overflow-hidden divide-y divide-navy/5">
              {SLOTS.map(({ key, label }) => {
                const name = slotLabels[key]
                const isCreador = key === 'creador_id'
                const canPick = isAdmin || isPasado
                return (
                  <div key={key} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="w-16 font-inter text-[11px] text-muted shrink-0">{label}</span>
                    {name ? (
                      <>
                        <span className="flex-1 font-inter text-sm font-semibold text-navy">{name}</span>
                        {canPick && (
                          <button
                            type="button"
                            onClick={() => clearSlot(key)}
                            className="shrink-0 text-muted hover:text-defeat transition-colors"
                            aria-label="Quitar jugador"
                            title={isCreador ? 'Quitar (debes asignar otro jugador 1)' : undefined}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    ) : canPick ? (
                      <div className="flex-1">
                        <PlayerCombobox
                          players={jugadoresActivos}
                          value={slotIds[key] ?? ''}
                          onChange={id => assignSlot(key, id)}
                          placeholder="— seleccionar —"
                          inscritosIds={new Set(
                            Object.entries(slotIds)
                              .filter(([k, v]) => k !== key && !!v)
                              .map(([, v]) => v as string)
                          )}
                        />
                      </div>
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

        <div className="space-y-2">
          {/* Guardar / Publicar */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border border-slate/30 text-slate bg-transparent hover:bg-surface rounded-lg">
              {puedeEditar ? 'Cancelar' : 'Cerrar'}
            </Button>
            {puedeEditar && (
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 bg-gold text-navy font-bold rounded-lg"
              >
                {mutation.isPending
                  ? (isEdit ? 'Guardando…' : 'Registrando…')
                  : (isEdit ? 'Guardar' : isPasado ? 'Registrar' : 'Publicar')}
              </Button>
            )}
          </div>

          {/* Cancelar partido — dueño o admin */}
          {isEdit && puedeCancelar && (
            <button
              type="button"
              onClick={() => cancelarPartido.mutate()}
              disabled={cancelarPartido.isPending}
              className="w-full h-9 rounded-lg font-inter text-sm font-semibold border border-red-200 bg-[#FEE8E8] text-[#BA1A1A] hover:bg-red-100 transition-colors"
            >
              {cancelarPartido.isPending ? 'Cancelando…' : 'Cancelar partido'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
