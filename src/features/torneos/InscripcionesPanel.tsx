import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { useUser } from '../../hooks/useUser'

interface InscripcionRow {
  id: string
  jugador1_id: string
  jugador2_id: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  created_at: string
  jugador1: { nombre: string } | null
  jugador2: { nombre: string } | null
}

interface Props {
  torneoId: string
  estado: string
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'outline',
  confirmada: 'default',
  rechazada: 'destructive',
}

export default function InscripcionesPanel({ torneoId, estado }: Props) {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const { data: inscripciones, isLoading } = useQuery({
    queryKey: ['inscripciones', torneoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .select('id, jugador1_id, jugador2_id, estado, created_at, jugador1:jugadores!jugador1_id(nombre), jugador2:jugadores!jugador2_id(nombre)')
        .eq('torneo_id', torneoId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as InscripcionRow[]
    },
  })

  const updateEstado = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string; nuevoEstado: string }) => {
      const { error } = await supabase
        .schema('padel')
        .from('inscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inscripciones', torneoId] }),
  })

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-navy">Inscripciones</h2>

      {isLoading && <p className="text-muted text-sm">Cargando…</p>}

      {!isLoading && (!inscripciones || inscripciones.length === 0) && (
        <p className="text-muted text-sm">No hay inscripciones aún.</p>
      )}

      <div className="space-y-2">
        {inscripciones?.map(ins => (
          <div key={ins.id} className="flex items-center justify-between p-3 rounded-xl bg-surface">
            <div>
              <p className="font-medium text-sm">
                {ins.jugador1?.nombre ?? ins.jugador1_id} / {ins.jugador2?.nombre ?? ins.jugador2_id}
              </p>
              <p className="text-xs text-muted">
                {new Date(ins.created_at).toLocaleDateString('es-CL')}
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
                    onClick={() => updateEstado.mutate({ id: ins.id, nuevoEstado: 'confirmada' })}
                    disabled={updateEstado.isPending}
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-[#FEE8E8] text-[#BA1A1A] border-transparent hover:bg-[#FED7D7]"
                    onClick={() => updateEstado.mutate({ id: ins.id, nuevoEstado: 'rechazada' })}
                    disabled={updateEstado.isPending}
                  >
                    Rechazar
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
