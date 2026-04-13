import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import FixtureView from './FixtureView'
import InscripcionesPanel from './InscripcionesPanel'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaFixture } from '../../lib/fixture/types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  inscripcion: 'Inscripciones',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
}

export default function TorneoDetalle() {
  const { id } = useParams<{ id: string }>()

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
  if (!torneo) return <div className="p-6 text-red-500">Torneo no encontrado</div>

  const categorias = (torneo.categorias as unknown as CategoriaFixture[]) ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-manrope text-navy">{torneo.nombre}</h1>
          <p className="text-muted text-sm">{torneo.fecha_inicio}</p>
        </div>
        <Badge>{ESTADO_LABELS[torneo.estado]}</Badge>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted uppercase mb-4">Fixture</p>
          {categorias.length === 0 ? (
            <p className="text-muted">El fixture se generará cuando el torneo pase a inscripción.</p>
          ) : (
            <div className="space-y-8">
              {categorias.map(cat => <FixtureView key={cat.nombre} categoria={cat} />)}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-muted uppercase mb-4">Inscripciones</p>
          <InscripcionesPanel torneoId={torneo.id} estado={torneo.estado} />
        </div>
      </div>
    </div>
  )
}
