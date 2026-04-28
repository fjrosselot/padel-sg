// MOCKUP — App Asados · Lista de compras (Wizard paso 4)
import { useState } from 'react'
import { Check, X, Pencil, MessageCircle, Save, ChevronDown, ChevronUp } from 'lucide-react'

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
  green:  '#16A34A',
  softG:  '#DCFCE7',
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL')
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ASADO = {
  nombre: 'Asado padres 4°B',
  fecha: '15 may 2026 · viernes',
  adultos: 15, ninos: 8,
  ponderado: 19.0,
  modalidad: 'diferenciado',
}

type ItemCorte = {
  id: string; nombre: string; tipo: 'corte' | 'receta'
  kg: number; lugar: string; precioKg: number; totalCalc: number
  ingredientes?: { nombre: string; cantidad: string; esCorte: boolean }[]
}

type ItemAcomp = {
  id: string; nombre: string
  ingredientes: { nombre: string; cantidad: string }[]
  costo: number
}

type ItemLibre = {
  id: string; descripcion: string; cantidad: string; precio: number
}

const CARNES: ItemCorte[] = [
  {
    id: 'costillar', nombre: 'Costillar', tipo: 'corte',
    kg: 2, lugar: 'Patache', precioKg: 9800, totalCalc: 19600,
  },
  {
    id: 'entrana_trenz', nombre: 'Entraña trenzada', tipo: 'receta',
    kg: 6.5, lugar: 'Patache', precioKg: 14200, totalCalc: 91595,
    ingredientes: [
      { nombre: 'Entraña',    cantidad: '6.5 kg', esCorte: true },
      { nombre: 'Sal gruesa', cantidad: '184 g',  esCorte: false },
    ],
  },
  {
    id: 'longaniza', nombre: 'Longaniza', tipo: 'corte',
    kg: 4.5, lugar: 'Lider', precioKg: 6900, totalCalc: 31050,
  },
]

const ACOMPS: ItemAcomp[] = [
  {
    id: 'ensalada', nombre: 'Ensalada chilena', costo: 8694,
    ingredientes: [
      { nombre: 'Tomate',   cantidad: '2.8 kg' },
      { nombre: 'Cebolla',  cantidad: '1.4 kg' },
      { nombre: 'Cilantro', cantidad: '3 atados' },
    ],
  },
]

const OTROS: ItemLibre[] = [
  { id: 'carbon',  descripcion: 'Carbón',     cantidad: '3 bolsas', precio: 4500  },
  { id: 'vino',    descripcion: 'Vino tinto',  cantidad: '2 cajas',  precio: 18000 },
  { id: 'pan',     descripcion: 'Pan marraqueta', cantidad: '20 un', precio: 3200  },
]

// ─── PrecioCell ───────────────────────────────────────────────────────────────

