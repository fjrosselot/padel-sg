import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import LigaWizard from './LigaWizard'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { useUser } from '../../hooks/useUser'
import type { Database } from '../../lib/types/database.types'

type Liga = Database['padel']['Tables']['ligas']['Row']

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador', activa: 'Activa', finalizada: 'Finalizada',
}
const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  borrador: 'outline', activa: 'default', finalizada: 'outline',
}
const FORMATO_LABELS: Record<string, string> = {
  round_robin: 'Round Robin', escalerilla: 'Escalerilla',
}

export default function LigasList() {
  const navigate = useNavigate()
  const [showWizard, setShowWizard] = useState(false)
  const { data: user } = useUser()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const { data: ligas, isLoading } = useQuery({
    queryKey: ['ligas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('ligas')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Liga[]
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-manrope text-navy">Ligas</h1>
        {isAdmin && (
          <Button onClick={() => setShowWizard(true)} className="bg-gold text-navy font-bold hover:bg-gold/90">
            + Nueva liga
          </Button>
        )}
      </div>

      {isLoading && <div className="text-center text-muted py-12">Cargando ligas…</div>}
      {!isLoading && (!ligas || ligas.length === 0) && (
        <div className="text-center text-muted py-12">No hay ligas creadas aún.</div>
      )}

      <div className="grid gap-4">
        {ligas?.map(l => (
          <Card
            key={l.id}
            className="bg-white rounded-xl shadow-[0_4px_12px_rgba(13,27,42,0.06)] hover:shadow-[0_12px_32px_rgba(13,27,42,0.10)] transition-shadow cursor-pointer"
            onClick={() => navigate(`/ligas/${l.id}`)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-manrope font-semibold text-navy">{l.nombre}</p>
                <p className="text-sm text-muted">
                  {FORMATO_LABELS[l.formato]} · {l.fecha_inicio ?? 'Sin fecha'}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                l.estado === 'activa' ? 'bg-navy text-white' :
                l.estado === 'borrador' ? 'border border-slate/30 text-slate' :
                'bg-surface-high text-slate'
              }`}>{ESTADO_LABELS[l.estado]}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowWizard(false)}>
          <div className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(13,27,42,0.14)] w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold font-manrope text-navy mb-4">Nueva liga</h2>
            <LigaWizard
              onClose={() => setShowWizard(false)}
              onCreated={() => setShowWizard(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
