import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Jugador } from '../../lib/supabase'

const LADO_LABEL: Record<string, string> = {
  drive: 'Drive',
  reves: 'Revés',
  ambos: 'Ambos',
}

const ROL_LABEL: Record<string, string> = {
  jugador: 'Jugador',
  admin_torneo: 'Admin torneo',
  superadmin: 'Superadmin',
}

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: jugador, isLoading, error } = useQuery({
    queryKey: ['jugador', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo, categoria, elo, foto_url, lado_preferido, sexo, rol, email')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Jugador
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="p-6 text-muted">Cargando…</div>
  if (error || !jugador) return (
    <div className="p-6 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted font-inter text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <p className="font-inter text-sm text-muted">Jugador no encontrado.</p>
    </div>
  )

  const initials = jugador.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted font-inter text-sm hover:text-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Jugadores
      </button>

      {/* Header card */}
      <div className="rounded-xl bg-white shadow-card p-6 flex flex-col items-center gap-3 text-center">
        <div className="h-20 w-20 rounded-full bg-navy flex items-center justify-center overflow-hidden">
          {jugador.foto_url
            ? <img src={jugador.foto_url} alt={jugador.nombre} className="h-full w-full object-cover" />
            : <span className="font-manrope text-2xl font-bold text-gold">{initials}</span>
          }
        </div>
        <div>
          <h1 className="font-manrope text-xl font-bold text-navy">{jugador.nombre}</h1>
          {jugador.apodo && (
            <p className="font-inter text-sm text-muted">"{jugador.apodo}"</p>
          )}
        </div>
        <div className="flex items-center gap-2 bg-gold/10 rounded-lg px-4 py-2">
          <Trophy className="h-4 w-4 text-gold" />
          <span className="font-manrope text-lg font-bold text-navy">{jugador.elo}</span>
          <span className="font-inter text-xs text-muted">ELO</span>
        </div>
      </div>

      {/* Detalles */}
      <div className="rounded-xl bg-white shadow-card overflow-hidden">
        {[
          { label: 'Categoría', value: jugador.categoria ?? '—' },
          { label: 'Lado preferido', value: jugador.lado_preferido ? LADO_LABEL[jugador.lado_preferido] : '—' },
          { label: 'Rol', value: jugador.rol ? ROL_LABEL[jugador.rol] ?? jugador.rol : '—' },
        ].map(({ label, value }, idx, arr) => (
          <div
            key={label}
            className={`flex items-center justify-between px-4 py-3 ${idx !== arr.length - 1 ? 'border-b border-surface-high' : ''}`}
          >
            <span className="font-inter text-sm text-muted">{label}</span>
            <span className="font-inter text-sm font-medium text-navy">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
