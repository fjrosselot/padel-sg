import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { padelApi } from '../../lib/padelApi'
import { PlayerCombobox } from './PlayerCombobox'
import type { CategoriaFixture, ParejaFixture, PartidoFixture } from '../../lib/fixture/types'
import type { JugadorOption } from './PlayerCombobox'

interface Props {
  torneoId: string
  inscripcionId: string
  pareja: ParejaFixture
  onClose: () => void
}

const TAB_CLS =
  'px-4 py-2 text-sm font-semibold font-inter rounded-lg transition-colors data-[state=active]:bg-navy data-[state=active]:text-gold data-[state=inactive]:text-muted data-[state=inactive]:hover:text-navy'

function updateParejaInCategorias(
  categorias: CategoriaFixture[],
  inscripcionId: string,
  updates: Partial<ParejaFixture>
): CategoriaFixture[] {
  const applyToPareja = (p: ParejaFixture) =>
    p.id === inscripcionId ? { ...p, ...updates } : p

  const applyToPartido = (partido: PartidoFixture) => ({
    ...partido,
    pareja1:
      partido.pareja1?.id === inscripcionId
        ? { ...partido.pareja1, ...updates }
        : partido.pareja1,
    pareja2:
      partido.pareja2?.id === inscripcionId
        ? { ...partido.pareja2, ...updates }
        : partido.pareja2,
  })

  return categorias.map(cat => ({
    ...cat,
    grupos: (cat.grupos ?? []).map(g => ({
      ...g,
      parejas: g.parejas.map(applyToPareja),
      partidos: g.partidos.map(applyToPartido),
    })),
    faseEliminatoria: (cat.faseEliminatoria ?? []).map(applyToPartido),
    consola: (cat.consola ?? []).map(applyToPartido),
  }))
}

