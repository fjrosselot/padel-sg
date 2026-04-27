import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Eye, EyeOff, ExternalLink, Check, X, Pencil } from 'lucide-react'
import { adminHeaders } from '@/lib/adminHeaders'

const SB = import.meta.env.VITE_SUPABASE_URL as string

interface Novedad {
  id: string
  titulo: string
  contenido: string | null
  url: string | null
  published_at: string
  activo: boolean
}

const empty = { titulo: '', contenido: '', url: '' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' })
}

export default function AdminNovedades() {
  const qc = useQueryClient()
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Novedad | null>(null)

  const { data: novedades = [], isLoading } = useQuery<Novedad[]>({
    queryKey: ['novedades-admin'],
    queryFn: async () => {
      const h = await adminHeaders('read')
      const r = await fetch(`${SB}/rest/v1/novedades?order=published_at.desc`, { headers: h })
      return r.json()
    },
  })

  const crear = useMutation({
    mutationFn: async () => {
      const h = await adminHeaders('write')
      const body: Record<string, unknown> = { titulo: form.titulo.trim() }
      if (form.contenido.trim()) body.contenido = form.contenido.trim()
      if (form.url.trim()) body.url = form.url.trim()
      await fetch(`${SB}/rest/v1/novedades`, { method: 'POST', headers: h, body: JSON.stringify(body) })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['novedades-admin'] })
      qc.invalidateQueries({ queryKey: ['novedades'] })
      setForm(empty)
      setShowForm(false)
    },
  })

  const editar = useMutation({
    mutationFn: async (n: Novedad) => {
      const h = await adminHeaders('write')
      await fetch(`${SB}/rest/v1/novedades?id=eq.${n.id}`, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ titulo: n.titulo, contenido: n.contenido || null, url: n.url || null }),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['novedades-admin'] })
      qc.invalidateQueries({ queryKey: ['novedades'] })
      setEditing(null)
    },
  })

  const toggleActivo = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const h = await adminHeaders('write')
      await fetch(`${SB}/rest/v1/novedades?id=eq.${id}`, {
        method: 'PATCH', headers: h, body: JSON.stringify({ activo }),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['novedades-admin'] })
      qc.invalidateQueries({ queryKey: ['novedades'] })
    },
  })

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const h = await adminHeaders('write')
      await fetch(`${SB}/rest/v1/novedades?id=eq.${id}`, { method: 'DELETE', headers: h })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['novedades-admin'] })
      qc.invalidateQueries({ queryKey: ['novedades'] })
    },
  })

  const inputCls = 'w-full rounded-lg border border-navy/20 bg-white px-3 py-2 font-inter text-sm text-navy placeholder:text-muted/50 focus:border-gold focus:outline-none'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-manrope text-2xl font-bold text-navy">Novedades</h1>
        <button
          onClick={() => { setShowForm(v => !v); setEditing(null) }}
          className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 font-inter text-sm font-bold text-navy hover:bg-gold/90"
        >
          <Plus className="h-4 w-4" /> Nueva
        </button>
      </div>

      {/* Formulario nueva novedad */}
      {showForm && (
        <div className="rounded-xl bg-white shadow-card p-5 space-y-3">
          <p className="font-manrope text-sm font-bold text-navy">Nueva novedad</p>
          <input
            className={inputCls}
            placeholder="Título *"
            value={form.titulo}
            onChange={e => setForm(v => ({ ...v, titulo: e.target.value }))}
          />
          <textarea
            className={inputCls}
            rows={3}
            placeholder="Contenido (opcional)"
            value={form.contenido}
            onChange={e => setForm(v => ({ ...v, contenido: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="URL (opcional)"
            type="url"
            value={form.url}
            onChange={e => setForm(v => ({ ...v, url: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              onClick={() => crear.mutate()}
              disabled={!form.titulo.trim() || crear.isPending}
              className="rounded-lg bg-gold px-4 py-2 font-inter text-sm font-bold text-navy disabled:opacity-50"
            >
              {crear.isPending ? 'Publicando…' : 'Publicar'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(empty) }} className="rounded-lg border border-navy/20 px-4 py-2 font-inter text-sm text-muted hover:bg-surface">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : novedades.length === 0 ? (
        <div className="rounded-xl bg-white shadow-card px-5 py-10 text-center">
          <p className="font-inter text-sm text-muted">Sin novedades. Crea la primera arriba.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-card overflow-hidden">
          <div className="divide-y divide-navy/5">
            {novedades.map(n => (
              <div key={n.id} className={`px-5 py-4 ${!n.activo ? 'opacity-50' : ''}`}>
                {editing?.id === n.id ? (
                  <div className="space-y-2">
                    <input
                      className={inputCls}
                      value={editing.titulo}
                      onChange={e => setEditing(v => v && ({ ...v, titulo: e.target.value }))}
                      placeholder="Título *"
                    />
                    <textarea
                      className={inputCls}
                      rows={2}
                      value={editing.contenido ?? ''}
                      onChange={e => setEditing(v => v && ({ ...v, contenido: e.target.value }))}
                      placeholder="Contenido"
                    />
                    <input
                      className={inputCls}
                      type="url"
                      value={editing.url ?? ''}
                      onChange={e => setEditing(v => v && ({ ...v, url: e.target.value }))}
                      placeholder="URL"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => editar.mutate(editing)}
                        disabled={!editing.titulo.trim() || editar.isPending}
                        className="flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 font-inter text-xs font-bold text-navy disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Guardar
                      </button>
                      <button onClick={() => setEditing(null)} className="rounded-lg border border-navy/20 px-3 py-1.5 font-inter text-xs text-muted">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-inter text-sm font-semibold text-navy leading-snug">{n.titulo}</p>
                        {n.url && <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-navy shrink-0"><ExternalLink className="h-3.5 w-3.5" /></a>}
                      </div>
                      {n.contenido && <p className="font-inter text-xs text-muted mt-0.5 leading-snug">{n.contenido}</p>}
                      <p className="font-inter text-[10px] text-muted/60 mt-1">{fmtDate(n.published_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActivo.mutate({ id: n.id, activo: !n.activo })}
                        title={n.activo ? 'Ocultar' : 'Publicar'}
                        className="rounded p-1.5 text-muted hover:text-navy hover:bg-surface"
                      >
                        {n.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => { setEditing(n); setShowForm(false) }}
                        className="rounded p-1.5 text-muted hover:text-navy hover:bg-surface"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`¿Eliminar "${n.titulo}"?`)) eliminar.mutate(n.id) }}
                        className="rounded p-1.5 text-muted hover:text-defeat hover:bg-defeat/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
