import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/types/database.types'

type Temporada = Database['padel']['Tables']['temporadas']['Row']

export default function AdminTemporadas() {
  const qc = useQueryClient()

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
    onError: () => alert('No se pudo actualizar la temporada'),
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
    </div>
  )
}
