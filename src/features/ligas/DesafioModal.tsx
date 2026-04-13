import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'

interface Jugador { id: string; nombre: string; posicion: number }

interface Props {
  ligaId: string
  desafiante: Jugador
  desafiado: Jugador
  onClose: () => void
}

export default function DesafioModal({ ligaId, desafiante, desafiado, onClose }: Props) {
  const qc = useQueryClient()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .schema('padel')
        .from('liga_desafios')
        .insert({
          liga_id: ligaId,
          desafiante_id: desafiante.id,
          desafiado_id: desafiado.id,
          estado: 'pendiente',
          expires_at: expiresAt,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liga', ligaId] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold font-manrope text-navy">Enviar desafío</h2>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-sm">
            <span className="text-gray-500">Desafiante:</span>{' '}
            <span className="font-medium text-navy">#{desafiante.posicion} {desafiante.nombre}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500">Desafiado:</span>{' '}
            <span className="font-medium text-navy">#{desafiado.posicion} {desafiado.nombre}</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">Tienen 7 días para jugar. Si no juegan, el desafío caduca sin penalización.</p>
        </div>

        {mutation.error instanceof Error && (
          <p className="text-red-500 text-sm">{mutation.error.message}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            className="flex-1 bg-navy text-white"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Enviando…' : 'Confirmar desafío'}
          </Button>
        </div>
      </div>
    </div>
  )
}
