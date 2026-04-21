import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/types/database.types'

type Temporada = Database['padel']['Tables']['temporadas']['Row']
interface EventoRanking { id: string; nombre: string; tipo: string; fecha: string | null }

export default function AdminTemporadas() {
  const qc = useQueryClient()
  const [editingEvento, setEditingEvento] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')

  const { data: temporadas, isLoading } = useQuery({
    queryKey: ['temporadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('temporadas')
        .select('*')
        .order('anio', { ascending: false })
      if (error) throw error
      return data as Temporada[]
    },
  })

  const { data: eventos = [] } = useQuery<EventoRanking[]>({
    queryKey: ['eventos-ranking'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('padel').from('eventos_ranking')
        .select('id, nombre, tipo, fecha').order('fecha', { ascending: false })
      if (error) throw error
      return data as EventoRanking[]
    },
  })

  const renombrarEvento = useMutation({
    mutationFn: async ({ id, nombre }: { id: string; nombre: string }) => {
      const { error } = await supabase.schema('padel').from('eventos_ranking')
        .update({ nombre }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos-ranking'] })
      qc.invalidateQueries({ queryKey: ['puntos-historial'] })
      setEditingEvento(null)
      toast.success('Nombre actualizado')
    },
    onError: () => toast.error('No se pudo actualizar'),
  })

  const toggleAmistosos = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .schema('padel')
        .from('temporadas')
        .update({ amistosos_afectan_ranking: value })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['temporadas'] }),
    onError: () => toast.error('No se pudo actualizar la temporada'),
  })

  if (isLoading) return <div className="p-6 text-muted">Cargando temporadas…</div>

  return (
    <div className="space-y-4">
      <h1 className="font-manrope text-2xl font-bold text-navy">Temporadas</h1>

      <div className="rounded-xl bg-white shadow-card overflow-hidden">
        {temporadas?.map((t, idx) => (
          <div
            key={t.id}
            className={`flex items-center justify-between px-4 py-3 ${
              idx !== (temporadas.length - 1) ? 'border-b border-surface-high' : ''
            }`}
          >
            <div>
              <p className="font-manrope text-sm font-bold text-navy">{t.nombre}</p>
              <p className="font-inter text-xs text-muted">{t.fecha_inicio} → {t.fecha_fin ?? '…'}</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="font-inter text-xs text-muted">Amistosos afectan ranking</span>
              <button
                type="button"
                role="switch"
                aria-checked={t.amistosos_afectan_ranking}
                onClick={() => toggleAmistosos.mutate({
                  id: t.id,
                  value: !t.amistosos_afectan_ranking,
                })}
                disabled={toggleAmistosos.isPending}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 ${
                  t.amistosos_afectan_ranking ? 'bg-gold' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  t.amistosos_afectan_ranking ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </label>
          </div>
        ))}
      </div>
      {/* Eventos de ranking */}
      <h2 className="font-manrope text-lg font-bold text-navy pt-2">Eventos de ranking</h2>
      <div className="rounded-xl bg-white shadow-card overflow-hidden">
        {eventos.length === 0 && (
          <p className="px-4 py-3 font-inter text-sm text-muted">Sin eventos registrados.</p>
        )}
        {eventos.map((ev, idx) => (
          <div key={ev.id} className={`flex items-center gap-3 px-4 py-3 ${idx !== eventos.length - 1 ? 'border-b border-surface-high' : ''}`}>
            {editingEvento === ev.id ? (
              <>
                <input
                  autoFocus
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  className="flex-1 rounded-lg border border-navy/20 px-3 py-1.5 font-inter text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/50"
                  onKeyDown={e => {
                    if (e.key === 'Enter') renombrarEvento.mutate({ id: ev.id, nombre: editNombre })
                    if (e.key === 'Escape') setEditingEvento(null)
                  }}
                />
                <button type="button" onClick={() => renombrarEvento.mutate({ id: ev.id, nombre: editNombre })}
                  className="text-success hover:opacity-80"><Check className="h-4 w-4" /></button>
                <button type="button" onClick={() => setEditingEvento(null)}
                  className="text-muted hover:text-navy"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="font-inter text-sm font-medium text-navy">{ev.nombre}</p>
                  <p className="font-inter text-[10px] text-muted">{ev.tipo} · {ev.fecha ?? '—'}</p>
                </div>
                <button type="button" onClick={() => { setEditingEvento(ev.id); setEditNombre(ev.nombre) }}
                  className="text-muted hover:text-navy transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