function PrecioCell({ id, calc, override, onChange }: {
  id: string; calc: number; override: number | null
  onChange: (id: string, v: number | null) => void
}) {
  const [editing, setEditing]   = useState(false)
  const [input,   setInput]     = useState('')
  const final = override ?? calc
  const modified = override !== null && override !== calc

  function open() { setInput(String(final)); setEditing(true) }
  function save() {
    const v = parseInt(input)
    onChange(id, isNaN(v) ? null : v)
    setEditing(false)
  }
  function clear() { onChange(id, null); setEditing(false) }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-inter text-[11px]" style={{ color: C.muted }}>$</span>
        <input
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-24 rounded-lg px-2 py-1 text-right font-manrope text-[13px] font-bold focus:outline-none border-2"
          style={{ borderColor: C.ember, color: C.ink }}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        />
        <button type="button" onClick={clear}
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: C.border }}>
          <X className="h-3 w-3" style={{ color: C.muted }} />
        </button>
        <button type="button" onClick={save}
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: C.ember }}>
          <Check className="h-3 w-3 text-white" />
        </button>
      </div>
    )
  }

  return (
    <button type="button" onClick={open}
      className="flex flex-col items-end gap-0.5 group">
      {modified && (
        <span className="font-inter text-[10px] line-through" style={{ color: C.border }}>
          {fmt(calc)}
        </span>
      )}
      <div className="flex items-center gap-1">
        <span className="font-manrope text-[14px] font-bold" style={{ color: modified ? C.ember : C.ink }}>
          {fmt(final)}
        </span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: C.muted }} />
      </div>
    </button>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ color, label, subtotal }: { color: string; label: string; subtotal: number }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ background: color }} />
        <p className="font-inter text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
          {label}
        </p>
      </div>
      <p className="font-manrope text-[12px] font-bold" style={{ color: C.muted }}>
        {fmt(subtotal)}
      </p>
    </div>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AsadosListaComprasMockup() {
  const [overrides, setOverrides] = useState<Record<string, number | null>>({})
  const [expandAcomp, setExpandAcomp] = useState(new Set(['ensalada']))
  const [copiado, setCopiado] = useState(false)

  function setOverride(id: string, v: number | null) {
    setOverrides(o => ({ ...o, [id]: v }))
  }

  function getFinal(item: ItemCorte) {
    return overrides[item.id] ?? item.totalCalc
  }

  const totalCarnes = CARNES.reduce((s, c) => s + getFinal(c), 0)
  const totalAcomp  = ACOMPS.reduce((s, a) => s + a.costo, 0)
  const totalOtros  = OTROS.reduce((s, o) => s + o.precio, 0)
  const total       = totalCarnes + totalAcomp + totalOtros

  const porAdulto   = ASADO.ponderado > 0 ? Math.ceil(total / ASADO.ponderado) : 0
  const porNino     = Math.ceil(porAdulto / 2)

  function handleCopiar() {
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="min-h-screen pb-36" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Header resumen */}
        <div className="px-4 pt-8 pb-4">
          <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: C.muted }}>
            Paso 4 de 4 · Lista de compras
          </p>
          <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>
            {ASADO.nombre}
          </h1>
          <p className="font-inter text-[12px] mt-0.5" style={{ color: C.muted }}>
            {ASADO.fecha} · {ASADO.adultos}A + {ASADO.ninos}N
          </p>
        </div>

        {/* Tarjeta de resumen financiero */}
        <div className="mx-4 mb-5 rounded-2xl overflow-hidden"
          style={{ background: C.ink }}>
          {/* Total */}
          <div className="px-5 pt-4 pb-3 flex items-start justify-between">
            <div>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                Total estimado
              </p>
              <p className="font-manrope text-3xl font-bold text-white mt-0.5">
                {fmt(total)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-inter text-[10px] uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                Diferenciado
              </p>
            </div>
          </div>
          {/* Cobro por persona */}
          <div className="grid grid-cols-2 divide-x mx-4 mb-4 rounded-xl overflow-hidden"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', divideColor: 'rgba(255,255,255,0.1)' }}>
            <div className="px-4 py-3">
              <p className="font-inter text-[10px] uppercase tracking-wide"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                Por adulto
              </p>
              <p className="font-manrope text-[17px] font-bold mt-0.5" style={{ color: C.ember }}>
                {fmt(porAdulto)}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="font-inter text-[10px] uppercase tracking-wide"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                Por niño
              </p>
              <p className="font-manrope text-[17px] font-bold mt-0.5" style={{ color: C.ember }}>
                {fmt(porNino)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-5">

          {/* ── CARNES ── */}
          <section>
            <SectionHeader color={C.ember} label="Carnes" subtotal={totalCarnes} />
            <div className="rounded-xl overflow-hidden"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              {CARNES.map((item, i) => {
                const isReceta = item.tipo === 'receta'
                const expanded = expandAcomp.has(item.id)
                return (
                  <div key={item.id} className={i > 0 ? 'border-t' : ''}
                    style={{ borderColor: C.border }}>
                    {/* Row principal */}
                    <div className="px-4 py-3 flex items-start gap-3">
                      {/* Left border por tipo */}
                      <div className="relative flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
                            {item.nombre}
                          </p>
                          <span className="font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                            style={{
                              background: isReceta ? C.softR : C.soft,
                              color: isReceta ? C.recipe : C.ember,
                            }}>
                            {isReceta ? 'receta' : 'corte'}
                          </span>
                          {isReceta && (
                            <button type="button"
                              onClick={() => setExpandAcomp(s => { const n = new Set(s); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n })}
                              className="flex h-5 w-5 items-center justify-center rounded-md"
                              style={{ background: expanded ? C.softR : '#F5F3F0' }}>
                              {expanded
                                ? <ChevronUp   className="h-3 w-3" style={{ color: C.recipe }} />
                                : <ChevronDown className="h-3 w-3" style={{ color: C.muted }} />}
                            </button>
                          )}
                        </div>
                        <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                          {isReceta ? `23 porciones` : `${item.kg} kg`}
                          {item.lugar && ` · ${item.lugar}`}
                          {!isReceta && item.precioKg > 0 && ` · ${fmt(item.precioKg)}/kg`}
                        </p>
                      </div>
                      <PrecioCell
                        id={item.id}
                        calc={item.totalCalc}
                        override={overrides[item.id] ?? null}
                        onChange={setOverride}
                      />
                    </div>

                    {/* Ingredientes de receta */}
                    {isReceta && expanded && item.ingredientes && (
                      <div className="mx-3 mb-3 rounded-lg overflow-hidden"
                        style={{ background: C.softR, border: `1px solid ${C.border}` }}>
                        {item.ingredientes.map((ing, j) => (
                          <div key={j} className={`flex items-center px-3 py-2 ${j > 0 ? 'border-t' : ''}`}
                            style={{ borderColor: C.border }}>
                            <p className="flex-1 font-inter text-[12px]" style={{ color: C.ink }}>
                              {ing.nombre}
                              {ing.esCorte && (
                                <span className="ml-1.5 font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                                  style={{ background: C.soft, color: C.ember }}>corte</span>
                              )}
                            </p>
                            <p className="font-manrope text-[12px] font-bold" style={{ color: C.ink }}>
                              {ing.cantidad}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── ACOMPAÑAMIENTOS ── */}
          <section>
            <SectionHeader color={C.recipe} label="Acompañamientos" subtotal={totalAcomp} />
            <div className="rounded-xl overflow-hidden"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              {ACOMPS.map((item, i) => {
                const exp = expandAcomp.has(item.id)
                return (
                  <div key={item.id} className={i > 0 ? 'border-t' : ''} style={{ borderColor: C.border }}>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>{item.nombre}</p>
                          <button type="button"
                            onClick={() => setExpandAcomp(s => { const n = new Set(s); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n })}
                            className="flex h-5 w-5 items-center justify-center rounded-md"
                            style={{ background: exp ? C.softR : '#F5F3F0' }}>
                            {exp
                              ? <ChevronUp   className="h-3 w-3" style={{ color: C.recipe }} />
                              : <ChevronDown className="h-3 w-3" style={{ color: C.muted }} />}
                          </button>
                        </div>
                        {!exp && (
                          <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                            {item.ingredientes.map(i => i.nombre).join(' · ')}
                          </p>
                        )}
                      </div>
                      <p className="font-manrope text-[14px] font-bold" style={{ color: C.recipe }}>
                        {fmt(item.costo)}
                      </p>
                    </div>
                    {exp && (
                      <div className="mx-3 mb-3 rounded-lg overflow-hidden"
                        style={{ background: C.softR, border: `1px solid ${C.border}` }}>
                        {item.ingredientes.map((ing, j) => (
                          <div key={j} className={`flex px-3 py-2 ${j > 0 ? 'border-t' : ''}`}
                            style={{ borderColor: C.border }}>
                            <p className="flex-1 font-inter text-[12px]" style={{ color: C.ink }}>{ing.nombre}</p>
                            <p className="font-manrope text-[12px] font-bold" style={{ color: C.ink }}>{ing.cantidad}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── OTROS ── */}
          <section>
            <SectionHeader color={C.muted} label="Otros" subtotal={totalOtros} />
            <div className="rounded-xl overflow-hidden"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              {OTROS.map((item, i) => (
                <div key={item.id} className={`px-4 py-3 flex items-center gap-3 ${i > 0 ? 'border-t' : ''}`}
                  style={{ borderColor: C.border }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>{item.descripcion}</p>
                    <p className="font-inter text-[11px]" style={{ color: C.muted }}>{item.cantidad}</p>
                  </div>
                  <p className="font-manrope text-[14px] font-bold" style={{ color: C.ink }}>{fmt(item.precio)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Nota precio manual */}
          <p className="font-inter text-[11px] text-center" style={{ color: C.border }}>
            Toca cualquier precio para ajustarlo manualmente
          </p>

        </div>
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0"
        style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-md mx-auto px-4 py-3 flex flex-col gap-2">
          <button type="button" onClick={handleCopiar}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-manrope text-[13px] font-bold transition-colors"
            style={{
              background: copiado ? C.softG : C.softR,
              color:      copiado ? C.green : C.recipe,
              border:     `1.5px solid ${copiado ? C.green : C.recipe}`,
            }}>
            {copiado
              ? <><Check className="h-4 w-4" /> ¡Copiado!</>
              : <><MessageCircle className="h-4 w-4" /> Copiar lista para WhatsApp</>}
          </button>
          <button type="button"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-manrope text-[13px] font-bold text-white"
            style={{ background: C.ember }}>
            <Save className="h-4 w-4" />
            Guardar asado
          </button>
        </div>
      </div>
    </div>
  )
}
