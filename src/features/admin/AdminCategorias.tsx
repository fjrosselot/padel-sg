import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useCategorias, type CategoriaRow } from '../categorias/useCategorias'

type Sexo = 'M' | 'F' | 'mixto'

const PALETTE: Array<{ nombre: string; fondo: string; borde: string; texto: string }> = [
  { nombre: 'Índigo',    fondo: '#e0e7ff', borde: '#a5b4fc', texto: '#3730a3' },
  { nombre: 'Cielo',     fondo: '#e0f2fe', borde: '#7dd3fc', texto: '#0369a1' },
  { nombre: 'Esmeralda', fondo: '#d1fae5', borde: '#6ee7b7', texto: '#065f46' },
  { nombre: 'Verde',     fondo: '#f0fdf4', borde: '#86efac', texto: '#15803d' },
  { nombre: 'Rosa',      fondo: '#ffe4e6', borde: '#fda4af', texto: '#be123c' },
  { nombre: 'Ámbar',     fondo: '#fef3c7', borde: '#fcd34d', texto: '#92400e' },
  { nombre: 'Violeta',   fondo: '#f3e8ff', borde: '#d8b4fe', texto: '#7e22ce' },
  { nombre: 'Turquesa',  fondo: '#ccfbf1', borde: '#5eead4', texto: '#0f766e' },
  { nombre: 'Naranja',   fondo: '#ffedd5', borde: '#fdba74', texto: '#c2410c' },
  { nombre: 'Lima',      fondo: '#ecfccb', borde: '#bef264', texto: '#4d7c0f' },
  { nombre: 'Fucsia',    fondo: '#fce7f3', borde: '#f9a8d4', texto: '#be185d' },
  { nombre: 'Cyan',      fondo: '#cffafe', borde: '#67e8f9', texto: '#0e7490' },
  { nombre: 'Lavanda',   fondo: '#ede9fe', borde: '#c4b5fd', texto: '#6d28d9' },
  { nombre: 'Amarillo',  fondo: '#fefce8', borde: '#fef08a', texto: '#854d0e' },
  { nombre: 'Rojo',      fondo: '#fee2e2', borde: '#fca5a5', texto: '#b91c1c' },
  { nombre: 'Pizarra',   fondo: '#f1f5f9', borde: '#94a3b8', texto: '#334155' },
]

const SEXO_OPTS: { value: Sexo; label: string }[] = [
  { value: 'M', label: 'Hombres' },
  { value: 'F', label: 'Mujeres' },
  { value: 'mixto', label: 'Mixto' },
]

const SEXO_STYLE: Record<Sexo, string> = {
  M:     'bg-blue-50 text-blue-700 border-blue-200',
  F:     'bg-pink-50 text-pink-700 border-pink-200',
  mixto: 'bg-purple-50 text-purple-700 border-purple-200',
}

interface ModalProps {
  categoria: CategoriaRow | null
  onClose: () => void
}

