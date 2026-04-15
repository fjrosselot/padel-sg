import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Handshake, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import NuevaPartidaModal from './NuevaPartidaModal'
import type { Database } from '../../lib/types/database.types'

type PartidaRow = Database['padel']['Tables']['partidas_abiertas']['Row']
type PartidaAbierta = PartidaRow & {
  creador: { nombre: string; apodo: string | null } | null
}

const ROL_LABEL: Record<string, string> = {
  busco_companero: 'Busca compañero',
  busco_rivales: 'Busca rivales',
  abierto: 'Abierto',
}

export default function AmistososPage() {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: partidas, isLoading } = useQuery({
    queryKey: ['partidas-abiertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('partidas_abiertas')
        .select('*, creador:jugadores!creador_id(nombre, apodo)')
        .eq('estado', 'abierta')
        .order('fecha', { ascending: true })
      if (error) throw error
      return data as PartidaAbierta[]
    },
  })

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No autenticado')
      const { error } = await supabase
        .schema('padel')
        .from('partidas_abiertas')
        .update({ estado: 'cancelada' })
        .eq('id', id)
        .eq('creador_id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partidas-abiertas'] }),
  })

  const formatFecha = (str: string) =>
    new Date(str).toLocaleString('es-CL', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Santiago',
    })

  if (isLoading) return <div className="p-6 text-muted">Cargando…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Handshake className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Amistosos</h1>
        <Button
          onClick={() => setShowModal(true)}
          className="ml-auto bg-gold text-navy font-bold rounded-lg h-8 px-3 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nueva partida
        </Button>
      </div>

      {partidas?.length === 0 && (
        <div className="rounded-xl bg-white shadow-card p-8 text-center space-y-2">
          <p className="font-inter text-sm text-muted">No hay partidas abiertas.</p>
          <p className="font-inter text-xs text-slate">Publica una para que otros se sumen.</p>
        </div>
      )}

      <div className="space-y-3">
        {partidas?.map(p => {
          const esMio = p.creador_id === user?.id
          const nombreCreador = p.creador?.apodo ?? p.creador?.nombre?.split(' ')[0] ?? '—'

          return (
            <div key={p.id} className="rounded-xl bg-white shadow-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-manrope text-sm font-bold text-navy">{formatFecha(p.fecha)}</p>
                  <p className="font-inter text-xs text-muted mt-0.5">
                    {nombreCreador}
                    {p.cancha && ` · Cancha ${p.cancha}`}
                    {p.categoria && ` · Cat. ${p.categoria}`}
                  </p>
                </div>
                <Badge className="shrink-0 text-xs">{ROL_LABEL[p.rol_buscado]}</Badge>
              </div>

              {p.admite_mixto && (
                <p className="font-inter text-xs text-muted">✓ Admite mixto</p>
              )}

              {esMio && (
                <Button
                  variant="outline"
                  onClick={() => cancelar.mutate(p.id)}
                  disabled={cancelar.isPending}
                  className="w-full border border-defeat/40 text-defeat text-xs h-8 hover:bg-defeat/10 rounded-lg"
                >
                  Cancelar partida
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {showModal && <NuevaPartidaModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
