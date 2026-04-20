import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import FixtureView from './FixtureView'
import InscripcionesPanel from './InscripcionesPanel'
import ResultadosModal from './ResultadosModal'
import RosterAdmin from './RosterAdmin'
import { buildFixture } from '../../lib/fixture/engine'
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
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('torneos')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Torneo
    },
    enabled: !!id,
  })

  const abrirInscripciones = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .schema('padel')
        .from('torneos')
        .update({ estado: 'inscripcion' })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', id] }),
  })

  const generarFixture = useMutation({
    mutationFn: async () => {
      const { data: inscritas, error: inscErr } = await supabase
        .schema('padel')
        .from('inscripciones')
        .select(`
          id, jugador1_id, jugador2_id, categoria_nombre,
          j1:jugadores!jugador1_id(id, nombre, elo),
          j2:jugadores!jugador2_id(id, nombre, elo)
        `)
        .eq('torneo_id', id!)
        .eq('estado', 'confirmada')
        .eq('lista_espera', false)
      if (inscErr) throw inscErr

      const configFixture = torneo!.config_fixture as unknown as ConfigFixture

      const categoriasFixture = categoriasConfig.map(cat => {
        const parejas: ParejaFixture[] = ((inscritas ?? []) as any[])
          .filter((i: any) => i.categoria_nombre === cat.nombre)
          .map((i: any) => ({
            id: i.id,
            nombre: `${i.j1?.nombre ?? '?'} / ${i.j2?.nombre ?? '?'}`,
            jugador1_id: i.jugador1_id,
            jugador2_id: i.jugador2_id,
            elo1: i.j1?.elo ?? 1200,
            elo2: i.j2?.elo ?? 1200,
          }))
        return buildFixture(cat, parejas, configFixture)
      })

      const { error: updErr } = await supabase
        .schema('padel')
        .from('torneos')
        .update({
          categorias: categoriasFixture as unknown as any,
          estado: 'en_curso',
        })
        .eq('id', id!)
      if (updErr) throw updErr
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
  const rawCategorias = (torneo.categorias as unknown as CategoriaFixture[]) ?? []
  const categorias = rawCategorias.filter(c => Array.isArray((c as CategoriaFixture).grupos))
  const categoriasConfig = (rawCategorias.filter(
    (c: unknown) => !Array.isArray((c as CategoriaFixture).grupos)
  ) as unknown) as CategoriaConfig[]

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
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-4">Inscripciones</p>
          <InscripcionesPanel torneoId={torneo.id} estado={torneo.estado} categorias={categoriasConfig} />
        </div>

        {isAdmin && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-4">Gestión de Roster</p>
            <RosterAdmin torneoId={torneo.id} categorias={categoriasConfig} />
          </div>
        )}
      </div>

      {partidoModal && (
        <ResultadosModal
          partido={partidoModal}
          torneoId={torneo.id}
          onClose={() => setPartidoModal(null)}
        />
      )}
    </div>
  )
}
