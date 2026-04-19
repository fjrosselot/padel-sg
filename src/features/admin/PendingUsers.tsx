import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase, type Jugador } from '@/lib/supabase'
import { adminHeaders } from '@/lib/adminHeaders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'

export function PendingUsers() {
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: pending = [], isLoading } = useQuery<Jugador[]>({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('*')
        .eq('estado_cuenta', 'pendiente')
      return data ?? []
    },
  })

  const approve = useMutation({
    mutationFn: async (jugadorId: string) => {
      await supabase
        .schema('padel')
        .from('jugadores')
        .update({ estado_cuenta: 'activo' })
        .eq('id', jugadorId)
      await supabase.functions.invoke('approve-user', { body: { jugadorId } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-users'] }),
  })

  const reject = useMutation({
    mutationFn: async (jugadorId: string) => {
      await supabase
        .schema('padel')
        .from('jugadores')
        .update({ estado_cuenta: 'suspendido' })
        .eq('id', jugadorId)
      await supabase.functions.invoke('reject-user', { body: { jugadorId } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-users'] }),
  })

  const deleteUser = useMutation({
    mutationFn: async (jugadorId: string) => {
      const headers = await adminHeaders()
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/jugadores?id=eq.${jugadorId}`
      const res = await fetch(url, { method: 'DELETE', headers: { ...headers, 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error(await res.text())
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-users'] })
      toast.success('Usuario eliminado')
      setConfirmDelete(null)
    },
    onError: () => toast.error('No se pudo eliminar el usuario'),
  })

  if (isLoading) return <div className="p-6 font-inter text-muted">Cargando...</div>

  return (
    <div className="p-6">
      <h1 className="mb-6 font-manrope text-xl font-bold text-navy">
        Solicitudes pendientes
        {pending.length > 0 && (
          <Badge className="ml-2 bg-gold text-navy">{pending.length}</Badge>
        )}
      </h1>

      {pending.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center font-inter text-slate shadow-card">
          No hay solicitudes pendientes
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((jugador) => (
            <div key={jugador.id} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-manrope text-sm font-bold text-gold">
                {jugador.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-inter text-sm font-semibold text-navy">{jugador.nombre}</p>
                <p className="truncate font-inter text-xs text-muted">{jugador.email}</p>
                <div className="mt-1 flex gap-2">
                  {jugador.categoria && (
                    <Badge variant="secondary" className="font-inter text-xs">
                      {jugador.categoria}{jugador.gradualidad !== 'normal' ? jugador.gradualidad : ''}
                    </Badge>
                  )}
                  {jugador.sexo && (
                    <Badge variant="outline" className="font-inter text-xs">
                      {jugador.sexo === 'M' ? 'Masculino' : 'Femenino'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => approve.mutate(jugador.id)}
                  disabled={approve.isPending}
                  className="bg-navy text-gold hover:bg-navy-mid"
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => reject.mutate(jugador.id)}
                  disabled={reject.isPending}
                >
                  Rechazar
                </Button>
                {confirmDelete === jugador.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteUser.mutate(jugador.id)}
                      disabled={deleteUser.isPending}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(null)}
                    >
                      No
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(jugador.id)}
                    className="text-muted hover:text-defeat"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
