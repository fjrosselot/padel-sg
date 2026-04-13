import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useUser } from '../../hooks/useUser'
import TorneoWizard from './TorneoWizard'
import type { Database } from '../../lib/types/database.types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

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
      const { data, error } = await supabase
        .schema('padel')
        .from('torneos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Torneo[]
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-manrope text-navy">Torneos</h1>
        {isAdmin && (
          <Button className="bg-navy text-white hover:bg-navy-mid" onClick={() => setShowWizard(true)}>
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
            className="hover:shadow-ambient-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/torneos/${t.id}`)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-navy">{t.nombre}</p>
                <p className="text-sm text-muted">
                  {TIPO_LABELS[t.tipo]} · {t.fecha_inicio ?? 'Sin fecha'}
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
        <DialogContent className="max-w-2xl">
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
