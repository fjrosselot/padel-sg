import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import DesafioModal from './DesafioModal'

interface Participante {
  id: string
  jugador_id: string
  posicion: number | null
  jugador: { nombre: string } | null
}

interface Props {
  ligaId: string
  estado: string
}

export default function LadderView({ ligaId, estado }: Props) {
  const { data: user } = useUser()
  const [desafioTarget, setDesafioTarget] = useState<Participante | null>(null)

  const { data: participantes, isLoading } = useQuery({
    queryKey: ['ladder', ligaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('liga_participantes')
        .select('id, jugador_id, posicion, jugador:jugadores!jugador_id(nombre)')
        .eq('liga_id', ligaId)
        .order('posicion', { ascending: true })
      if (error) throw error
      return data as unknown as Participante[]
    },
  })

  const myId = user?.id
  const myEntry = participantes?.find(p => p.jugador_id === myId)
  const myPos = myEntry?.posicion ?? null

  function canChallenge(target: Participante) {
    if (!myPos || !target.posicion) return false
    if (target.jugador_id === myId) return false
    return target.posicion < myPos && myPos - target.posicion <= 3
  }

  if (isLoading) return <div className="text-gray-400 py-8 text-center">Cargando escalerilla…</div>

  return (
    <div className="space-y-3">
      {participantes?.map(p => (
        <div
          key={p.id}
          className={`flex items-center justify-between p-3 rounded-xl ${
            p.jugador_id === myId ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-manrope text-gray-400 w-8">#{p.posicion}</span>
            <span className="font-semibold text-navy">{p.jugador?.nombre ?? p.jugador_id}</span>
            {p.jugador_id === myId && <span className="text-xs text-blue-500 font-medium">Tú</span>}
          </div>
          {estado === 'activa' && canChallenge(p) && (
            <Button
              size="sm"
              variant="outline"
              className="text-navy border-navy hover:bg-navy hover:text-white"
              onClick={() => setDesafioTarget(p)}
            >
              Desafiar
            </Button>
          )}
        </div>
      ))}

      {desafioTarget && myEntry && (
        <DesafioModal
          ligaId={ligaId}
          desafiante={{
            id: myEntry.jugador_id,
            nombre: myEntry.jugador?.nombre ?? '',
            posicion: myEntry.posicion ?? 0,
          }}
          desafiado={{
            id: desafioTarget.jugador_id,
            nombre: desafioTarget.jugador?.nombre ?? '',
            posicion: desafioTarget.posicion ?? 0,
          }}
          onClose={() => setDesafioTarget(null)}
        />
      )}
    </div>
  )
}