export default function EditParejaModal({ torneoId, inscripcionId, pareja, onClose }: Props) {
  const qc = useQueryClient()

  const [nombreRename, setNombreRename] = useState(pareja.nombre)
  const [slot, setSlot] = useState<'1' | '2'>('1')
  const [nuevoJugadorId, setNuevoJugadorId] = useState('')

  const { data: torneoData } = useQuery({
    queryKey: ['torneo-edit-pareja', torneoId],
    queryFn: () =>
      padelApi
        .get<Array<{ id: string; estado: string; categorias: unknown }>>(
          `torneos?id=eq.${torneoId}&select=id,estado,categorias`
        )
        .then(r => r[0]),
  })

  const { data: jugadores } = useQuery({
    queryKey: ['jugadores-activos-edit'],
    queryFn: () =>
      padelApi.get<JugadorOption[]>(
        'jugadores?select=id,nombre,apodo,sexo&estado_cuenta=eq.activo&order=nombre.asc'
      ),
    staleTime: 0,
  })

  const torneoEstado = torneoData?.estado ?? ''
  const fixtureGenerado = torneoEstado === 'en_curso' || torneoEstado === 'finalizado'
  const fixtureCategorias = fixtureGenerado
    ? ((torneoData?.categorias as unknown as CategoriaFixture[]) ?? [])
    : []

  const saveRename = useMutation({
    mutationFn: async () => {
      if (!nombreRename.trim()) throw new Error('El nombre no puede estar vacío')
      if (fixtureGenerado) {
        const updatedCats = updateParejaInCategorias(fixtureCategorias, inscripcionId, {
          nombre: nombreRename.trim(),
        })
        await padelApi.patch('torneos', `id=eq.${torneoId}`, { categorias: updatedCats })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
      onClose()
    },
  })

  const saveReplace = useMutation({
    mutationFn: async () => {
      if (torneoEstado === 'finalizado') throw new Error('No se puede reemplazar jugadores en un torneo finalizado')
      if (!nuevoJugadorId) throw new Error('Selecciona un jugador')
      const nuevoJugador = jugadores?.find(j => j.id === nuevoJugadorId)
      if (!nuevoJugador) throw new Error('Jugador no encontrado')

      const otroJugadorId = slot === '1' ? pareja.jugador2_id : pareja.jugador1_id
      const otroJugador = jugadores?.find(j => j.id === otroJugadorId)

      const j1 = slot === '1' ? nuevoJugador : { nombre: otroJugador?.nombre ?? '?' }
      const j2 = slot === '2' ? nuevoJugador : { nombre: otroJugador?.nombre ?? '?' }
      const nuevoNombre = `${j1.nombre} / ${j2.nombre}`

      const patchInscripcion = padelApi.patch(
        'inscripciones',
        `id=eq.${inscripcionId}`,
        slot === '1' ? { jugador1_id: nuevoJugadorId } : { jugador2_id: nuevoJugadorId }
      )

      const patchTorneo = fixtureGenerado
        ? padelApi.patch('torneos', `id=eq.${torneoId}`, {
            categorias: updateParejaInCategorias(fixtureCategorias, inscripcionId, {
              nombre: nuevoNombre,
              ...(slot === '1' ? { jugador1_id: nuevoJugadorId } : { jugador2_id: nuevoJugadorId }),
            }),
          })
        : Promise.resolve(null)

      await Promise.all([patchInscripcion, patchTorneo])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      onClose()
    },
  })

  const excludeId = slot === '1' ? (pareja.jugador2_id ?? undefined) : (pareja.jugador1_id ?? undefined)

  return (
    <div className="p-6 min-w-[440px]">
      <h2 className="text-lg font-bold font-inter text-navy mb-5">Editar pareja</h2>

      <Tabs.Root defaultValue="renombrar">
        <Tabs.List className="flex gap-1 bg-surface rounded-xl p-1 mb-5">
          <Tabs.Trigger value="renombrar" className={TAB_CLS}>
            Renombrar
          </Tabs.Trigger>
          <Tabs.Trigger
            value="reemplazar"
            disabled={torneoEstado === 'finalizado'}
            className={TAB_CLS}
          >
            Reemplazar jugador
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="renombrar">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                Nombre de la pareja
              </label>
              <input
                type="text"
                value={nombreRename}
                onChange={e => setNombreRename(e.target.value)}
                className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none transition-colors"
              />
            </div>

            {saveRename.isError && (
              <p className="text-sm text-red-500">
                {saveRename.error instanceof Error ? saveRename.error.message : 'Error al guardar'}
              </p>
            )}

            {!fixtureGenerado && (
              <p className="text-xs text-muted font-inter italic">
                El nombre se puede personalizar una vez generado el fixture.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold font-inter text-muted hover:text-navy transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => saveRename.mutate()}
                disabled={saveRename.isPending || !fixtureGenerado}
                className="px-4 py-2 text-sm font-semibold font-inter bg-navy text-gold rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-50"
              >
                {saveRename.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="reemplazar">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                Jugador a reemplazar
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="slot"
                    value="1"
                    checked={slot === '1'}
                    onChange={() => { setSlot('1'); setNuevoJugadorId('') }}
                    className="accent-gold"
                  />
                  <span className="text-sm font-inter text-navy">Jugador 1</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="slot"
                    value="2"
                    checked={slot === '2'}
                    onChange={() => { setSlot('2'); setNuevoJugadorId('') }}
                    className="accent-gold"
                  />
                  <span className="text-sm font-inter text-navy">Jugador 2</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                Nuevo jugador
              </label>
              <PlayerCombobox
                players={jugadores}
                value={nuevoJugadorId}
                onChange={setNuevoJugadorId}
                placeholder="— elige jugador —"
                excludeId={excludeId}
              />
            </div>

            {saveReplace.isError && (
              <p className="text-sm text-red-500">
                {saveReplace.error instanceof Error
                  ? saveReplace.error.message
                  : 'Error al guardar'}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold font-inter text-muted hover:text-navy transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => saveReplace.mutate()}
                disabled={saveReplace.isPending || !nuevoJugadorId || torneoEstado === 'finalizado'}
                className="px-4 py-2 text-sm font-semibold font-inter bg-navy text-gold rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-50"
              >
                {saveReplace.isPending ? 'Guardando...' : 'Reemplazar'}
              </button>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
