import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { padelApi } from '../../lib/padelApi'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { useUser } from '../../hooks/useUser'
import type { CategoriaConfig } from '../../lib/fixture/types'
import { SEXO_LABEL } from './TorneoWizard/constants'
import type { InscripcionRow } from './RosterRow'
import { PlayerCombobox, usePastCompaneros } from './PlayerCombobox'

interface Props {
  torneoId: string
  estado: 'borrador' | 'inscripcion' | 'en_curso' | 'finalizado'
  categorias: CategoriaConfig[]
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'outline',
  confirmada: 'default',
  rechazada: 'destructive',
}

export default function InscripcionesPanel({ torneoId, estado, categorias }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [showForm, setShowForm] = useState(false)
  const [companeroId, setCompaneroId] = useState('')
  const [categoriaNombre, setCategoriaNombre] = useState('')

  const { data: inscripciones, isLoading } = useQuery({
    queryKey: ['inscripciones', torneoId],
    queryFn: () => padelApi.get<InscripcionRow[]>(
      `inscripciones?select=id,jugador1_id,jugador2_id,estado,categoria_nombre,lista_espera,posicion_espera,created_at,jugador1:jugadores!jugador1_id(nombre,sexo),jugador2:jugadores!jugador2_id(nombre,sexo)&torneo_id=eq.${torneoId}&order=lista_espera.asc,posicion_espera.asc,created_at.asc`
    ),
  })

  const categoriaSeleccionada = categorias.find(c => c.nombre === categoriaNombre)

  const { data: jugadoresActivos } = useQuery({
    queryKey: ['jugadores-activos-select', categoriaSeleccionada?.sexo],
    queryFn: () => {
      const sexoFilter = categoriaSeleccionada?.sexo === 'M' ? '&sexo=eq.M' : categoriaSeleccionada?.sexo === 'F' ? '&sexo=eq.F' : ''
      return padelApi.get<{ id: string; nombre: string; apodo: string | null; sexo: 'M' | 'F' | null }[]>(`jugadores?select=id,nombre,apodo,sexo&estado_cuenta=eq.activo${sexoFilter}&order=nombre.asc`)
    },
    enabled: showForm && !!categoriaSeleccionada,
  })

  const { data: pastCompaneros } = usePastCompaneros(showForm ? user?.id : undefined)

  const cuposOcupados = (nombre: string) =>
    inscripciones?.filter(i => i.categoria_nombre === nombre && !i.lista_espera && i.estado !== 'rechazada').length ?? 0

  const cuposTotal = (nombre: string) =>
    categorias.find(c => c.nombre === nombre)?.num_parejas ?? 0

  const enListaEspera = (nombre: string) =>
    inscripciones?.filter(i => i.categoria_nombre === nombre && i.lista_espera) ?? []

  const yaInscrito = inscripciones?.some(
    ins =>
      ins.estado !== 'rechazada' &&
      (ins.jugador1_id === user?.id || ins.jugador2_id === user?.id)
  )

  const updateEstado = useMutation({
    mutationFn: ({ id, nuevoEstado }: { id: string; nuevoEstado: 'confirmada' | 'rechazada' }) =>
      padelApi.patch('inscripciones', `id=eq.${id}`, { estado: nuevoEstado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const inscribirse = useMutation({
    mutationFn: async () => {
      if (!user || !categoriaNombre) throw new Error('Selecciona una categoría')
      const ocupados = cuposOcupados(categoriaNombre)
      const total = cuposTotal(categoriaNombre)
      const estaLlena = ocupados >= total
      const posicion_espera = estaLlena ? enListaEspera(categoriaNombre).length + 1 : null
      await padelApi.post('inscripciones', {
        torneo_id: torneoId,
        jugador1_id: user.id,
        jugador2_id: companeroId,
        estado: 'pendiente',
        categoria_nombre: categoriaNombre,
        lista_espera: estaLlena,
        posicion_espera,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      setShowForm(false)
      setCompaneroId('')
      setCategoriaNombre('')
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

      {showForm && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-3">
          <p className="font-inter text-sm font-semibold text-navy">Inscribir pareja</p>

          <div>
            <label className="font-inter text-xs text-muted block mb-1">Categoría</label>
            <select
              value={categoriaNombre}
              onChange={e => { setCategoriaNombre(e.target.value); setCompaneroId('') }}
              className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
            >
              <option value="">— elige categoría —</option>
              {categorias.map(c => {
                const ocupados = cuposOcupados(c.nombre)
                const llena = ocupados >= c.num_parejas
                return (
                  <option key={c.nombre} value={c.nombre}>
                    {c.nombre} · {SEXO_LABEL[c.sexo]} · {ocupados}/{c.num_parejas}{llena ? ' (lista espera)' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {categoriaSeleccionada && (
            <div>
              <label className="font-inter text-xs text-muted block mb-1">
                Compañero/a
                {categoriaSeleccionada.sexo !== 'Mixto' && (
                  <span className="ml-1 text-gold">({SEXO_LABEL[categoriaSeleccionada.sexo]} solamente)</span>
                )}
              </label>
              <PlayerCombobox
                players={jugadoresActivos}
                value={companeroId}
                onChange={setCompaneroId}
                placeholder="— elige compañero —"
                excludeId={user?.id}
                suggestedIds={pastCompaneros ?? []}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => inscribirse.mutate()}
              disabled={!companeroId || !categoriaNombre || inscribirse.isPending}
              className="flex-1 bg-gold text-navy font-bold rounded-lg text-sm"
            >
              {inscribirse.isPending ? 'Inscribiendo…' : 'Confirmar inscripción'}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowForm(false); setCompaneroId(''); setCategoriaNombre('') }}
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

      {!isLoading && categorias.map(cat => {
        const activas = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && !i.lista_espera) ?? []
        const espera = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && i.lista_espera) ?? []
        if (activas.length === 0 && espera.length === 0) return null
        return (
          <div key={cat.nombre} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {cat.nombre} · {SEXO_LABEL[cat.sexo]} · {activas.length}/{cat.num_parejas}
            </p>
            {activas.map(ins => (
              <InscripcionCard
                key={ins.id}
                ins={ins}
                isAdmin={isAdmin}
                onUpdate={args => updateEstado.mutate(args)}
                updating={updateEstado.isPending}
              />
            ))}
            {espera.length > 0 && (
              <>
                <p className="text-xs text-muted pl-2 mt-1">Lista de espera:</p>
                {espera.map((ins, i) => (
                  <InscripcionCard
                    key={ins.id}
                    ins={ins}
                    isAdmin={isAdmin}
                    onUpdate={args => updateEstado.mutate(args)}
                    updating={updateEstado.isPending}
                    waitPos={i + 1}
                  />
                ))}
              </>
            )}
          </div>
        )
      })}

      {!isLoading && inscripciones?.filter(i => !i.categoria_nombre).map(ins => (
        <InscripcionCard
          key={ins.id}
          ins={ins}
          isAdmin={isAdmin}
          onUpdate={args => updateEstado.mutate(args)}
          updating={updateEstado.isPending}
        />
      ))}

      {!isLoading && (!inscripciones || inscripciones.length === 0) && (
        <p className="text-muted text-sm">No hay inscripciones aún.</p>
      )}
    </div>
  )
}

function InscripcionCard({
  ins, isAdmin, onUpdate, updating, waitPos,
}: {
  ins: InscripcionRow
  isAdmin: boolean
  onUpdate: (args: { id: string; nuevoEstado: 'confirmada' | 'rechazada' }) => void
  updating: boolean
  waitPos?: number
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface">
      <div>
        <p className="font-medium text-sm">
          {ins.jugador1?.nombre ?? ins.jugador1_id} / {ins.jugador2?.nombre ?? ins.jugador2_id}
        </p>
        <p className="text-xs text-muted">
          {new Date(ins.created_at).toLocaleDateString('es-CL')}
          {waitPos != null && <span className="ml-2 text-gold font-semibold">Espera #{waitPos}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={ESTADO_VARIANT[ins.estado]}>{ins.estado}</Badge>
        {isAdmin && ins.estado === 'pendiente' && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="bg-[#D1FAE5] text-[#065F46] border-transparent hover:bg-[#A7F3D0]"
              onClick={() => onUpdate({ id: ins.id, nuevoEstado: 'confirmada' })}
              disabled={updating}
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-[#FEE8E8] text-[#BA1A1A] border-transparent hover:bg-[#FED7D7]"
              onClick={() => onUpdate({ id: ins.id, nuevoEstado: 'rechazada' })}
              disabled={updating}
            >
              Rechazar
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
