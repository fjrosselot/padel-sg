import { useState } from 'react'
import { formatFecha } from '../../lib/formatDate'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminHeaders } from '../../lib/adminHeaders'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useUser } from '../../hooks/useUser'
import TorneoWizard from './TorneoWizard'
import type { Database } from '../../lib/types/database.types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  inscripcion: 'Inscripción',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  borrador: 'outline',
  inscripcion: 'secondary',
  en_curso: 'default',
  finalizado: 'outline',
}

const TIPO_LABELS: Record<string, string> = {
  interno: 'Interno',
  vs_colegio: 'vs Colegio',
  externo: 'Externo',
}

export default function TorneosList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: user } = useUser()
  const [showWizard, setShowWizard] = useState(false)

  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const { data: torneos, isLoading } = useQuery({
    queryKey: ['torneos'],
    queryFn: async () => {
      const headers = await adminHeaders('read')
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/torneos?select=*&order=created_at.desc`,
        { headers }
      )
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return res.json() as Promise<Torneo[]>
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-manrope text-navy">Torneos</h1>
        {isAdmin && (
          <Button className="bg-gold text-navy font-bold hover:bg-gold/90 rounded-lg" onClick={() => setShowWizard(true)}>
            + Nuevo torneo
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="text-center text-muted py-12">Cargando torneos…</div>
      )}

      {!isLoading && (!torneos || torneos.length === 0) && (
        <div className="text-center text-muted py-12">
          No hay torneos creados aún.
        </div>
      )}

      <div className="grid gap-4">
        {torneos?.map(t => (
          <Card
            key={t.id}
            role="button"
            tabIndex={0}
            className="bg-white rounded-xl shadow-[0_4px_12px_rgba(13,27,42,0.06)] hover:shadow-[0_12px_32px_rgba(13,27,42,0.10)] transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50"
            onClick={() => navigate(`/torneos/${t.id}`)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/torneos/${t.id}`) }}
            aria-label={`Ver torneo ${t.nombre}`}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-manrope font-semibold text-navy">{t.nombre}</p>
                <p className="text-sm text-muted">
                  {TIPO_LABELS[t.tipo]} · {formatFecha(t.fecha_inicio)}
                  {t.tipo === 'vs_colegio' && t.colegio_rival && ` · vs ${t.colegio_rival}`}
                </p>
              </div>
              <Badge variant={ESTADO_VARIANT[t.estado]}>
                {ESTADO_LABELS[t.estado]}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo torneo</DialogTitle>
          </DialogHeader>
          <TorneoWizard
            onClose={() => setShowWizard(false)}
            onCreated={() => {
              setShowWizard(false)
              qc.invalidateQueries({ queryKey: ['torneos'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
