// MOCKUP — App Asados · Wizard paso 2: Selección de menú (cortes + recetas)
import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, UtensilsCrossed, BookOpen } from 'lucide-react'

const C = {
  bg:     '#FAF8F5',
  card:   '#FFFFFF',
  ink:    '#1C1A17',
  ember:  '#C4541A',
  recipe: '#7C6A15',   // dorado oscuro para recetas
  muted:  '#8B7E74',
  soft:   '#FFF0E8',
  softR:  '#FDF8E7',   // soft para recetas
  border: '#EDE8E3',
  check:  '#C4541A',
}

// ─── Datos mock ──────────────────────────────────────────────────────────────

const ADULTOS = 15
const NINOS   = 8
const PERSONAS_LABEL = `${ADULTOS} adultos + ${NINOS} niños`

// Cortes crudos (insumos)
const CORTES = [
  { id: 'costillar',  nombre: 'Costillar',        cat: 'vacuno',   gA: 350, gN: 200, precio: 9800  },
  { id: 'entrana',    nombre: 'Entraña',           cat: 'vacuno',   gA: 250, gN: 150, precio: 14200 },
  { id: 'lomo',       nombre: 'Lomo vetado',       cat: 'vacuno',   gA: 250, gN: 150, precio: 22000 },
  { id: 'malaya',     nombre: 'Malaya',            cat: 'vacuno',   gA: 200, gN: 120, precio: 8900  },
  { id: 'longaniza',  nombre: 'Longaniza',         cat: 'embutido', gA: 200, gN: 150, precio: 6900  },
  { id: 'curacaribs', nombre: 'Curacaribs',        cat: 'embutido', gA: 200, gN: 150, precio: 8500  },
  { id: 'pollo',      nombre: 'Trutros de pollo',  cat: 'pollo',    gA: 250, gN: 150, precio: 5200  },
]

