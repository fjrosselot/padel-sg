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
    partidos: (cat.partidos ?? []).map(applyToPartido),
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
  const [j1Id, setJ1Id] = useState(pareja.jugador1_id ?? '')
  const [j2Id, setJ2Id] = useState(pareja.jugador2_id ?? '')

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

  const hasChanges = j1Id !== (pareja.jugador1_id ?? '') || j2Id !== (pareja.jugador2_id ?? '')

  const saveReplace = useMutation({
    mutationFn: async () => {
      if (torneoEstado === 'finalizado') throw new Error('No se puede reemplazar jugadores en un torneo finalizado')
      if (!hasChanges) throw new Error('Sin cambios')

      const j1 = jugadores?.find(j => j.id === j1Id)
      const j2 = jugadores?.find(j => j.id === j2Id)
      const nuevoNombre = `${j1?.nombre ?? '?'} / ${j2?.nombre ?? '?'}`

      const patch: Record<string, string> = {}
      if (j1Id !== (pareja.jugador1_id ?? '')) patch.jugador1_id = j1Id
      if (j2Id !== (pareja.jugador2_id ?? '')) patch.jugador2_id = j2Id

      await Promise.all([
        padelApi.patch('inscripciones', `id=eq.${inscripcionId}`, patch),
        fixtureGenerado
          ? padelApi.patch('torneos', `id=eq.${torneoId}`, {
              categorias: updateParejaInCategorias(fixtureCategorias, inscripcionId, {
                nombre: nuevoNombre,
                ...patch,
              }),
            })
          : Promise.resolve(null),
      ])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', torneoId] })
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      onClose()
    },
  })

  return (
    <div className="p-6 min-w-[440px]">
      <h2 className="text-lg font-bold font-inter text-navy mb-5">Editar pareja</h2>

      <Tabs.Root defaultValue="jugadores">
        <Tabs.List className="flex gap-1 bg-surface rounded-xl p-1 mb-5">
          <Tabs.Trigger value="jugadores" className={TAB_CLS}>
            Jugadores
          </Tabs.Trigger>
          <Tabs.Trigger value="renombrar" className={TAB_CLS}>
            Renombrar
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="jugadores">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                Jugador 1
              </label>
              <PlayerCombobox
                players={jugadores}
                value={j1Id}
                onChange={setJ1Id}
                placeholder="— elige jugador —"
                excludeId={j2Id || undefined}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">
                Jugador 2
              </label>
              <PlayerCombobox
                players={jugadores}
                value={j2Id}
                onChange={setJ2Id}
                placeholder="— elige jugador —"
                excludeId={j1Id || undefined}
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
                disabled={saveReplace.isPending || !hasChanges || torneoEstado === 'finalizado'}
                className="px-4 py-2 text-sm font-semibold font-inter bg-navy text-gold rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-50"
              >
                {saveReplace.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </Tabs.Content>

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
      </Tabs.Root>
    </div>
  )
}
