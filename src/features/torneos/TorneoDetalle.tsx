import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Badge } from '../../components/ui/badge'
import FixtureView from './FixtureView'
import InscripcionesPanel from './InscripcionesPanel'
import ResultadosModal from './ResultadosModal'
import RosterAdmin from './RosterAdmin'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaConfig, CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

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