// Recetas (preparaciones) — cada una tiene ingredientes que se expanden
const RECETAS = [
  {
    id: 'entrana_trenz',
    nombre: 'Entraña trenzada',
    desc: 'Entraña limpia con técnica de trenzado',
    ingredientes: [
      { nombre: 'Entraña', unidad: 'kg', porPersona: 0.28, precioUnit: 14200, esCorte: true },
      { nombre: 'Sal gruesa', unidad: 'g', porPersona: 8,  precioUnit: 0.8,   esCorte: false },
    ],
  },
  {
    id: 'malaya_pizza',
    nombre: 'Malaya pizza',
    desc: 'Malaya rellena con tomate, queso y tocino',
    ingredientes: [
      { nombre: 'Malaya',  unidad: 'kg', porPersona: 0.22, precioUnit: 8900,  esCorte: true },
      { nombre: 'Tomate',  unidad: 'kg', porPersona: 0.06, precioUnit: 1800,  esCorte: false },
      { nombre: 'Queso',   unidad: 'kg', porPersona: 0.03, precioUnit: 9500,  esCorte: false },
      { nombre: 'Tocino',  unidad: 'kg', porPersona: 0.02, precioUnit: 12000, esCorte: false },
    ],
  },
  {
    id: 'ensalada_chilena',
    nombre: 'Ensalada chilena',
    desc: 'Tomate + cebolla + cilantro + limón',
    ingredientes: [
      { nombre: 'Tomate',   unidad: 'kg', porPersona: 0.12, precioUnit: 1800, esCorte: false },
      { nombre: 'Cebolla',  unidad: 'kg', porPersona: 0.06, precioUnit: 1200, esCorte: false },
      { nombre: 'Cilantro', unidad: 'atado', porPersona: 0.1, precioUnit: 900, esCorte: false },
    ],
  },
  {
    id: 'pebre',
    nombre: 'Pebre',
    desc: 'Cebolla, tomate, cilantro, ají',
    ingredientes: [
      { nombre: 'Cebolla',  unidad: 'kg', porPersona: 0.05, precioUnit: 1200, esCorte: false },
      { nombre: 'Tomate',   unidad: 'kg', porPersona: 0.05, precioUnit: 1800, esCorte: false },
      { nombre: 'Cilantro', unidad: 'atado', porPersona: 0.07, precioUnit: 900, esCorte: false },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TOTAL_PERSONAS = ADULTOS + NINOS

function kgCorte(gA: number, gN: number) {
  const g = ADULTOS * gA + NINOS * gN
  const kg = g / 1000
  return Math.ceil(kg * 2) / 2  // redondear a 0.5 superior
}

function costoCorte(gA: number, gN: number, precio: number) {
  return kgCorte(gA, gN) * precio
}

function cantIngrediente(porPersona: number, unidad: string) {
  const raw = porPersona * TOTAL_PERSONAS
  if (unidad === 'kg') return (Math.ceil(raw * 2) / 2).toFixed(1) + ' kg'
  if (unidad === 'atado') return Math.ceil(raw) + ' atados'
  return raw.toFixed(0) + ' ' + unidad
}

function costoReceta(receta: typeof RECETAS[0]) {
  return receta.ingredientes.reduce((sum, ing) => {
    const cant = ing.porPersona * TOTAL_PERSONAS
    return sum + cant * ing.precioUnit
  }, 0)
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL')
}

// ─── Componentes ─────────────────────────────────────────────────────────────

type CorteItem = typeof CORTES[0]
type RecetaItem = typeof RECETAS[0]

function CorteCard({ corte, selected, onToggle }: {
  corte: CorteItem; selected: boolean; onToggle: () => void
}) {
  const kg    = kgCorte(corte.gA, corte.gN)
  const costo = costoCorte(corte.gA, corte.gN, corte.precio)

  return (
    <button type="button" onClick={onToggle}
      className="w-full text-left rounded-xl overflow-hidden relative"
      style={{
        background: C.card,
        boxShadow: selected
          ? `0 0 0 2px ${C.ember}, 0 2px 8px rgba(196,84,26,0.12)`
          : '0 1px 4px rgba(28,26,23,0.07)',
      }}>
      {/* Left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: selected ? C.ember : C.border }} />

      <div className="pl-4 pr-4 py-3 flex items-center gap-3">
        {/* Checkbox */}
        <div className="h-5 w-5 rounded shrink-0 flex items-center justify-center border-2 transition-colors"
          style={{
            borderColor: selected ? C.ember : C.border,
            background:  selected ? C.ember : 'transparent',
          }}>
          {selected && <span className="text-white text-xs font-bold leading-none">✓</span>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
              {corte.nombre}
            </p>
            <span className="font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{ background: C.soft, color: C.ember }}>
              corte
            </span>
          </div>
          <p className="font-inter text-[11px] mt-0.5" style={{ color: C.muted }}>
            {corte.gA}g adulto · {corte.gN}g niño
          </p>
        </div>

        {/* Cantidad + costo (solo si seleccionado) */}
        {selected && (
          <div className="text-right shrink-0">
            <p className="font-manrope text-[13px] font-bold" style={{ color: C.ember }}>
              {kg} kg
            </p>
            <p className="font-inter text-[10px]" style={{ color: C.muted }}>
              {fmt(costo)}
            </p>
          </div>
        )}
        {!selected && (
          <p className="font-inter text-[11px] shrink-0" style={{ color: C.border }}>
            {fmt(corte.precio)}/kg
          </p>
        )}
      </div>
    </button>
  )
}

function RecetaCard({ receta, selected, expanded, onToggle, onExpand }: {
  receta: RecetaItem; selected: boolean; expanded: boolean;
  onToggle: () => void; onExpand: () => void
}) {
  const costo = costoReceta(receta)

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: C.card,
        boxShadow: selected
          ? `0 0 0 2px ${C.recipe}, 0 2px 8px rgba(124,106,21,0.1)`
          : '0 1px 4px rgba(28,26,23,0.07)',
      }}>
      {/* Left border */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: selected ? C.recipe : C.border }} />

        {/* Main row */}
        <div className="pl-4 pr-3 py-3 flex items-center gap-3">
          {/* Checkbox */}
          <button type="button" onClick={onToggle}
            className="h-5 w-5 rounded shrink-0 flex items-center justify-center border-2 transition-colors"
            style={{
              borderColor: selected ? C.recipe : C.border,
              background:  selected ? C.recipe : 'transparent',
            }}>
            {selected && <span className="text-white text-xs font-bold leading-none">✓</span>}
          </button>

          {/* Info */}
          <button type="button" onClick={onToggle} className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
                {receta.nombre}
              </p>
              <span className="font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ background: C.softR, color: C.recipe }}>
                receta
              </span>
            </div>
            <p className="font-inter text-[11px] mt-0.5" style={{ color: C.muted }}>
              {receta.desc}
            </p>
          </button>

          {/* Costo + expand */}
          <div className="flex items-center gap-2 shrink-0">
            {selected && (
              <p className="font-manrope text-[13px] font-bold" style={{ color: C.recipe }}>
                {fmt(costo)}
              </p>
            )}
            <button type="button" onClick={onExpand}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ background: expanded ? C.softR : '#F5F3F0' }}>
              {expanded
                ? <ChevronUp  className="h-3.5 w-3.5" style={{ color: C.recipe }} />
                : <ChevronDown className="h-3.5 w-3.5" style={{ color: C.muted }} />}
            </button>
          </div>
        </div>

        {/* Ingredient expansion */}
        {expanded && (
          <div className="mx-3 mb-3 rounded-lg overflow-hidden border"
            style={{ borderColor: C.border }}>
            <div className="px-3 py-2 flex items-center gap-1.5"
              style={{ background: C.softR, borderBottom: `1px solid ${C.border}` }}>
              <BookOpen className="h-3 w-3" style={{ color: C.recipe }} />
              <p className="font-inter text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: C.recipe }}>
                Ingredientes para {TOTAL_PERSONAS} personas
              </p>
            </div>
            {receta.ingredientes.map((ing, i) => (
              <div key={i}
                className="flex items-center px-3 py-2 border-b last:border-0"
                style={{ borderColor: C.border }}>
                <p className="flex-1 font-inter text-[12px]" style={{ color: C.ink }}>
                  {ing.nombre}
                  {ing.esCorte && (
                    <span className="ml-1.5 font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                      style={{ background: C.soft, color: C.ember }}>
                      corte
                    </span>
                  )}
                </p>
                <p className="font-manrope text-[12px] font-bold" style={{ color: C.ink }}>
                  {cantIngrediente(ing.porPersona, ing.unidad)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

type Tab = 'todo' | 'cortes' | 'recetas'

export default function AsadosWizardMenuMockup() {
  const [tab, setTab]       = useState<Tab>('todo')
  const [selCortes, setSelCortes]   = useState<Set<string>>(new Set(['costillar', 'longaniza']))
  const [selRecetas, setSelRecetas] = useState<Set<string>>(new Set(['entrana_trenz', 'malaya_pizza', 'ensalada_chilena']))
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set(['entrana_trenz']))

  function toggleCorte(id: string) {
    setSelCortes(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleReceta(id: string) {
    setSelRecetas(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleExpand(id: string) {
    setExpandidas(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const totalCosteCort = CORTES.filter(c => selCortes.has(c.id))
    .reduce((sum, c) => sum + costoCorte(c.gA, c.gN, c.precio), 0)
  const totalCosteRec = RECETAS.filter(r => selRecetas.has(r.id))
    .reduce((sum, r) => sum + costoReceta(r), 0)
  const totalItems = selCortes.size + selRecetas.size
  const totalCosto = totalCosteCort + totalCosteRec

  const tabs: { id: Tab; label: string; icon: typeof UtensilsCrossed }[] = [
    { id: 'todo',    label: 'Todo',    icon: UtensilsCrossed },
    { id: 'cortes',  label: 'Cortes',  icon: UtensilsCrossed },
    { id: 'recetas', label: 'Recetas', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen pb-32" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-8 pb-3">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.card, boxShadow: '0 1px 3px rgba(28,26,23,0.1)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: C.muted }} />
          </button>
          <div className="flex-1">
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: C.muted }}>
              Paso 2 de 4
            </p>
            <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>
              Menú
            </h1>
          </div>
          <div className="text-right">
            <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
              {PERSONAS_LABEL}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 mb-4">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div className="h-full rounded-full" style={{ width: '50%', background: C.ember }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1 mb-4">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg font-inter text-[12px] font-semibold transition-colors"
              style={{
                background: tab === t.id ? C.ink : C.card,
                color:      tab === t.id ? '#FFF' : C.muted,
                boxShadow:  tab === t.id ? 'none' : '0 1px 3px rgba(28,26,23,0.07)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Lists */}
        <div className="px-4 space-y-5">

          {/* Sección cortes */}
          {(tab === 'todo' || tab === 'cortes') && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full" style={{ background: C.ember }} />
                <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: C.muted }}>
                  Cortes
                </p>
                <span className="font-inter text-[10px]" style={{ color: C.border }}>
                  {selCortes.size} seleccionados
                </span>
              </div>
              <div className="space-y-2">
                {CORTES.map(c => (
                  <CorteCard key={c.id} corte={c}
                    selected={selCortes.has(c.id)}
                    onToggle={() => toggleCorte(c.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Sección recetas */}
          {(tab === 'todo' || tab === 'recetas') && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full" style={{ background: C.recipe }} />
                <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: C.muted }}>
                  Recetas
                </p>
                <span className="font-inter text-[10px]" style={{ color: C.border }}>
                  {selRecetas.size} seleccionadas
                </span>
              </div>
              <div className="space-y-2">
                {RECETAS.map(r => (
                  <RecetaCard key={r.id} receta={r}
                    selected={selRecetas.has(r.id)}
                    expanded={expandidas.has(r.id)}
                    onToggle={() => toggleReceta(r.id)}
                    onExpand={() => toggleExpand(r.id)} />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Bottom bar fija */}
      <div className="fixed bottom-0 left-0 right-0"
        style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                {totalItems} elemento{totalItems !== 1 ? 's' : ''} seleccionado{totalItems !== 1 ? 's' : ''}
              </p>
              <p className="font-manrope text-lg font-bold" style={{ color: C.ink }}>
                {totalCosto > 0 ? `~${fmt(totalCosto)}` : '—'}
              </p>
            </div>
            <button type="button"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-manrope text-[13px] font-bold text-white"
              style={{ background: totalItems > 0 ? C.ember : C.border }}>
              Continuar
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
