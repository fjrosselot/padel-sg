import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Handshake, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import NuevaPartidaModal, { type PartidaConJugadores } from './NuevaPartidaModal'

type JugadorSlot = { nombre: string; apodo: string | null } | null

function SlotAvatar({ jugador, size = 24 }: { jugador: JugadorSlot; size?: number }) {
  if (jugador) {
    const name = jugador.apodo ?? jugador.nombre.split(' ')[0]
    const initials = name.slice(0, 2).toUpperCase()
    return (
      <div
        className="rounded-full flex items-center justify-center font-manrope font-bold shrink-0 bg-navy text-gold"
        style={{ width: size, height: size, fontSize: size * 0.3 }}
        title={jugador.nombre}
      >
        {initials}
      </div>
    )
  }
  return (
    <div
      className="rounded-full border-2 border-dashed border-slate/40 shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

function PartidaCard({
  p, userId, isAdmin, onUnirse, onSalir, onDetalle, joining,
}: {
  p: PartidaConJugadores
  userId: string | undefined
  isAdmin: boolean
  onUnirse: (id: string, slot: 'companero_id' | 'jugador3_id' | 'jugador4_id') => void
  onSalir: (id: string) => void
  onDetalle: (p: PartidaConJugadores) => void
  joining: boolean
}) {
  const slots: JugadorSlot[] = [p.creador, p.companero, p.jugador3, p.jugador4]
  const filled = slots.filter(Boolean).length
  const lleno = filled === 4
  const pct = filled / 4

  const hBg    = lleno ? '#D1FAE5' : pct >= 0.5 ? '#FFF3CD' : '#EEF2FF'
  const hColor = lleno ? '#065F46' : pct >= 0.5 ? '#856404' : '#4338CA'

  const yaSoy = userId
    ? p.creador_id === userId || p.companero_id === userId || p.jugador3_id === userId || p.jugador4_id === userId
    : false
  const nextSlot = !p.companero_id ? 'companero_id' : !p.jugador3_id ? 'jugador3_id' : !p.jugador4_id ? 'jugador4_id' : null

  const dt = new Date(p.fecha)
  const hora   = dt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })
  const diaNom = dt.toLocaleDateString('es-CL', { weekday: 'short', timeZone: 'America/Santiago' })
  const diaMes = dt.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' })

  return (
    <div
      className="rounded-xl bg-white shadow-card overflow-hidden flex flex-col cursor-pointer"
      onClick={() => onDetalle(p)}
    >
      {/* Occupancy header */}
      <div className="px-3 pt-2 pb-1.5 flex items-center justify-between" style={{ background: hBg }}>
        <span className="font-inter text-[10px] font-bold" style={{ color: hColor }}>
          {lleno ? 'Completo' : `${4 - filled} libre${4 - filled !== 1 ? 's' : ''}`}
        </span>
        <span className="font-inter text-[10px] font-semibold" style={{ color: hColor, opacity: 0.7 }}>
          {filled}/4
        </span>
      </div>

      {/* Body */}
      <div className="px-3 pt-2 pb-1 flex-1 space-y-1.5">
        <p className="font-manrope text-[16px] font-black leading-none text-navy">{hora}</p>
        <p className="font-manrope text-[13px] font-bold leading-none text-navy">
          {diaNom} <span className="font-inter font-normal text-[11px] text-slate">{diaMes}</span>
        </p>
        <p className="font-inter text-[10px]" style={{ color: p.cancha ? '#162844' : '#94b0cc' }}>
          {p.cancha ? `Cancha ${p.cancha}` : 'Cancha por definir'}
        </p>
        {/* Slots 2v2 */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex gap-0.5">
            <SlotAvatar jugador={p.creador} />
            <SlotAvatar jugador={p.companero} />
          </div>
          <span className="font-inter text-[9px] font-bold text-slate">vs</span>
          <div className="flex gap-0.5">
            <SlotAvatar jugador={p.jugador3} />
            <SlotAvatar jugador={p.jugador4} />
          </div>
        </div>
        {p.categoria && (
          <span className="inline-block font-inter text-[9px] font-semibold px-1 py-0.5 rounded bg-surface text-slate">
            {p.categoria}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="px-3 pb-3 pt-1.5" onClick={e => e.stopPropagation()}>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => onDetalle(p)}
            className="w-full h-7 rounded-lg font-inter text-[10px] font-semibold border border-navy/20 text-navy"
          >
            Ver / Editar
          </button>
        ) : lleno ? (
          <div className="w-full h-7 rounded-lg flex items-center justify-center font-inter text-[10px] bg-surface text-slate">
            Partido completo
          </div>
        ) : yaSoy ? (
          <button
            type="button"
            onClick={() => onSalir(p.id)}
            className="w-full h-7 rounded-lg font-inter text-[10px] font-semibold border border-red-200 bg-[#FEE8E8] text-[#BA1A1A]"
          >
            Salir
          </button>
        ) : nextSlot ? (
          <Button
            onClick={() => onUnirse(p.id, nextSlot)}
            disabled={joining}
            className="w-full h-7 bg-gold text-navy font-bold text-[11px] rounded-lg"
          >
            Unirme
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default function AmistososPage() {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [showModal, setShowModal] = useState(false)
  const [showModalPasado, setShowModalPasado] = useState(false)
  const [detalle, setDetalle] = useState<PartidaConJugadores | null>(null)

  const { data: partidas, isLoading } = useQuery({
    queryKey: ['partidas-abiertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('partidas_abiertas')
        .select(`
          *,
          creador:jugadores!creador_id(nombre, apodo),
          companero:jugadores!companero_id(nombre, apodo),
          jugador3:jugadores!jugador3_id(nombre, apodo),
          jugador4:jugadores!jugador4_id(nombre, apodo)
        `)
        .in('estado', ['abierta', 'confirmada', 'completa'])
        .order('fecha', { ascending: true })
      if (error) throw error
      return data as PartidaConJugadores[]
    },
  })

  const unirse = useMutation({
    mutationFn: async ({ id, slot }: { id: string; slot: 'companero_id' | 'jugador3_id' | 'jugador4_id' }) => {
      if (!user) throw new Error('No autenticado')
      const patch: Record<string, string | 'completa'> = { [slot]: user.id }
      if (slot === 'jugador4_id') patch.estado = 'completa'
      const { error } = await supabase.schema('padel').from('partidas_abiertas')
        .update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partidas-abiertas'] })
      toast.success('Te uniste al partido')
    },
  })

  const salir = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No autenticado')
      const p = partidas?.find(x => x.id === id)
      if (!p) return
      const patch: Record<string, null | 'abierta'> = {}
      if (p.jugador4_id === user.id)       { patch.jugador4_id  = null; patch.estado = 'abierta' }
      else if (p.jugador3_id === user.id)  { patch.jugador3_id  = null; patch.estado = 'abierta' }
      else if (p.companero_id === user.id) { patch.companero_id = null; patch.estado = 'abierta' }
      const { error } = await supabase.schema('padel').from('partidas_abiertas')
        .update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partidas-abiertas'] }),
  })

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Handshake className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Amistosos</h1>
        <Button
          onClick={() => setShowModal(true)}
          className="ml-auto bg-gold text-navy font-bold rounded-lg h-8 px-3 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-inter text-xs text-muted">
          {partidas?.length ?? 0} partido{partidas?.length !== 1 ? 's' : ''} abierto{partidas?.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={() => setShowModalPasado(true)}
          className="font-inter text-xs font-semibold border border-navy/20 rounded-lg px-2.5 py-1 text-navy"
        >
          Registrar pasado
        </button>
      </div>

      {(!partidas || partidas.length === 0) ? (
        <div className="rounded-xl bg-white shadow-card p-8 text-center space-y-2">
          <p className="font-inter text-sm text-muted">No hay partidos abiertos.</p>
          <p className="font-inter text-xs text-slate">Publica uno para que otros se sumen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {partidas.map(p => (
            <PartidaCard
              key={p.id}
              p={p}
              userId={user?.id}
              isAdmin={isAdmin}
              onUnirse={(id, slot) => unirse.mutate({ id, slot })}
              onSalir={id => salir.mutate(id)}
              onDetalle={setDetalle}
              joining={unirse.isPending}
            />
          ))}
        </div>
      )}

      {showModal && <NuevaPartidaModal onClose={() => setShowModal(false)} />}
      {showModalPasado && <NuevaPartidaModal isPasado onClose={() => setShowModalPasado(false)} />}
      {detalle && (
        <NuevaPartidaModal
          partida={detalle}
          onClose={() => setDetalle(null)}
        />
      )}
    </div>
  )
}
