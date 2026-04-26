import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Check, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useCategorias, type CategoriaRow } from '../categorias/useCategorias'
import { PALETTE } from '../categorias/palette'

type Sexo = 'M' | 'F' | 'mixto'

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
                    <Check className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-navy text-white p-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

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

interface SortableRowProps {
  cat: CategoriaRow
  confirmDelete: string | null
  onEdit: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}

function SortableRow({ cat, confirmDelete, onEdit, onConfirmDelete, onCancelDelete, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white"
    >
      <button
        type="button"
        className="text-muted/40 hover:text-muted cursor-grab active:cursor-grabbing touch-none shrink-0"
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span
        className="font-inter text-xs font-semibold px-2 py-0.5 rounded border shrink-0"
        style={{ background: cat.color_fondo, borderColor: cat.color_borde, color: cat.color_texto }}
      >
        {cat.nombre}
      </span>

      <span className={`font-inter text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${SEXO_STYLE[cat.sexo]}`}>
        {cat.sexo === 'M' ? 'H' : cat.sexo === 'F' ? 'M' : 'Mix'}
      </span>

      <span className="flex-1" />

      {confirmDelete === cat.id ? (
        <div className="flex items-center gap-2">
          <span className="font-inter text-xs text-defeat">¿Eliminar?</span>
          <button type="button" onClick={onDelete} className="font-inter text-xs font-semibold text-defeat hover:underline">Sí</button>
          <button type="button" onClick={onCancelDelete} className="font-inter text-xs text-muted hover:underline">No</button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-surface transition-colors"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="p-1.5 rounded-lg text-muted hover:text-defeat hover:bg-defeat/10 transition-colors"
            aria-label="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  )
}

export default function AdminCategorias() {
  const qc = useQueryClient()
  const { data: categorias, isLoading } = useCategorias()
  const [editing, setEditing] = useState<CategoriaRow | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [localOrder, setLocalOrder] = useState<string[] | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const orderedCats = localOrder
    ? (localOrder.map(id => categorias?.find(c => c.id === id)).filter(Boolean) as CategoriaRow[])
    : (categorias ?? [])

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

  const reorderMut = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id, idx) =>
          supabase.schema('padel').from('categorias').update({ orden: idx + 1 }).eq('id', id)
        )
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const current = orderedCats.map(c => c.id)
    const oldIdx = current.indexOf(String(active.id))
    const newIdx = current.indexOf(String(over.id))
    const reordered = arrayMove(current, oldIdx, newIdx)
    setLocalOrder(reordered)
    reorderMut.mutate(reordered)
  }

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
        {orderedCats.length === 0 && (
          <p className="px-4 py-6 text-center font-inter text-sm text-muted">No hay categorías.</p>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedCats.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {orderedCats.map(cat => (
              <SortableRow
                key={cat.id}
                cat={cat}
                confirmDelete={confirmDelete}
                onEdit={() => setEditing(cat)}
                onConfirmDelete={() => setConfirmDelete(cat.id)}
                onCancelDelete={() => setConfirmDelete(null)}
                onDelete={() => deleteMut.mutate(cat.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {editing !== null && (
        <CategoriaModal
          categoria={editing === 'new' ? null : editing}
          onClose={() => { setEditing(null); setLocalOrder(null) }}
        />
      )}
    </div>
  )
}
