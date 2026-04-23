import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Banknote, Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Tabs from '@radix-ui/react-tabs'
import { useUser } from '../../hooks/useUser'
import { padelGet, padelPatch, ESTADO_LABELS } from './torneoApi'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import FixtureTab from './FixtureTab'
import BracketTab from './BracketTab'
import HorarioTab from './HorarioTab'
import DesafioView from './DesafioView'
import InscripcionesPanel from './InscripcionesPanel'
import ResultadosModal from './ResultadosModal'
import RosterAdmin from './RosterAdmin'
import SembradoPanel from './SembradoPanel'
import GenerarCobroModal from './GenerarCobroModal'
import EditTorneoModal from './EditTorneoModal'
import DeleteTorneoDialog from './DeleteTorneoDialog'
import { buildFixture, buildDesafioFixture, buildDesafioSembradoFixture } from '../../lib/fixture/engine'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaConfig, CategoriaFixture, PartidoFixture, ParejaFixture, ConfigFixture } from '../../lib/fixture/types'
import type { InscripcionRow } from './RosterRow'

type Torneo = Database['padel']['Tables']['torneos']['Row']

function impactMessage(estado: string): string {
  if (estado === 'borrador') return 'Se eliminará el torneo y su configuración.'
  if (estado === 'inscripcion') return 'Se eliminará el torneo y todas las inscripciones asociadas.'
  return 'Se eliminará el torneo, inscripciones, partidos y resultados registrados.'
}

const TAB_CLS = [
  'font-inter text-sm font-semibold px-4 py-2 rounded-lg transition-colors',
  'data-[state=inactive]:text-muted data-[state=inactive]:hover:text-navy',
  'data-[state=active]:bg-navy data-[state=active]:text-gold',
].join(' ')

