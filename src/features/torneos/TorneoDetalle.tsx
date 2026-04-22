import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminHeaders } from '../../lib/adminHeaders'
import { useUser } from '../../hooks/useUser'

const SB = import.meta.env.VITE_SUPABASE_URL as string

async function padelGet(path: string) {
  const headers = await adminHeaders('read')
  const res = await fetch(`${SB}/rest/v1/${path}`, { headers })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`) }
  return res.json()
}

async function padelPatch(table: string, id: string, body: Record<string, unknown>) {
  const headers = await adminHeaders('write')
  const res = await fetch(`${SB}/rest/v1/${table}?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`) }
}
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import FixtureView from './FixtureView'
import InscripcionesPanel from './InscripcionesPanel'
import ResultadosModal from './ResultadosModal'
import RosterAdmin from './RosterAdmin'
import { buildFixture, buildDesafioFixture } from '../../lib/fixture/engine'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaConfig, CategoriaFixture, PartidoFixture, ParejaFixture, ConfigFixture } from '../../lib/fixture/types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  inscripcion: 'Inscripciones',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
}

export default function TorneoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const [partidoModal, setPartidoModal] = useState<PartidoFixture | null>(null)

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
        `inscripciones?select=id,jugador1_id,jugador2_id,categoria_nombre,j1:jugadores!jugador1_id(id,nombre,elo),j2:jugadores!jugador2_id(id,nombre,elo)&torneo_id=eq.${id}&estado=eq.confirmada&lista_espera=eq.false`
      )

      const configFixture = torneo!.config_fixture as unknown as ConfigFixture
      if (!configFixture) throw new Error('El torneo no tiene configuración de fixture guardada.')

      const categoriasFixture = categoriasConfig.map(cat => {
        const parejas: ParejaFixture[] = inscritas
          .filter((i: any) => i.categoria_nombre === cat.nombre)
          .map((i: any) => ({
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

  if (isLoading) return <div className="p-6 text-muted">Cargando…</div>
  if (!torneo) return <div className="p-6 text-[#BA1A1A]">Torneo no encontrado</div>

  // categorias puede ser CategoriaConfig[] (borrador) o CategoriaFixture[] (fixture generado)
  // Solo renderizamos FixtureView si tiene la estructura completa (con grupos)
  const rawCategorias = (torneo.categorias as unknown as (CategoriaFixture | CategoriaConfig)[]) ?? []
  const categorias = rawCategorias.filter(
    (c): c is CategoriaFixture =>
      Array.isArray((c as CategoriaFixture).grupos) || Array.isArray((c as CategoriaFixture).partidos)
  )
  const categoriasConfig = rawCategorias.filter(
    (c): c is CategoriaConfig =>
      !Array.isArray((c as CategoriaFixture).grupos) && !Array.isArray((c as CategoriaFixture).partidos)
  ) as CategoriaConfig[]

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
          <p className="text-muted text-sm">{torneo.fecha_inicio}</p>
        </div>
        <Badge>{ESTADO_LABELS[torneo.estado]}</Badge>
      </div>

      {isAdmin && (torneo.estado === 'borrador' || torneo.estado === 'inscripcion') && (
        <div className="flex gap-2 mt-2 flex-wrap">
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
            <p className="text-xs text-defeat w-full">
              {abrirInscripciones.error instanceof Error ? abrirInscripciones.error.message : 'Error al abrir inscripciones'}
            </p>
          )}
          {generarFixture.error && (
            <p className="text-xs text-defeat w-full">
              {generarFixture.error instanceof Error ? generarFixture.error.message : 'Error al generar fixture'}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white shadow-card space-y-4 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-4">Fixture</p>
          {categorias.length === 0 ? (
            <p className="text-muted">El fixture se generará cuando el torneo pase a inscripción.</p>
          ) : (
            <div className="space-y-8">
              {categorias.map(cat => (
                <FixtureView
                  key={cat.nombre}
                  categoria={cat}
                  torneoId={torneo.id}
                  isAdmin={isAdmin}
                  onCargarResultado={setPartidoModal}
                  colegioRival={torneo.colegio_rival ?? undefined}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-4">Inscripciones</p>
          {isAdmin
            ? <RosterAdmin torneoId={torneo.id} categorias={categoriasConfig} />
            : <InscripcionesPanel torneoId={torneo.id} estado={torneo.estado} categorias={categoriasConfig} />
          }
        </div>
      </div>

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
