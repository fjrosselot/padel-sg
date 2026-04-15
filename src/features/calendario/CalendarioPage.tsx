import { useQuery } from '@tanstack/react-query'
import { Calendar, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/types/database.types'

type TorneoRow = Database['padel']['Tables']['torneos']['Row']
type LigaRow = Database['padel']['Tables']['ligas']['Row']
type TorneoItem = Pick<TorneoRow, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin' | 'estado'>
type LigaItem = Pick<LigaRow, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin' | 'estado'>

const ESTADO_COLOR: Record<string, string> = {
  inscripcion: 'bg-gold/10 text-gold',
  en_curso: 'bg-success/10 text-success',
  finalizado: 'bg-surface-high text-muted',
}

export default function CalendarioPage() {
  const { data: torneos } = useQuery({
    queryKey: ['calendario-torneos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('torneos')
        .select('id, nombre, fecha_inicio, fecha_fin, estado')
        .neq('estado', 'borrador')
        .order('fecha_inicio', { ascending: true })
      if (error) throw error
      return data as TorneoItem[]
    },
  })

  const { data: ligas } = useQuery({
    queryKey: ['calendario-ligas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('ligas')
        .select('id, nombre, fecha_inicio, fecha_fin, estado')
        .neq('estado', 'borrador')
        .order('fecha_inicio', { ascending: true })
      if (error) throw error
      return data as LigaItem[]
    },
  })

  const icsUrl = `${window.location.origin}/api/calendar`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-gold" />
          <h1 className="font-manrope text-2xl font-bold text-navy">Calendario</h1>
        </div>
        <a
          href={icsUrl}
          download="padel-sg.ics"
          className="flex items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-1.5 font-inter text-xs font-semibold text-navy hover:bg-surface transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar ICS
        </a>
      </div>

      <div className="space-y-3">
        <h2 className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">Torneos</h2>
        {torneos?.length === 0 && (
          <p className="font-inter text-sm text-muted">Sin torneos próximos.</p>
        )}
        {torneos?.map(t => (
          <div key={t.id} className="rounded-xl bg-white shadow-card p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-manrope text-sm font-bold text-navy">{t.nombre}</p>
              <p className="font-inter text-xs text-muted mt-0.5">
                {t.fecha_inicio ?? 'Fecha por definir'}
                {t.fecha_fin && t.fecha_fin !== t.fecha_inicio && ` → ${t.fecha_fin}`}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-inter text-xs font-semibold capitalize ${
              ESTADO_COLOR[t.estado] ?? 'bg-surface text-muted'
            }`}>
              {t.estado.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">Ligas</h2>
        {ligas?.length === 0 && (
          <p className="font-inter text-sm text-muted">Sin ligas activas.</p>
        )}
        {ligas?.map(l => (
          <div key={l.id} className="rounded-xl bg-white shadow-card p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-manrope text-sm font-bold text-navy">{l.nombre}</p>
              <p className="font-inter text-xs text-muted mt-0.5">
                {l.fecha_inicio ?? 'Fecha por definir'}
                {l.fecha_fin && ` → ${l.fecha_fin}`}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-inter text-xs font-semibold capitalize ${
              ESTADO_COLOR[l.estado] ?? 'bg-surface text-muted'
            }`}>
              {l.estado}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-slate/30 p-4 text-center space-y-1">
        <p className="font-inter text-xs text-muted">Agrega el calendario a tu app favorita</p>
        <code className="font-mono text-xs text-navy break-all">{icsUrl}</code>
      </div>
    </div>
  )
}
