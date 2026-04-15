import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { useUser } from '../../hooks/useUser'

interface InscripcionRow {
  id: string
  jugador1_id: string
  jugador2_id: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  created_at: string
  jugador1: { nombre: string } | null
  jugador2: { nombre: string } | null
}

interface JugadorOption {
  id: string
  nombre: string
  apodo: string | null
}

interface Props {
  torneoId: string
  estado: 'borrador' | 'inscripcion' | 'en_curso' | 'finalizado'
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'outline',
  confirmada: 'default',
  rechazada: 'destructive',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
}

export default function InscripcionesPanel({ torneoId, estado }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [showForm, setShowForm] = useState(false)
  const [companeroId, setCompaneroId] = useState('')

  const { data: inscripciones, isLoading } = useQuery({
    queryKey: ['inscripciones', torneoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .select('id, jugador1_id, jugador2_id, estado, created_at, jugador1:jugadores!jugador1_id(nombre), jugador2:jugadores!jugador2_id(nombre)')
        .eq('torneo_id', torneoId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as InscripcionRow[]
    },
  })

  const { data: jugadoresActivos } = useQuery({
    queryKey: ['jugadores-activos-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo')
        .eq('estado_cuenta', 'activo')
        .order('nombre')
      if (error) throw error
      return data as JugadorOption[]
    },
    enabled: showForm,
  })

  const yaInscrito = inscripciones?.some(
    ins => ins.jugador1_id === user?.id || ins.jugador2_id === user?.id
  )

  const updateEstado = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string; nuevoEstado: 'confirmada' | 'rechazada' }) => {
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const inscribirse = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No autenticado')
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .insert({
          torneo_id: torneoId,
          jugador1_id: user.id,
          jugador2_id: companeroId,
          estado: 'pendiente',
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      setShowForm(false)
      setCompaneroId('')
    },
  })

  const canInscribirse = estado === 'inscripcion' && !yaInscrito && !isAdmin

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy">Inscripciones</h2>
        {canInscribirse && !showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-gold text-navy font-bold rounded-lg text-xs h-8 px-3"
          >
            + Inscribirme
          </Button>
        )}
      </div>

      {/* Formulario de inscripción */}
      {showForm && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-3">
          <p className="font-inter text-sm font-semibold text-navy">Inscribir pareja</p>
          <div>
            <label htmlFor="companero" className="font-inter text-xs text-muted block mb-1">Selecciona tu compañero/a</label>
            <select
              id="companero"
              value={companeroId}
              onChange={e => setCompaneroId(e.target.value)}
              className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
            >
              <option value="">— elige compañero —</option>
              {jugadoresActivos?.filter(j => j.id !== user?.id).map(j => (
                <option key={j.id} value={j.id}>
                  {j.nombre}{j.apodo ? ` (${j.apodo})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => inscribirse.mutate()}
              disabled={!companeroId || inscribirse.isPending}
              className="flex-1 bg-gold text-navy font-bold rounded-lg text-sm"
            >
              {inscribirse.isPending ? 'Inscribiendo…' : 'Confirmar inscripción'}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowForm(false); setCompaneroId('') }}
              className="border-navy/20 text-navy text-sm rounded-lg"
            >
              Cancelar
            </Button>
          </div>
          {inscribirse.error && (
            <p className="font-inter text-xs text-defeat">
              {inscribirse.error instanceof Error ? inscribirse.error.message : 'Error al inscribirse.'}
            </p>
          )}
        </div>
      )}

      {yaInscrito && !isAdmin && (
        <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 font-inter text-sm text-muted">
          Ya estás inscrito en este torneo.
        </div>
      )}

      {isLoading && <p className="text-muted text-sm">Cargando…</p>}

      {!isLoading && (!inscripciones || inscripciones.length === 0) && (
        <p className="text-muted text-sm">No hay inscripciones aún.</p>
      )}

      <div className="space-y-2">
        {inscripciones?.map(ins => (
          <div key={ins.id} className="flex items-center justify-between p-3 rounded-xl bg-surface">
            <div>
              <p className="font-medium text-sm">
                {ins.jugador1?.nombre ?? ins.jugador1_id} / {ins.jugador2?.nombre ?? ins.jugador2_id}
              </p>
              <p className="text-xs text-muted">
                {new Date(ins.created_at).toLocaleDateString('es-CL')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={ESTADO_VARIANT[ins.estado]}>{ESTADO_LABEL[ins.estado]}</Badge>
              {isAdmin && ins.estado === 'pendiente' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-[#D1FAE5] text-[#065F46] border-transparent hover:bg-[#A7F3D0]"
                    onClick={() => updateEstado.mutate({ id: ins.id, nuevoEstado: 'confirmada' })}
                    disabled={updateEstado.isPending}
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-[#FEE8E8] text-[#BA1A1A] border-transparent hover:bg-[#FED7D7]"
                    onClick={() => updateEstado.mutate({ id: ins.id, nuevoEstado: 'rechazada' })}
                    disabled={updateEstado.isPending}
                  >
                    Rechazar
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