function CategoriaModal({ categoria, onClose }: ModalProps) {
  const qc = useQueryClient()
  const isNew = !categoria

  const [codigo, setCodigo] = useState(categoria?.id ?? '')
  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [sexo, setSexo] = useState<Sexo>(categoria?.sexo ?? 'mixto')
  const [colorIdx, setColorIdx] = useState<number>(() => {
    if (!categoria) return 0
    return PALETTE.findIndex(p => p.fondo === categoria.color_fondo) ?? 0
  })
  const [error, setError] = useState<string | null>(null)

  const pal = PALETTE[colorIdx] ?? PALETTE[0]

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: nombre.trim() || codigo.trim(),
        sexo,
        color_fondo: pal.fondo,
        color_borde: pal.borde,
        color_texto: pal.texto,
      }
      if (isNew) {
        const id = codigo.trim()
        if (!id) throw new Error('El código es obligatorio')
        const { error: err } = await supabase.schema('padel')
          .from('categorias').insert({ id, ...payload, orden: 99 })
        if (err) throw err
      } else {
        const { error: err } = await supabase.schema('padel')
          .from('categorias').update(payload).eq('id', categoria.id)
        if (err) throw err
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] })
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(13,27,42,0.14)] w-full max-w-sm mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-manrope text-lg font-bold text-navy">
            {isNew ? 'Nueva categoría' : `Editar ${categoria.id}`}
          </h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-navy">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Código (solo en nuevo) */}
          {isNew && (
            <div>
              <Label htmlFor="cat-codigo">Código</Label>
              <Input
                id="cat-codigo"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="ej: 3a, Open, B"
                className="mt-1"
              />
              <p className="mt-1 font-inter text-[10px] text-muted">Identificador único, no se puede cambiar después</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <Label htmlFor="cat-nombre">Nombre</Label>
            <Input
              id="cat-nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder={codigo || 'Nombre para mostrar'}
              className="mt-1"
            />
          </div>

          {/* Sexo */}
          <div>
            <Label>Género</Label>
            <div className="flex gap-2 mt-1.5">
              {SEXO_OPTS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSexo(opt.value)}
                  className={`flex-1 py-1.5 rounded-lg font-inter text-xs font-semibold border transition-colors focus:outline-none ${
                    sexo === opt.value
                      ? SEXO_STYLE[opt.value]
                      : 'bg-white text-muted border-navy/20 hover:border-navy/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color palette */}
          <div>
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {PALETTE.map((p, i) => (
                <button
                  key={p.nombre}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  title={p.nombre}
                  className={`relative rounded-lg p-1.5 border-2 transition-all focus:outline-none ${
                    colorIdx === i ? 'border-navy shadow-sm' : 'border-transparent hover:border-navy/20'
                  }`}
                  style={{ background: p.fondo }}
                >
                  <span
                    className="block font-inter text-[10px] font-bold text-center"
                    style={{ color: p.texto }}
                  >
                    {codigo || 'Aa'}
                  </span>
                  {colorIdx === i && (
                    <Check
                      className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-navy text-white p-0.5"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label>Preview</Label>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-navy/10 p-3">
              <span
                className="inline-block font-inter text-xs font-semibold px-2 py-0.5 rounded border"
                style={{ background: pal.fondo, borderColor: pal.borde, color: pal.texto }}
              >
                {nombre || codigo || 'Cat'}
              </span>
              <span className="font-inter text-xs text-muted">→ así se verá en la app</span>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-3 py-2 font-inter text-sm text-defeat">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate/30 text-slate bg-transparent rounded-lg">
            Cancelar
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex-1 bg-gold text-navy font-bold rounded-lg"
          >
            {save.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCategorias() {
  const qc = useQueryClient()
  const { data: categorias, isLoading } = useCategorias()
  const [editing, setEditing] = useState<CategoriaRow | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.schema('padel').from('categorias').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] })
      setConfirmDelete(null)
    },
  })

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-manrope text-2xl font-bold text-navy">Categorías</h1>
        <Button
          onClick={() => setEditing('new')}
          className="bg-gold text-navy font-bold rounded-lg h-8 px-3 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nueva
        </Button>
      </div>

      <div className="rounded-xl bg-white shadow-card overflow-hidden divide-y divide-navy/5">
        {(!categorias || categorias.length === 0) && (
          <p className="px-4 py-6 text-center font-inter text-sm text-muted">No hay categorías.</p>
        )}
        {categorias?.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
            {/* Badge preview */}
            <span
              className="font-inter text-xs font-semibold px-2 py-0.5 rounded border shrink-0"
              style={{ background: cat.color_fondo, borderColor: cat.color_borde, color: cat.color_texto }}
            >
              {cat.nombre}
            </span>

            {/* Sexo */}
            <span className={`font-inter text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${SEXO_STYLE[cat.sexo]}`}>
              {cat.sexo === 'M' ? 'H' : cat.sexo === 'F' ? 'M' : 'Mix'}
            </span>

            <span className="flex-1" />

            {/* Actions */}
            {confirmDelete === cat.id ? (
              <div className="flex items-center gap-2">
                <span className="font-inter text-xs text-defeat">¿Eliminar?</span>
                <button
                  type="button"
                  onClick={() => deleteMut.mutate(cat.id)}
                  className="font-inter text-xs font-semibold text-defeat hover:underline"
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="font-inter text-xs text-muted hover:underline"
                >
                  No
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(cat)}
                  className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-surface transition-colors"
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(cat.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-defeat hover:bg-defeat/10 transition-colors"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {editing !== null && (
        <CategoriaModal
          categoria={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
