// MOCKUP — App Asados · Catálogo de cortes (iteración 1)
import { useState } from 'react'
import { ChevronLeft, SlidersHorizontal, Pencil, Check, X } from 'lucide-react'

const C = {
  bg:     '#FAF8F5',
  card:   '#FFFFFF',
  ink:    '#1C1A17',
  ember:  '#C4541A',
  muted:  '#8B7E74',
  soft:   '#FFF0E8',
  border: '#EDE8E3',
}

// Colores por categoría (borde lateral)
const CAT_COLOR: Record<string, string> = {
  vacuno:   '#B84A1E',
  embutido: '#D97706',
  pollo:    '#CA8A04',
  cerdo:    '#C4541A',
  otro:     '#65A30D',
}

const CATEGORIAS = [
  { id: 'todos',    label: 'Todos' },
  { id: 'vacuno',   label: 'Vacuno' },
  { id: 'embutido', label: 'Embutidos' },
  { id: 'pollo',    label: 'Pollo' },
  { id: 'otro',     label: 'Otros' },
]

const CORTES = [
  // vacuno
  { id: 'costillar',     nombre: 'Costillar / Tira de asado',   cat: 'vacuno',   adulto: 350, nino: 200, precio: 9800,  fecha: '12 abr' },
  { id: 'entrana_trenz', nombre: 'Entraña trenzada',            cat: 'vacuno',   adulto: 250, nino: 150, precio: 18500, fecha: '18 abr' },
  { id: 'entrana_amer',  nombre: 'Entraña americana',           cat: 'vacuno',   adulto: 250, nino: 150, precio: 14200, fecha: '18 abr' },
  { id: 'lomo',          nombre: 'Lomo vetado',                 cat: 'vacuno',   adulto: 250, nino: 150, precio: 22000, fecha: '5 abr' },
  { id: 'palanca',       nombre: 'Palanca',                     cat: 'vacuno',   adulto: 250, nino: 150, precio: 11900, fecha: '18 abr' },
  { id: 'plateada',      nombre: 'Plateada Wagyu',              cat: 'vacuno',   adulto: 300, nino: 180, precio: 28000, fecha: '2 abr', notas: 'Cocción lenta' },
  // embutidos
  { id: 'longaniza',     nombre: 'Longaniza / Choripán',        cat: 'embutido', adulto: 200, nino: 150, precio: 6900,  fecha: '20 abr' },
  { id: 'curacaribs',    nombre: 'Curacaribs (mix)',            cat: 'embutido', adulto: 200, nino: 150, precio: 8500,  fecha: '20 abr', notas: 'Surtido Patache' },
  { id: 'prieta',        nombre: 'Prieta + Queso azul',         cat: 'embutido', adulto: 150, nino: 100, precio: 0,     fecha: '' },
  // pollo
  { id: 'pollo',         nombre: 'Pollo entero / Trutros',      cat: 'pollo',    adulto: 250, nino: 150, precio: 5200,  fecha: '15 abr' },
  // otro
  { id: 'provoleta',     nombre: 'Provoleta',                   cat: 'otro',     adulto: 100, nino:  60, precio: 7800,  fecha: '10 abr' },
  { id: 'champinones',   nombre: 'Champiñones rellenos',        cat: 'otro',     adulto: 100, nino:  60, precio: 4500,  fecha: '10 abr', notas: 'Bandejas Lider' },
]

function fmt(n: number) {
  return n > 0 ? `$${n.toLocaleString('es-CL')}` : '—'
}

