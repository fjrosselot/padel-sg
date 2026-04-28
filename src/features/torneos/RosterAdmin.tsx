import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCheck } from 'lucide-react'
import { padelApi } from '../../lib/padelApi'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useUser } from '../../hooks/useUser'
import type { CategoriaConfig, ParejaFixture } from '../../lib/fixture/types'
import { SEXO_LABEL } from './TorneoWizard/constants'
import { buildCatColorMap } from './catColors'
import RosterRow from './RosterRow'
import type { InscripcionRow } from './RosterRow'
import { PlayerCombobox, usePastCompaneros } from './PlayerCombobox'
import EditParejaModal from './EditParejaModal'

interface Props {
  torneoId: string
  categorias: CategoriaConfig[]
}

export default function RosterAdmin({ torneoId, categorias }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [addingCat, setAddingCat] = useState<string | null>(null)
  const [j1Id, setJ1Id] = useState('')
  const [j2Id, setJ2Id] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null)
  const [editingPareja, setEditingPareja] = useState<{ inscripcionId: string; pareja: ParejaFixture } | null>(null)

  const { data: inscripciones } = useQuery({
    queryKey: ['inscripciones', torneoId],
    queryFn: () => padelApi.get<InscripcionRow[]>(
      `inscripciones?select=id,jugador1_id,jugador2_id,estado,categoria_nombre,lista_espera,posicion_espera,sembrado,created_at,jugador1:jugadores!jugador1_id(nombre),jugador2:jugadores!jugador2_id(nombre)&torneo_id=eq.${torneoId}&order=lista_espera.asc,posicion_espera.asc,created_at.asc`
    ),
  })

  const catActiva = categorias.find(c => c.nombre === addingCat)

  const { data: jugadoresRaw } = useQuery({
    queryKey: ['jugadores-activos-select', catActiva?.sexo],
    queryFn: () => {
      const sexoFilter = catActiva?.sexo === 'M' ? '&sexo=eq.M' : catActiva?.sexo === 'F' ? '&sexo=eq.F' : ''
      return padelApi.get<{ id: string; nombre: string; apodo: string | null; sexo: 'M' | 'F' | null; categoria: string | null }[]>(
        `jugadores?select=id,nombre,apodo,sexo,categoria&estado_cuenta=eq.activo${sexoFilter}&order=nombre.asc`
      )
    },
    enabled: !!addingCat,
  })

  const categoriasDisponibles = [...new Set((jugadoresRaw ?? []).map(j => j.categoria).filter(Boolean))].sort() as string[]
  const jugadoresOptions = categoriaFiltro
    ? jugadoresRaw?.filter(j => j.categoria === categoriaFiltro)
    : jugadoresRaw

  const { data: pastCompaneros } = usePastCompaneros(j1Id || undefined)

  const inscritosIds = new Set(
    (inscripciones ?? [])
      .filter(i => i.estado !== 'rechazada')
      .flatMap(i => [i.jugador1_id, i.jugador2_id])
  )

  const addPareja = useMutation({
    mutationFn: async ({ cat }: { cat: string }) => {
      if (!j1Id || !j2Id) throw new Error('Selecciona ambos jugadores')
      const activas = inscripciones?.filter(
        i => i.categoria_nombre === cat && !i.lista_espera && i.estado !== 'rechazada'
      ).length ?? 0
      const total = categorias.find(c => c.nombre === cat)?.num_parejas ?? 0
      const estaLlena = activas >= total
      const posicion_espera = estaLlena
        ? (inscripciones?.filter(i => i.categoria_nombre === cat && i.lista_espera).length ?? 0) + 1
        : null
      await padelApi.post('inscripciones', {
        torneo_id: torneoId,
        jugador1_id: j1Id,
        jugador2_id: j2Id,
        estado: 'confirmada',
        categoria_nombre: cat,
        lista_espera: estaLlena,
        posicion_espera,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] })
      setAddingCat(null)
      setJ1Id('')
      setJ2Id('')
    },
  })

  const updateEstado = useMutation({
    mutationFn: ({ inscripcionId, nuevoEstado }: { inscripcionId: string; nuevoEstado: 'confirmada' | 'rechazada' }) =>
      padelApi.patch('inscripciones', `id=eq.${inscripcionId}`, { estado: nuevoEstado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const promoverEspera = useMutation({
    mutationFn: (inscripcionId: string) =>
      padelApi.patch('inscripciones', `id=eq.${inscripcionId}`, { lista_espera: false, posicion_espera: null, estado: 'confirmada' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const eliminarInscripcion = useMutation({
    mutationFn: async (inscripcionId: string) => {
      setDeletingId(inscripcionId)
      await padelApi.delete('inscripciones', `id=eq.${inscripcionId}`)
    },
    onSettled: () => setDeletingId(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  const closeModal = () => { setAddingCat(null); setJ1Id(''); setJ2Id(''); setCategoriaFiltro(null) }

  const catColorMap = useMemo(() => buildCatColorMap(categorias.map(c => ({ nombre: c.nombre, color_fondo: c.color_fondo, color_borde: c.color_borde, color_texto: c.color_texto }))), [categorias])

  if (!isAdmin) return null

  return (
    <div className="space-y-4">

      {/* Modal agregar pareja */}
      <Dialog open={!!addingCat} onOpenChange={open => { if (!open) closeModal() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-manrope text-navy">
              Agregar pareja — {addingCat}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {categoriasDisponibles.length > 1 && (
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Filtrar por categoría</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setCategoriaFiltro(null); setJ1Id(''); setJ2Id('') }}
                    className={`rounded-full px-3 py-1 font-inter text-xs font-semibold transition-colors ${!categoriaFiltro ? 'bg-navy text-gold' : 'bg-surface text-muted hover:text-navy'}`}
                  >
                    Todos
                  </button>
                  {categoriasDisponibles.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { setCategoriaFiltro(cat); setJ1Id(''); setJ2Id('') }}
                      className={`rounded-full px-3 py-1 font-inter text-xs font-semibold transition-colors ${categoriaFiltro === cat ? 'bg-navy text-gold' : 'bg-surface text-muted hover:text-navy'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Jugador 1</label>
              <PlayerCombobox
                players={jugadoresOptions}
                value={j1Id}
                onChange={id => { setJ1Id(id); setJ2Id('') }}
                placeholder="Buscar jugador…"
                excludeId={j2Id}
                inscritosIds={inscritosIds}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Jugador 2</label>
              <PlayerCombobox
                players={jugadoresOptions}
                value={j2Id}
                onChange={setJ2Id}
                placeholder="Buscar jugador…"
                excludeId={j1Id}
                suggestedIds={pastCompaneros ?? []}
                inscritosIds={inscritosIds}
              />
            </div>
            {addPareja.error && (
              <p className="text-xs text-defeat">
                {(() => {
                  const msg = addPareja.error instanceof Error ? addPareja.error.message : ''
                  if (msg.includes('row-level security')) return 'Sin permisos para inscribir. Verifica que tu cuenta tenga rol de administrador.'
                  if (msg.includes('duplicate') || msg.includes('unique')) return 'Uno o ambos jugadores ya están inscritos en este torneo.'
                  if (msg.includes('ambos jugadores')) return 'Debes seleccionar ambos jugadores antes de agregar.'
                  return 'No se pudo agregar la pareja. Intenta nuevamente o contacta al soporte.'
                })()}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => addingCat && addPareja.mutate({ cat: addingCat })}
                disabled={!j1Id || !j2Id || addPareja.isPending}
                className="flex-1 bg-gold text-navy font-bold"
              >
                {addPareja.isPending ? 'Agregando…' : 'Agregar pareja'}
              </Button>
              <Button variant="outline" onClick={closeModal} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {categorias.map(cat => {
        const activas = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && !i.lista_espera) ?? []
        const espera = inscripciones?.filter(i => i.categoria_nombre === cat.nombre && i.lista_espera) ?? []
        const colors = catColorMap.get(cat.nombre) ?? { bg: '#f1f5f9', dot: '#64748b' }
        const pct = cat.num_parejas > 0 ? Math.round((activas.length / cat.num_parejas) * 100) : 0

        return (
          <div key={cat.nombre} className="rounded-xl bg-white shadow-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: colors.bg }}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors.dot }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-manrope text-sm font-bold text-navy leading-tight">{cat.nombre}</p>
                  {cat.formato === 'desafio_sembrado' && (
                    <span className="font-inter text-[10px] font-bold text-gold">Sembrado</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-inter text-[10px] text-muted">{SEXO_LABEL[cat.sexo]}</span>
                  <span className="font-inter text-[10px] text-muted">·</span>
                  <span className="font-inter text-[10px] font-semibold text-navy">
                    {cat.num_parejas > 0 ? `${activas.length}/${cat.num_parejas}` : `${activas.length} parejas`}
                  </span>
                  {cat.num_parejas > 0 && <div className="flex-1 max-w-[56px] h-1 rounded-full bg-navy/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors.dot }} />
                  </div>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setAddingCat(cat.nombre); setJ1Id(''); setJ2Id('') }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-inter text-[11px] font-semibold text-navy bg-white/70 hover:bg-white border border-navy/15 transition-colors shrink-0"
              >
                <Plus className="h-3 w-3" /> Agregar
              </button>
            </div>

            {/* Parejas activas */}
            <div>
              {activas.map((ins, i) => (
                <RosterRow
                  key={ins.id}
                  ins={ins}
                  num={i + 1}
                  dot={colors.dot}
                  onEliminar={() => eliminarInscripcion.mutate(ins.id)}
                  eliminating={deletingId === ins.id}
                  onEdit={() => setEditingPareja({
                    inscripcionId: ins.id,
                    pareja: {
                      id: ins.id,
                      nombre: `${ins.jugador1?.nombre ?? '?'} / ${ins.jugador2?.nombre ?? '?'}`,
                      jugador1_id: ins.jugador1_id,
                      jugador2_id: ins.jugador2_id,
                      elo1: 0,
                      elo2: 0,
                    },
                  })}
                  onConfirmar={ins.estado === 'pendiente' ? () => updateEstado.mutate({ inscripcionId: ins.id, nuevoEstado: 'confirmada' }) : undefined}
                  onRechazar={ins.estado === 'pendiente' ? () => updateEstado.mutate({ inscripcionId: ins.id, nuevoEstado: 'rechazada' }) : undefined}
                />
              ))}

              {/* Lista de espera */}
              {espera.length > 0 && (
                <div className="border-t border-dashed border-navy/15">
                  <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5">
                    <UserCheck className="h-3 w-3 text-muted" />
                    <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-muted">Lista de espera</span>
                  </div>
                  {espera.map((ins, i) => (
                    <RosterRow
                      key={ins.id}
                      ins={ins}
                      dot={colors.dot}
                      waitPos={i + 1}
                      onPromover={() => promoverEspera.mutate(ins.id)}
                      onEliminar={() => eliminarInscripcion.mutate(ins.id)}
                      eliminating={deletingId === ins.id}
                    />
                  ))}
                </div>
              )}

              {activas.length === 0 && espera.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="font-inter text-sm text-muted">Sin inscritos aún.</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
      <Dialog open={!!editingPareja} onOpenChange={open => { if (!open) setEditingPareja(null) }}>
        <DialogContent className="max-w-lg p-0">
          {editingPareja && (
            <EditParejaModal
              torneoId={torneoId}
              inscripcionId={editingPareja.inscripcionId}
              pareja={editingPareja.pareja}
              onClose={() => setEditingPareja(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
