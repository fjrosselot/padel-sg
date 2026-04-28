// MOCKUP — App Asados · Wizard paso 2: Selección de menú (cortes + recetas) — iteración 2
// Con controles de cantidad y medidor de g/adulto total
import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Minus, Plus, BookOpen } from 'lucide-react'

const C = {
  bg:     '#FAF8F5',
  card:   '#FFFFFF',
  ink:    '#1C1A17',
  ember:  '#C4541A',
  recipe: '#7C6A15',
  muted:  '#8B7E74',
  soft:   '#FFF0E8',
  softR:  '#FDF8E7',
  border: '#EDE8E3',
  ok:     '#16A34A',  // verde zona ideal
  warn:   '#D97706',  // amarillo exceso
}

const ADULTOS = 15
const NINOS   = 8

// ─── Datos ───────────────────────────────────────────────────────────────────

const CORTES = [
  { id: 'costillar', nombre: 'Costillar',       cat: 'vacuno',   gA: 350, gN: 200, precio: 9800  },
  { id: 'entrana',   nombre: 'Entraña',          cat: 'vacuno',   gA: 250, gN: 150, precio: 14200 },
  { id: 'malaya',    nombre: 'Malaya',            cat: 'vacuno',   gA: 200, gN: 120, precio: 8900  },
  { id: 'longaniza', nombre: 'Longaniza',         cat: 'embutido', gA: 200, gN: 150, precio: 6900  },
  { id: 'pollo',     nombre: 'Trutros de pollo',  cat: 'pollo',    gA: 250, gN: 150, precio: 5200  },
]

const RECETAS = [
  {
    id: 'entrana_trenz', nombre: 'Entraña trenzada', gA_equiv: 280,
    desc: 'Entraña con técnica de trenzado',
    ingredientes: [
      { nombre: 'Entraña',   unidad: 'kg', porP: 0.28, precio: 14200, esCorte: true },
      { nombre: 'Sal gruesa',unidad: 'g',  porP: 8,    precio: 0.8,   esCorte: false },
    ],
  },
  {
    id: 'malaya_pizza', nombre: 'Malaya pizza', gA_equiv: 220,
    desc: 'Malaya rellena con tomate, queso y tocino',
    ingredientes: [
      { nombre: 'Malaya', unidad: 'kg', porP: 0.22, precio: 8900,  esCorte: true },
      { nombre: 'Tomate', unidad: 'kg', porP: 0.06, precio: 1800,  esCorte: false },
      { nombre: 'Queso',  unidad: 'kg', porP: 0.03, precio: 9500,  esCorte: false },
      { nombre: 'Tocino', unidad: 'kg', porP: 0.02, precio: 12000, esCorte: false },
    ],
  },
  {
    id: 'ensalada', nombre: 'Ensalada chilena', gA_equiv: 0,
    desc: 'Tomate · cebolla · cilantro · limón',
    ingredientes: [
      { nombre: 'Tomate',   unidad: 'kg',   porP: 0.12, precio: 1800, esCorte: false },
      { nombre: 'Cebolla',  unidad: 'kg',   porP: 0.06, precio: 1200, esCorte: false },
      { nombre: 'Cilantro', unidad: 'atado',porP: 0.1,  precio: 900,  esCorte: false },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function kgSugerido(gA: number, gN: number) {
  return Math.ceil((ADULTOS * gA + NINOS * gN) / 1000 * 2) / 2
}

function kgAGramos(kg: number): number {
  // g/adulto aprox dado X kg total (asume proporción adultos/niños)
  const totalPonderado = ADULTOS + NINOS * 0.6
  return Math.round(kg * 1000 / totalPonderado)
}

function costoKg(kg: number, precio: number) { return Math.round(kg * precio) }

function costoReceta(receta: typeof RECETAS[0], factor: number) {
  const personas = (ADULTOS + NINOS) * factor
  return receta.ingredientes.reduce((s, ing) => s + ing.porP * personas * ing.precio, 0)
}

function cantIng(porP: number, unidad: string, factor: number) {
  const raw = porP * (ADULTOS + NINOS) * factor
  if (unidad === 'kg') return (Math.ceil(raw * 2) / 2).toFixed(1) + ' kg'
  if (unidad === 'atado') return Math.ceil(raw) + ' atados'
  return Math.round(raw) + ' ' + unidad
}

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-CL') }

// ─── Medidor g/adulto ─────────────────────────────────────────────────────────
// Zona ideal: 300–450g/adulto de proteína

function Medidor({ totalG }: { totalG: number }) {
  const MAX   = 600
  const pct   = Math.min(totalG / MAX * 100, 100)
  const color = totalG < 200 ? C.ember : totalG <= 450 ? C.ok : C.warn
  const label = totalG < 200 ? 'Poco' : totalG <= 450 ? 'Ideal' : 'Abundante'

  return (
    <div className="mx-4 mb-4 rounded-xl px-4 py-3"
      style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: C.muted }}>
          Proteína total
        </p>
        <div className="flex items-center gap-2">
          <span className="font-manrope text-[15px] font-bold" style={{ color }}>
            {totalG}g
          </span>
          <span className="font-inter text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: totalG < 200 ? C.soft : totalG <= 450 ? '#DCFCE7' : '#FEF3C7', color }}>
            {label}
          </span>
        </div>
      </div>
      {/* Barra */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      {/* Referencias */}
      <div className="flex justify-between mt-1">
        <span className="font-inter text-[9px]" style={{ color: C.border }}>0g</span>
        <span className="font-inter text-[9px]" style={{ color: C.ok }}>300–450g ideal</span>
        <span className="font-inter text-[9px]" style={{ color: C.border }}>600g+</span>
      </div>
      <p className="font-inter text-[10px] mt-1" style={{ color: C.muted }}>
        por adulto · suma de todos los ítems seleccionados
      </p>
    </div>
  )
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ value, onDec, onInc, label }: {
  value: string; onDec: () => void; onInc: () => void; label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onDec}
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: C.border }}>
        <Minus className="h-3.5 w-3.5" style={{ color: C.muted }} />
      </button>
      <span className="font-manrope text-[14px] font-bold w-16 text-center" style={{ color: C.ink }}>
        {value}
      </span>
      <button type="button" onClick={onInc}
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: C.ember }}>
        <Plus className="h-3.5 w-3.5 text-white" />
      </button>
      <span className="font-inter text-[11px]" style={{ color: C.muted }}>{label}</span>
    </div>
  )
}