function CorteRow({ corte, editingId, onEdit, onSave, onCancel, precioInput, onPrecioChange }: {
  corte: typeof CORTES[0]
  editingId: string | null
  onEdit: (id: string, precio: number) => void
  onSave: () => void
  onCancel: () => void
  precioInput: string
  onPrecioChange: (v: string) => void
}) {
  const isEditing = editingId === corte.id
  const color = CAT_COLOR[corte.cat] ?? C.ember

  return (
    <div className="relative bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
      {/* Left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: color }} />

      <div className="pl-4 pr-4 py-3.5">
        {!isEditing ? (
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-manrope text-[14px] font-bold leading-snug" style={{ color: C.ink }}>
                {corte.nombre}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-inter text-[11px]" style={{ color: C.muted }}>
                  {corte.adulto}g adulto · {corte.nino}g niño
                </span>
              </div>
              {corte.notas && (
                <p className="font-inter text-[11px] italic mt-0.5" style={{ color: C.muted }}>
                  {corte.notas}
                </p>
              )}
            </div>
            <button type="button" onClick={() => onEdit(corte.id, corte.precio)}
              className="flex flex-col items-end gap-0.5 shrink-0 group">
              <span className={`font-manrope text-[13px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                corte.precio > 0
                  ? 'group-hover:opacity-80'
                  : ''
              }`}
              style={{
                background: corte.precio > 0 ? C.soft : '#F5F3F0',
                color: corte.precio > 0 ? C.ember : C.muted,
              }}>
                {corte.precio > 0 ? `${fmt(corte.precio)}/kg` : 'Sin precio'}
              </span>
              {corte.fecha && (
                <span className="font-inter text-[10px]" style={{ color: C.border }}>
                  {corte.fecha}
                </span>
              )}
            </button>
          </div>
        ) : (
          /* Edit mode */
          <div>
            <p className="font-manrope text-[13px] font-bold mb-2" style={{ color: C.ink }}>
              {corte.nombre}
            </p>
            <div className="flex items-center gap-2">
              <span className="font-inter text-xs" style={{ color: C.muted }}>$/kg</span>
              <input
                type="number"
                value={precioInput}
                onChange={e => onPrecioChange(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm text-right font-manrope font-bold focus:outline-none focus:ring-2"
                style={{ borderColor: C.ember, color: C.ink }}
                autoFocus
              />
              <button type="button" onClick={onCancel}
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: '#F5F3F0' }}>
                <X className="h-4 w-4" style={{ color: C.muted }} />
              </button>
              <button type="button" onClick={onSave}
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: C.ember }}>
                <Check className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AsadosCortesListMockup() {
  const [catActiva, setCatActiva] = useState('todos')
  const [editingId, setEditingId] = useState<string | null>('entrana_trenz') // mostrar uno en edit mode
  const [precioInput, setPrecioInput] = useState('18500')

  const visibles = catActiva === 'todos'
    ? CORTES
    : CORTES.filter(c => c.cat === catActiva)

  const porCategoria = CATEGORIAS.filter(c => c.id !== 'todos').map(cat => ({
    ...cat,
    items: visibles.filter(c => c.cat === cat.id),
  })).filter(c => c.items.length > 0)

  return (
    <div className="min-h-screen pb-8" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-8 pb-4">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.card, boxShadow: '0 1px 3px rgba(28,26,23,0.1)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: C.muted }} />
          </button>
          <div className="flex-1">
            <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>Cortes</h1>
            <p className="font-inter text-xs" style={{ color: C.muted }}>
              {CORTES.length} cortes en catálogo
            </p>
          </div>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.card, boxShadow: '0 1px 3px rgba(28,26,23,0.1)' }}>
            <SlidersHorizontal className="h-4 w-4" style={{ color: C.muted }} />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
          {CATEGORIAS.map(cat => {
            const isActive = catActiva === cat.id
            return (
              <button key={cat.id} type="button"
                onClick={() => setCatActiva(cat.id)}
                className="shrink-0 font-inter text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: isActive ? C.ink : C.card,
                  color: isActive ? '#FFFFFF' : C.muted,
                  boxShadow: isActive ? 'none' : '0 1px 3px rgba(28,26,23,0.08)',
                }}>
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Tip edición */}
        <div className="mx-4 mb-4 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: C.soft }}>
          <Pencil className="h-3.5 w-3.5 shrink-0" style={{ color: C.ember }} />
          <p className="font-inter text-[11px]" style={{ color: C.ember }}>
            Toca el precio de cualquier corte para actualizarlo
          </p>
        </div>

        {/* Listas por categoría */}
        <div className="px-4 space-y-6">
          {porCategoria.map(cat => (
            <section key={cat.id}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full" style={{ background: CAT_COLOR[cat.id] ?? C.ember }} />
                <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: C.muted }}>
                  {cat.label}
                </p>
                <span className="font-inter text-[10px]" style={{ color: C.border }}>
                  {cat.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {cat.items.map(corte => (
                  <CorteRow
                    key={corte.id}
                    corte={corte}
                    editingId={editingId}
                    onEdit={(id, precio) => { setEditingId(id); setPrecioInput(String(precio || '')) }}
                    onSave={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                    precioInput={precioInput}
                    onPrecioChange={setPrecioInput}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

      </div>
    </div>
  )
}
