import { useState } from 'react'
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
import GenerarCobroModal from './GenerarCobroModal'
import EditTorneoModal from './EditTorneoModal'
import DeleteTorneoDialog from './DeleteTorneoDialog'
import { buildFixture, buildDesafioFixture, buildDesafioSembradoFixture } from '../../lib/fixture/engine'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaConfig, CategoriaFixture, PartidoFixture, ParejaFixture, ConfigFixture } from '../../lib/fixture/types'

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
  const qc = useQueryClient()

  const { data: torneo, isLoading } = useQuery({
    queryKey: ['torneo', id],
    queryFn: () => padelGet(`torneos?id=eq.${id}&select=*`).then((rows: Torneo[]) => rows[0] ?? null),
    enabled: !!id,
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

      const categoriasFixture = categoriasConfig.map(cat => {
        const catInscritas = inscritas.filter((i: any) => i.categoria_nombre === cat.nombre)

        if (cat.formato === 'desafio_sembrado') {
          const sorted = [...catInscritas].sort((a: any, b: any) => (a.sembrado ?? 999) - (b.sembrado ?? 999))
          const sgParejas: ParejaFixture[] = sorted.map((i: any) => ({
            id: i.id,
            nombre: `${i.j1?.nombre ?? '?'} / ${i.j2?.nombre ?? '?'}`,
            jugador1_id: i.jugador1_id,
            jugador2_id: i.jugador2_id,
            elo1: i.j1?.elo ?? 1200,
            elo2: i.j2?.elo ?? 1200,
          }))
          return buildDesafioSembradoFixture(cat, sgParejas, cat.rival_pairs ?? [], configFixture)
        }

        const parejas: ParejaFixture[] = catInscritas.map((i: any) => ({
          id: i.id,
          nombre: `${i.j1?.nombre ?? '?'} / ${i.j2?.nombre ?? '?'}`,
          jugador1_id: i.jugador1_id,
          jugador2_id: i.jugador2_id,
          elo1: i.j1?.elo ?? 1200,
          elo2: i.j2?.elo ?? 1200,
        }))
        return cat.formato === 'desafio_puntos'
          ? buildDesafioFixture(cat, parejas, configFixture)
          : buildFixture(cat, parejas, configFixture)
      })

      await padelPatch('torneos', id!, { categorias: categoriasFixture, estado: 'en_curso' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', id] })
      qc.invalidateQueries({ queryKey: ['inscripciones', id] })
    },
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

      {isAdmin && (torneo.estado === 'inscripcion' || torneo.estado === 'en_curso') && (
        <div className="flex gap-2">
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

      {isAdmin && (torneo.estado === 'borrador' || torneo.estado === 'inscripcion') && (
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
          {torneo.estado === 'inscripcion' && (
            <Button
              size="sm"
              className="bg-gold text-navy font-bold text-xs rounded-lg"
              onClick={() => generarFixture.mutate()}
              disabled={generarFixture.isPending}
            >
              {generarFixture.isPending ? 'Generando fixture…' : 'Generar fixture y comenzar'}
            </Button>
          )}
          {abrirInscripciones.error && (
            <p className="text-xs text-defeat w-full font-inter">
              {abrirInscripciones.error instanceof Error ? abrirInscripciones.error.message : 'Error al abrir inscripciones'}
            </p>
          )}
          {generarFixture.error && (
            <p className="text-xs text-defeat w-full font-inter">
              {generarFixture.error instanceof Error ? generarFixture.error.message : 'Error al generar fixture'}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white shadow-card p-4 space-y-6">

        {hasDesafio && (
          <DesafioView
            categorias={desafioCats}
            torneoId={torneo.id}
            isAdmin={isAdmin}
            onCargarResultado={setPartidoModal}
            colegioRival={torneo.colegio_rival ?? undefined}
          />
        )}

        {!hasAmericano && categoriasConfig.some(c => !c.formato || c.formato === 'americano_grupos') && (
          <p className="font-inter text-sm text-muted">
            El fixture se generará cuando el torneo pase a inscripción.
          </p>
        )}

        {hasAmericano && (
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List className="flex gap-1 bg-surface rounded-xl p-1 mb-6">
              <Tabs.Trigger value="fixture" className={TAB_CLS}>Fixture</Tabs.Trigger>
              <Tabs.Trigger value="bracket" className={TAB_CLS}>Bracket</Tabs.Trigger>
              <Tabs.Trigger value="horario" className={TAB_CLS}>Horario</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="fixture">
              <FixtureTab
                categorias={americanoCats}
                torneoId={torneo.id}
                isAdmin={isAdmin}
                onCargarResultado={setPartidoModal}
              />
            </Tabs.Content>

            <Tabs.Content value="bracket">
              <BracketTab categorias={americanoCats} />
            </Tabs.Content>

            <Tabs.Content value="horario">
              <HorarioTab categorias={americanoCats} />
            </Tabs.Content>
          </Tabs.Root>
        )}

        <div>
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-4">
            Inscripciones
          </p>
          {isAdmin
            ? <RosterAdmin torneoId={torneo.id} categorias={categoriasConfig} colegioRival={torneo.colegio_rival} />
            : <InscripcionesPanel torneoId={torneo.id} estado={torneo.estado} categorias={categoriasConfig} />
          }
        </div>
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

      {/* Edit modal */}
      {showEdit && (
        <EditTorneoModal torneo={torneo} onClose={() => setShowEdit(false)} />
      )}

      {/* Delete confirmation dialog */}
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