export default function TorneoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const [partidoModal, setPartidoModal] = useState<PartidoFixture | null>(null)
  const [showCobro, setShowCobro] = useState(false)
  const [activeTab, setActiveTab] = useState('fixture')
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const isSuperAdmin = user?.rol === 'superadmin'
  const qc = useQueryClient()

  const { data: torneo, isLoading } = useQuery({
    queryKey: ['torneo', id],
    queryFn: () => padelGet(`torneos?id=eq.${id}&select=*`).then((rows: Torneo[]) => rows[0] ?? null),
    enabled: !!id,
  })

  const { data: inscripciones } = useQuery({
    queryKey: ['inscripciones', id],
    queryFn: () => padelGet(
      `inscripciones?select=id,jugador1_id,jugador2_id,estado,categoria_nombre,lista_espera,posicion_espera,sembrado,created_at,jugador1:jugadores!jugador1_id(nombre),jugador2:jugadores!jugador2_id(nombre)&torneo_id=eq.${id}&order=lista_espera.asc,posicion_espera.asc,created_at.asc`
    ).then((rows: unknown) => rows as InscripcionRow[]),
    enabled: !!id && isAdmin,
  })

  const abrirInscripciones = useMutation({
    mutationFn: () => padelPatch('torneos', id!, { estado: 'inscripcion' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', id] }),
  })

  const generarFixture = useMutation({
    mutationFn: async () => {
      const inscritas: any[] = await padelGet(
        `inscripciones?select=id,jugador1_id,jugador2_id,categoria_nombre,sembrado,j1:jugadores!jugador1_id(id,nombre,elo),j2:jugadores!jugador2_id(id,nombre,elo)&torneo_id=eq.${id}&estado=eq.confirmada&lista_espera=eq.false`
      )
      const configFixture = torneo!.config_fixture as unknown as ConfigFixture
      if (!configFixture) throw new Error('El torneo no tiene configuración de fixture guardada.')

      const rawCats = (torneo!.categorias as unknown as (CategoriaFixture | CategoriaConfig)[]) ?? []
      const isFixture = (c: any) => Array.isArray(c.grupos) || Array.isArray(c.partidos)
      const effectiveCats: CategoriaConfig[] = rawCats.some(c => !isFixture(c))
        ? (rawCats.filter(c => !isFixture(c)) as CategoriaConfig[])
        : (rawCats as CategoriaFixture[]).map(c => ({
            nombre: c.nombre,
            formato: c.formato ?? 'americano_grupos',
            rival_pairs: c.rival_pairs,
            num_parejas: (c.partidos ?? []).length,
            sexo: 'M' as const,
          }))

      let sembradoMatchOffset = 0
      const categoriasFixture = effectiveCats.map(cat => {
        const catInscritas = inscritas.filter((i: any) => i.categoria_nombre === cat.nombre)

        if (cat.formato === 'desafio_sembrado') {
          const sorted = [...catInscritas].sort((a: any, b: any) => (a.sembrado ?? 999) - (b.sembrado ?? 999))
          const sgParejas: ParejaFixture[] = sorted.map((i: any) => ({
            id: i.id, nombre: `${i.j1?.nombre ?? '?'} / ${i.j2?.nombre ?? '?'}`,
            jugador1_id: i.jugador1_id, jugador2_id: i.jugador2_id,
            elo1: i.j1?.elo ?? 1200, elo2: i.j2?.elo ?? 1200,
          }))
          const result = buildDesafioSembradoFixture(cat, sgParejas, cat.rival_pairs ?? [], configFixture, sembradoMatchOffset)
          sembradoMatchOffset += (result.partidos ?? []).length
          return result
        }

        const parejas: ParejaFixture[] = catInscritas.map((i: any) => ({
          id: i.id, nombre: `${i.j1?.nombre ?? '?'} / ${i.j2?.nombre ?? '?'}`,
          jugador1_id: i.jugador1_id, jugador2_id: i.jugador2_id,
          elo1: i.j1?.elo ?? 1200, elo2: i.j2?.elo ?? 1200,
        }))
        return cat.formato === 'desafio_puntos'
          ? buildDesafioFixture(cat, parejas, configFixture)
          : buildFixture(cat, parejas, configFixture)
      })

      const patch: Record<string, unknown> = { categorias: categoriasFixture }
      if (torneo!.estado === 'inscripcion') patch.estado = 'en_curso'
      await padelPatch('torneos', id!, patch)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', id] })
      qc.invalidateQueries({ queryKey: ['inscripciones', id] })
    },
  })

  const finalizarTorneo = useMutation({
    mutationFn: () => padelPatch('torneos', id!, { estado: 'finalizado' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', id] }),
  })

  const reabrirTorneo = useMutation({
    mutationFn: () => padelPatch('torneos', id!, { estado: 'en_curso' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', id] }),
  })

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando…</div>
  if (!torneo) return <div className="p-6 text-defeat font-inter text-sm">Torneo no encontrado</div>

  const rawCategorias = (torneo.categorias as unknown as (CategoriaFixture | CategoriaConfig)[]) ?? []
  const categorias = rawCategorias.filter(
    (c): c is CategoriaFixture =>
      Array.isArray((c as CategoriaFixture).grupos) || Array.isArray((c as CategoriaFixture).partidos)
  )
  const categoriasConfig = rawCategorias.filter(
    (c): c is CategoriaConfig =>
      !Array.isArray((c as CategoriaFixture).grupos) && !Array.isArray((c as CategoriaFixture).partidos)
  ) as CategoriaConfig[]

  const americanoCats = categorias.filter(c => !c.formato || c.formato === 'americano_grupos')
  const desafioCats = categorias.filter(c => c.formato === 'desafio_puntos' || c.formato === 'desafio_sembrado')
  const hasAmericano = americanoCats.length > 0
  const hasDesafio = desafioCats.length > 0
  const fixtureGenerado = categorias.length > 0

  const rosterCats: CategoriaConfig[] = categoriasConfig.length > 0
    ? categoriasConfig
    : categorias.map(c => ({
        nombre: c.nombre,
        formato: c.formato ?? 'americano_grupos',
        rival_pairs: c.rival_pairs,
        num_parejas: (c.partidos ?? []).length,
        sexo: 'M' as const,
      }))

  const hasDesafioSembrado = rosterCats.some(c => c.formato === 'desafio_sembrado')
  const fixtureLabelText = hasDesafio && !hasAmericano ? 'Partidos' : 'Fixture'

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted font-inter text-sm hover:text-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Torneos
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-manrope text-navy">{torneo.nombre}</h1>
          <p className="text-muted text-sm font-inter">{torneo.fecha_inicio}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs rounded-lg border-navy/20 text-navy gap-1.5"
              onClick={() => setShowEdit(true)}
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          )}
          <Badge>{ESTADO_LABELS[torneo.estado]}</Badge>
        </div>
      </div>

      {isAdmin && torneo.estado !== 'borrador' && torneo.estado !== 'finalizado' && (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="text-xs rounded-lg border-navy/20 text-navy gap-1.5"
            onClick={() => setShowCobro(true)}
          >
            <Banknote className="h-3.5 w-3.5" /> Cobro inscripción
          </Button>
        </div>
      )}

      {isAdmin && torneo.estado !== 'finalizado' && (
        <div className="flex gap-2 flex-wrap">
          {torneo.estado === 'borrador' && (
            <Button
              size="sm"
              className="bg-navy text-white text-xs font-semibold rounded-lg"
              onClick={() => abrirInscripciones.mutate()}
              disabled={abrirInscripciones.isPending}
            >
              {abrirInscripciones.isPending ? 'Abriendo…' : 'Abrir inscripciones'}
            </Button>
          )}
          {(torneo.estado === 'inscripcion' || torneo.estado === 'en_curso') && (
            <Button
              size="sm"
              className="bg-gold text-navy font-bold text-xs rounded-lg"
              onClick={() => generarFixture.mutate()}
              disabled={generarFixture.isPending}
            >
              {generarFixture.isPending
                ? (fixtureGenerado ? 'Regenerando…' : 'Generando…')
                : (fixtureGenerado ? 'Regenerar fixture' : 'Generar fixture y comenzar')}
            </Button>
          )}
          {isSuperAdmin && torneo.estado === 'en_curso' && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs rounded-lg border-navy/20 text-navy gap-1.5"
              onClick={() => finalizarTorneo.mutate()}
              disabled={finalizarTorneo.isPending}
            >
              {finalizarTorneo.isPending ? 'Finalizando…' : 'Finalizar torneo'}
            </Button>
          )}
          {[abrirInscripciones.error, generarFixture.error, finalizarTorneo.error].map((err, i) =>
            err ? <p key={i} className="text-xs text-defeat w-full font-inter">{(err as Error).message}</p> : null
          )}
        </div>
      )}

      {isSuperAdmin && torneo.estado === 'finalizado' && (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="text-xs rounded-lg border-navy/20 text-navy gap-1.5"
            onClick={() => reabrirTorneo.mutate()}
            disabled={reabrirTorneo.isPending}
          >
            {reabrirTorneo.isPending ? 'Reabriendo…' : 'Reabrir torneo'}
          </Button>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-card p-4">
        <TabsDetalle
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          fixtureGenerado={fixtureGenerado}
          fixtureLabelText={fixtureLabelText}
          hasAmericano={hasAmericano}
          hasDesafio={hasDesafio}
          isAdmin={isAdmin}
          hasDesafioSembrado={hasDesafioSembrado}
          americanoCats={americanoCats}
          desafioCats={desafioCats}
          rosterCats={rosterCats}
          inscripciones={inscripciones}
          torneo={torneo}
          onCargarResultado={setPartidoModal}
        />
      </div>

      {/* Danger Zone */}
      {isAdmin && (
        <div className="rounded-xl border border-defeat/20 bg-defeat/5 p-4 space-y-3 mt-2">
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-defeat/60">
            Zona de peligro
          </p>
          <div className="flex items-start justify-between gap-4">
            <p className="font-inter text-sm text-defeat/80">
              {impactMessage(torneo.estado)}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs rounded-lg border-defeat/30 text-defeat gap-1.5 hover:bg-defeat/10 shrink-0"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar torneo
            </Button>
          </div>
        </div>
      )}

      {showEdit && (
        <EditTorneoModal torneo={torneo} onClose={() => setShowEdit(false)} />
      )}

      <DeleteTorneoDialog
        torneoId={id!}
        torneoNombre={torneo.nombre}
        torneoEstado={torneo.estado}
        open={showDelete}
        onOpenChange={open => { if (!open) setShowDelete(false) }}
      />

      {showCobro && (
        <GenerarCobroModal
          torneoId={torneo.id}
          torneoNombre={torneo.nombre}
          onClose={() => setShowCobro(false)}
        />
      )}
      {partidoModal && (
        <ResultadosModal
          partido={partidoModal}
          torneoId={id!}
          torneo={{ id: id!, nombre: torneo.nombre, fecha_inicio: torneo.fecha_inicio ?? '', colegio_rival: torneo.colegio_rival }}
          onClose={() => setPartidoModal(null)}
        />
      )}
    </div>
  )
}

interface TabsProps {
  activeTab: string
  setActiveTab: (v: string) => void
  fixtureGenerado: boolean
  fixtureLabelText: string
  hasAmericano: boolean
  hasDesafio: boolean
  isAdmin: boolean
  hasDesafioSembrado: boolean
  americanoCats: CategoriaFixture[]
  desafioCats: CategoriaFixture[]
  rosterCats: CategoriaConfig[]
  inscripciones: InscripcionRow[] | undefined
  torneo: Torneo
  onCargarResultado: (p: PartidoFixture) => void
}

function TabsDetalle({
  activeTab, setActiveTab, fixtureGenerado, fixtureLabelText,
  hasAmericano, hasDesafio, isAdmin, hasDesafioSembrado,
  americanoCats, desafioCats, rosterCats, inscripciones, torneo, onCargarResultado,
}: TabsProps) {
  useEffect(() => {
    if (!fixtureGenerado && activeTab === 'fixture') setActiveTab('parejas')
  }, [fixtureGenerado])

  const sembradoCats = rosterCats.filter(c => c.formato === 'desafio_sembrado')

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <Tabs.List className="flex gap-1 bg-surface rounded-xl p-1 mb-6 flex-wrap">
        {fixtureGenerado && (
          <Tabs.Trigger value="fixture" className={TAB_CLS}>{fixtureLabelText}</Tabs.Trigger>
        )}
        {hasAmericano && fixtureGenerado && (
          <Tabs.Trigger value="bracket" className={TAB_CLS}>Bracket</Tabs.Trigger>
        )}
        {hasAmericano && fixtureGenerado && (
          <Tabs.Trigger value="horario" className={TAB_CLS}>Horario</Tabs.Trigger>
        )}
        <Tabs.Trigger value="parejas" className={TAB_CLS}>Parejas</Tabs.Trigger>
        {isAdmin && hasDesafioSembrado && (
          <Tabs.Trigger value="sembrado" className={TAB_CLS}>Sembrado</Tabs.Trigger>
        )}
      </Tabs.List>

      <Tabs.Content value="fixture">
        {hasAmericano && (
          <FixtureTab
            categorias={americanoCats}
            torneoId={torneo.id}
            isAdmin={isAdmin}
            onCargarResultado={onCargarResultado}
          />
        )}
        {hasDesafio && (
          <DesafioView
            categorias={desafioCats}
            torneoId={torneo.id}
            isAdmin={isAdmin}
            onCargarResultado={onCargarResultado}
            colegioRival={torneo.colegio_rival ?? undefined}
          />
        )}
      </Tabs.Content>

      <Tabs.Content value="bracket">
        <BracketTab categorias={americanoCats} />
      </Tabs.Content>

      <Tabs.Content value="horario">
        <HorarioTab categorias={americanoCats} />
      </Tabs.Content>

      <Tabs.Content value="parejas">
        {isAdmin
          ? <RosterAdmin torneoId={torneo.id} categorias={rosterCats} />
          : <InscripcionesPanel torneoId={torneo.id} estado={torneo.estado} categorias={rosterCats} />
        }
      </Tabs.Content>

      {isAdmin && hasDesafioSembrado && (
        <Tabs.Content value="sembrado">
          <div className="space-y-8">
            {sembradoCats.map(cat => (
              <div key={cat.nombre}>
                {sembradoCats.length > 1 && (
                  <p className="font-inter text-sm font-semibold text-navy mb-3">{cat.nombre}</p>
                )}
                <SembradoPanel
                  torneoId={torneo.id}
                  cat={cat}
                  inscripciones={(inscripciones ?? []).filter(i => i.categoria_nombre === cat.nombre)}
                  colegioRival={torneo.colegio_rival ?? 'Rival'}
                />
              </div>
            ))}
          </div>
        </Tabs.Content>
      )}
    </Tabs.Root>
  )
}