// ─── CorteCard ───────────────────────────────────────────────────────────────

function CorteCard({ corte, selected, kg, onToggle, onKgChange }: {
  corte: typeof CORTES[0]; selected: boolean; kg: number
  onToggle: () => void; onKgChange: (kg: number) => void
}) {
  const costo  = costoKg(kg, corte.precio)
  const gAdult = kgAGramos(kg)
  const kgSug  = kgSugerido(corte.gA, corte.gN)

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: C.card,
        boxShadow: selected
          ? `0 0 0 2px ${C.ember}, 0 2px 8px rgba(196,84,26,0.10)`
          : '0 1px 4px rgba(28,26,23,0.07)',
      }}>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: selected ? C.ember : C.border }} />

        {/* Header row */}
        <button type="button" onClick={onToggle}
          className="w-full flex items-center gap-3 pl-4 pr-4 pt-3 pb-2 text-left">
          <div className="h-5 w-5 rounded shrink-0 flex items-center justify-center border-2 transition-colors"
            style={{ borderColor: selected ? C.ember : C.border, background: selected ? C.ember : 'transparent' }}>
            {selected && <span className="text-white text-xs font-bold leading-none">✓</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>{corte.nombre}</p>
              <span className="font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ background: C.soft, color: C.ember }}>corte</span>
            </div>
            <p className="font-inter text-[11px]" style={{ color: C.muted }}>
              Sugerido: {kgSug} kg · {corte.gA}g/adulto
            </p>
          </div>
          {!selected && (
            <p className="font-inter text-[11px] shrink-0" style={{ color: C.border }}>
              {fmt(corte.precio)}/kg
            </p>
          )}
        </button>

        {/* Control de cantidad (solo si seleccionado) */}
        {selected && (
          <div className="pl-4 pr-4 pb-3 flex items-center justify-between">
            <Stepper
              value={`${kg} kg`}
              onDec={() => onKgChange(Math.max(0.5, kg - 0.5))}
              onInc={() => onKgChange(kg + 0.5)}
              label={`≈ ${gAdult}g/adulto`}
            />
            <p className="font-manrope text-[13px] font-bold" style={{ color: C.ember }}>
              {fmt(costo)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── RecetaCard ──────────────────────────────────────────────────────────────

function RecetaCard({ receta, selected, factor, expanded, onToggle, onFactorChange, onExpand }: {
  receta: typeof RECETAS[0]; selected: boolean; factor: number; expanded: boolean
  onToggle: () => void; onFactorChange: (f: number) => void; onExpand: () => void
}) {
  const costo    = costoReceta(receta, factor)
  const personas = Math.round((ADULTOS + NINOS) * factor)
  const gAdult   = Math.round(receta.gA_equiv * factor)

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: C.card,
        boxShadow: selected
          ? `0 0 0 2px ${C.recipe}, 0 2px 8px rgba(124,106,21,0.08)`
          : '0 1px 4px rgba(28,26,23,0.07)',
      }}>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: selected ? C.recipe : C.border }} />

        {/* Header row */}
        <div className="pl-4 pr-3 pt-3 pb-2 flex items-center gap-3">
          <button type="button" onClick={onToggle}
            className="h-5 w-5 rounded shrink-0 flex items-center justify-center border-2 transition-colors"
            style={{ borderColor: selected ? C.recipe : C.border, background: selected ? C.recipe : 'transparent' }}>
            {selected && <span className="text-white text-xs font-bold leading-none">✓</span>}
          </button>
          <button type="button" onClick={onToggle} className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>{receta.nombre}</p>
              <span className="font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ background: C.softR, color: C.recipe }}>receta</span>
            </div>
            <p className="font-inter text-[11px]" style={{ color: C.muted }}>{receta.desc}</p>
          </button>
          <button type="button" onClick={onExpand}
            className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ background: expanded ? C.softR : '#F5F3F0' }}>
            {expanded
              ? <ChevronUp   className="h-3.5 w-3.5" style={{ color: C.recipe }} />
              : <ChevronDown className="h-3.5 w-3.5" style={{ color: C.muted }} />}
          </button>
        </div>

        {/* Control de porciones (solo si seleccionado) */}
        {selected && (
          <div className="pl-4 pr-4 pb-3 flex items-center justify-between">
            <Stepper
              value={`${personas} p`}
              onDec={() => onFactorChange(Math.max(0.25, Math.round((factor - 0.25) * 4) / 4))}
              onInc={() => onFactorChange(Math.round((factor + 0.25) * 4) / 4)}
              label={receta.gA_equiv > 0 ? `≈ ${gAdult}g/adulto` : `${(ADULTOS + NINOS)} personas`}
            />
            <p className="font-manrope text-[13px] font-bold" style={{ color: C.recipe }}>
              {fmt(costo)}
            </p>
          </div>
        )}

        {/* Ingredientes expandidos */}
        {expanded && (
          <div className="mx-3 mb-3 rounded-lg overflow-hidden border" style={{ borderColor: C.border }}>
            <div className="px-3 py-2 flex items-center gap-1.5"
              style={{ background: C.softR, borderBottom: `1px solid ${C.border}` }}>
              <BookOpen className="h-3 w-3" style={{ color: C.recipe }} />
              <p className="font-inter text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.recipe }}>
                Ingredientes — {personas} porciones
              </p>
            </div>
            {receta.ingredientes.map((ing, i) => (
              <div key={i} className="flex items-center px-3 py-2 border-b last:border-0"
                style={{ borderColor: C.border }}>
                <p className="flex-1 font-inter text-[12px]" style={{ color: C.ink }}>
                  {ing.nombre}
                  {ing.esCorte && (
                    <span className="ml-1.5 font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                      style={{ background: C.soft, color: C.ember }}>corte</span>
                  )}
                </p>
                <p className="font-manrope text-[12px] font-bold" style={{ color: C.ink }}>
                  {cantIng(ing.porP, ing.unidad, factor)}
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

// Estado inicial del mockup: costillar con 2kg (bocado), longaniza full, entraña trenzada full
const KG_INIT: Record<string, number> = {
  costillar: 2,
  longaniza: kgSugerido(200, 150),
}
const FACTOR_INIT: Record<string, number> = {
  entrana_trenz: 1,
  malaya_pizza: 1,
  ensalada: 1,
}

export default function AsadosWizardMenuMockup() {
  const [tab,       setTab]       = useState<Tab>('todo')
  const [selC,      setSelC]      = useState(new Set(['costillar', 'longaniza']))
  const [selR,      setSelR]      = useState(new Set(['entrana_trenz', 'ensalada']))
  const [kgs,       setKgs]       = useState<Record<string, number>>(KG_INIT)
  const [factores,  setFactores]  = useState<Record<string, number>>(FACTOR_INIT)
  const [expanded,  setExpanded]  = useState(new Set(['entrana_trenz']))

  function toggleC(id: string) {
    setSelC(s => {
      const n = new Set(s)
      if (n.has(id)) { n.delete(id) } else {
        n.add(id)
        const c = CORTES.find(x => x.id === id)!
        setKgs(k => ({ ...k, [id]: kgSugerido(c.gA, c.gN) }))
      }
      return n
    })
  }

  function toggleR(id: string) {
    setSelR(s => {
      const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
    })
  }

  function setKg(id: string, kg: number) {
    setKgs(k => ({ ...k, [id]: kg }))
  }

  function setFactor(id: string, f: number) {
    setFactores(fk => ({ ...fk, [id]: f }))
  }

  function toggleExp(id: string) {
    setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // Total g/adulto de todos los seleccionados
  const totalG = [
    ...CORTES.filter(c => selC.has(c.id)).map(c => kgAGramos(kgs[c.id] ?? kgSugerido(c.gA, c.gN))),
    ...RECETAS.filter(r => selR.has(r.id)).map(r => Math.round(r.gA_equiv * (factores[r.id] ?? 1))),
  ].reduce((a, b) => a + b, 0)

  const totalCosto = [
    ...CORTES.filter(c => selC.has(c.id)).map(c => costoKg(kgs[c.id] ?? 0, c.precio)),
    ...RECETAS.filter(r => selR.has(r.id)).map(r => costoReceta(r, factores[r.id] ?? 1)),
  ].reduce((a, b) => a + b, 0)

  const totalItems = selC.size + selR.size

  const tabs: { id: Tab; label: string }[] = [
    { id: 'todo',    label: 'Todo' },
    { id: 'cortes',  label: 'Cortes' },
    { id: 'recetas', label: 'Recetas' },
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
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
              Paso 2 de 4
            </p>
            <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>Menú</h1>
          </div>
          <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
            {ADULTOS}A · {NINOS}N
          </p>
        </div>

        {/* Progress */}
        <div className="px-4 mb-4">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div className="h-full rounded-full" style={{ width: '50%', background: C.ember }} />
          </div>
        </div>

        {/* Medidor g/adulto */}
        <Medidor totalG={totalG} />

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

        {/* Listas */}
        <div className="px-4 space-y-5">

          {(tab === 'todo' || tab === 'cortes') && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full" style={{ background: C.ember }} />
                <p className="font-inter text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                  Cortes
                </p>
                <span className="font-inter text-[10px]" style={{ color: C.border }}>{selC.size} selec.</span>
              </div>
              <div className="space-y-2">
                {CORTES.map(c => (
                  <CorteCard key={c.id} corte={c}
                    selected={selC.has(c.id)}
                    kg={kgs[c.id] ?? kgSugerido(c.gA, c.gN)}
                    onToggle={() => toggleC(c.id)}
                    onKgChange={kg => setKg(c.id, kg)} />
                ))}
              </div>
            </section>
          )}

          {(tab === 'todo' || tab === 'recetas') && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full" style={{ background: C.recipe }} />
                <p className="font-inter text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                  Recetas
                </p>
                <span className="font-inter text-[10px]" style={{ color: C.border }}>{selR.size} selec.</span>
              </div>
              <div className="space-y-2">
                {RECETAS.map(r => (
                  <RecetaCard key={r.id} receta={r}
                    selected={selR.has(r.id)}
                    factor={factores[r.id] ?? 1}
                    expanded={expanded.has(r.id)}
                    onToggle={() => toggleR(r.id)}
                    onFactorChange={f => setFactor(r.id, f)}
                    onExpand={() => toggleExp(r.id)} />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0"
        style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-inter text-[11px]" style={{ color: C.muted }}>
              {totalItems} ítem{totalItems !== 1 ? 's' : ''} · {totalG}g/adulto
            </p>
            <p className="font-manrope text-lg font-bold" style={{ color: C.ink }}>
              {totalCosto > 0 ? `~${fmt(totalCosto)}` : '—'}
            </p>
          </div>
          <button type="button"
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-manrope text-[13px] font-bold text-white"
            style={{ background: totalItems > 0 ? C.ember : C.border }}>
            Continuar <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
