import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { padelApi } from '../../lib/padelApi'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

interface Props {
  torneoId: string
  torneoNombre: string
  torneoEstado: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function impactMessage(estado: string): string {
  if (estado === 'borrador') return 'Se eliminará el torneo y su configuración.'
  if (estado === 'inscripcion') return 'Se eliminará el torneo y todas las inscripciones asociadas.'
  return 'Se eliminará el torneo, inscripciones, partidos y resultados registrados.'
}

export default function DeleteTorneoDialog({ torneoId, torneoNombre, torneoEstado, open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [confirmed, setConfirmed] = useState(false)

  const deleteTorneo = useMutation({
    mutationFn: () => padelApi.delete('torneos', `id=eq.${torneoId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneos'] })
      navigate('/torneos')
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setConfirmed(false)
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-manrope text-navy">Eliminar torneo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="font-inter text-sm text-navy">
            Estás por eliminar{' '}
            <span className="text-defeat font-bold">{torneoNombre}</span>.
          </p>
          <p className="font-inter text-sm text-muted">{impactMessage(torneoEstado)}</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id="delete-confirm"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="accent-defeat w-4 h-4 cursor-pointer"
            />
            <span className="font-inter text-sm text-navy">Entiendo que esta acción es irreversible</span>
          </label>
          {deleteTorneo.error && (
            <p className="text-xs text-defeat font-inter">
              {deleteTorneo.error instanceof Error ? deleteTorneo.error.message : 'Error al eliminar'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)} className="rounded-lg text-xs">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => deleteTorneo.mutate()}
              disabled={!confirmed || deleteTorneo.isPending}
              className="bg-defeat text-white rounded-lg text-xs font-semibold hover:bg-defeat/90"
            >
              {deleteTorneo.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
