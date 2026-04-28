// MOCKUP — App Asados · Wizard paso 3: Ítems libres (carbón, bebidas, extras)
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Minus, X, Check } from 'lucide-react'

const C = {
  bg:     '#FAF8F5',
  card:   '#FFFFFF',
  ink:    '#1C1A17',
  ember:  '#C4541A',
  muted:  '#8B7E74',
  soft:   '#FFF0E8',
  border: '#EDE8E3',
}

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-CL') }

type Sugerencia = { id: string; emoji: string; nombre: string; unidad: string; cantDefault: number; precioRef: number }

const SUGERENCIAS: Sugerencia[] = [
  { id: 'carbon',      emoji: '🔥', nombre: 'Carbón',          unidad: 'bolsas', cantDefault: 3, precioRef: 3000 },
  { id: 'pan',         emoji: '🍞', nombre: 'Marraquetas',     unidad: 'bolsas', cantDefault: 2, precioRef: 1800 },
  { id: 'vino',        emoji: '🍷', nombre: 'Vino',            unidad: 'bot.',   cantDefault: 4, precioRef: 5900 },
  { id: 'bebidas',     emoji: '🥤', nombre: 'Bebidas',         unidad: 'lt',     cantDefault: 6, precioRef: 1200 },
  { id: 'hielo',       emoji: '🧊', nombre: 'Hielo',           unidad: 'bolsas', cantDefault: 2, precioRef: 1500 },
  { id: 'cerveza',     emoji: '🍺', nombre: 'Cerveza',         unidad: 'pack',   cantDefault: 2, precioRef: 9900 },
  { id: 'salsas',      emoji: '🧴', nombre: 'Salsas',          unidad: 'un',     cantDefault: 3, precioRef: 2200 },
  { id: 'servilletas', emoji: '🗒️', nombre: 'Servilletas',     unidad: 'paq',    cantDefault: 2, precioRef: 900  },
  { id: 'papel_alum',  emoji: '🍫', nombre: 'Papel aluminio',  unidad: 'rollo',  cantDefault: 1, precioRef: 2800 },
]

type ItemAgregado = {
  id: string
  nombre: string
  unidad: string
  cant: number
  precio: number | null
  editingPrecio: boolean
  inputVal: string
}

let nextId = 100

export default function AsadosWizardItemsLibresMockup() {
  const [items, setItems]     = useState<ItemAgregado[]>([
    { id: 'pre1', nombre: 'Carbón',  unidad: 'bolsas', cant: 3, precio: 9000, editingPrecio: false, inputVal: '9000' },
    { id: 'pre2', nombre: 'Vino',    unidad: 'bot.',   cant: 4, precio: 23600, editingPrecio: false, inputVal: '23600' },
  ])
  const [agregados, setAgregados] = useState<Set<string>>(new Set(['carbon', 'vino']))
  const [customName, setCustomName] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  function addSugerencia(s: Sugerencia) {
    if (agregados.has(s.id)) return
    setItems(p => [...p, {
      id: `sug_${s.id}`,
      nombre: s.nombre,
      unidad: s.unidad,
      cant: s.cantDefault,
      precio: null,
      editingPrecio: false,
      inputVal: '',
    }])
    setAgregados(p => new Set([...p, s.id]))
  }

  function removeItem(id: string, sugId?: string) {
    setItems(p => p.filter(it => it.id !== id))
    if (sugId) setAgregados(p => { const n = new Set(p); n.delete(sugId); return n })
  }

  function setCant(id: string, v: number) {
    setItems(p => p.map(it => it.id === id ? { ...it, cant: Math.max(1, v) } : it))
  }

  function startPrecio(id: string) {
    setItems(p => p.map(it => it.id === id
      ? { ...it, editingPrecio: true, inputVal: String(it.precio ?? '') }
      : it))
  }
  function confirmPrecio(id: string) {
    const raw = items.find(it => it.id === id)!.inputVal
    const val = parseInt(raw.replace(/\D/g, ''), 10)
    setItems(p => p.map(it => it.id === id
      ? { ...it, precio: isNaN(val) ? null : val, editingPrecio: false }
      : it))
  }
  function cancelPrecio(id: string) {
    setItems(p => p.map(it => it.id === id ? { ...it, editingPrecio: false } : it))
  }

  function addCustom() {
    if (!customName.trim()) return
    setItems(p => [...p, {
      id: `custom_${nextId++}`,
      nombre: customName.trim(),
      unidad: 'un',
      cant: 1,
      precio: null,
      editingPrecio: false,
      inputVal: '',
    }])
    setCustomName('')
    setShowCustom(false)
  }

  const totalItems = items.reduce((s, it) => s + (it.precio ?? 0), 0)

  return (
    <div className="min-h-screen pb-28" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-8 pb-3">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.card, boxShadow: '0 1px 3px rgba(28,26,23,0.1)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: C.muted }} />
          </button>
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
              Paso 3 de 4
            </p>
            <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>Ítems y extras</h1>
          </div>
        </div>

        {/* Progress — 75% */}
        <div className="px-4 mb-5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div className="h-full rounded-full" style={{ width: '75%', background: C.ember }} />
          </div>
        </div>

        <div className="px-4 space-y-5">

          {/* Sugerencias rápidas */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2.5"
              style={{ color: C.muted }}>
              Agregar rápido
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGERENCIAS.map(s => {
                const ya = agregados.has(s.id)
                return (
                  <button key={s.id} type="button" onClick={() => addSugerencia(s)}
                    disabled={ya}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-inter text-[12px] font-semibold transition-colors"
                    style={{
                      background: ya ? C.border : C.card,
                      color:      ya ? C.muted  : C.ink,
                      boxShadow:  ya ? 'none' : '0 1px 3px rgba(28,26,23,0.08)',
                      opacity:    ya ? 0.5 : 1,
                    }}>
                    <span>{s.emoji}</span>
                    <span>{s.nombre}</span>
                    {ya
                      ? <Check className="h-3 w-3" style={{ color: C.muted }} />
                      : <Plus  className="h-3 w-3" style={{ color: C.ember }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lista de ítems agregados */}
          {items.length > 0 && (
            <div>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: C.muted }}>
                Agregados
              </p>
              <div className="rounded-xl overflow-hidden"
                style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
                {items.map((it, i) => (
                  <div key={it.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: C.border }}>

                    {/* nombre */}
                    <p className="flex-1 font-manrope text-[13px] font-bold truncate" style={{ color: C.ink }}>
                      {it.nombre}
                    </p>

                    {/* stepper */}
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setCant(it.id, it.cant - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: C.border }}>
                        <Minus className="h-3.5 w-3.5" style={{ color: C.muted }} />
                      </button>
                      <span className="font-manrope text-[14px] font-bold w-6 text-center" style={{ color: C.ink }}>
                        {it.cant}
                      </span>
                      <button type="button" onClick={() => setCant(it.id, it.cant + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: C.ember }}>
                        <Plus className="h-3.5 w-3.5 text-white" />
                      </button>
                      <span className="font-inter text-[10px] w-8" style={{ color: C.muted }}>{it.unidad}</span>
                    </div>

                    {/* precio */}
                    {it.editingPrecio ? (
                      <div className="flex items-center gap-1">
                        <div className="rounded-lg px-2 py-1 flex items-center"
                          style={{ border: `1.5px solid ${C.ember}`, background: C.bg }}>
                          <span className="font-inter text-[11px]" style={{ color: C.muted }}>$</span>
                          <input type="number" value={it.inputVal} autoFocus
                            onChange={e => setItems(p => p.map(x => x.id === it.id ? { ...x, inputVal: e.target.value } : x))}
                            className="w-16 font-manrope text-[12px] font-bold bg-transparent outline-none"
                            style={{ color: C.ink }} />
                        </div>
                        <button type="button" onClick={() => confirmPrecio(it.id)}
                          className="flex h-6 w-6 items-center justify-center rounded"
                          style={{ background: C.ember }}>
                          <Check className="h-3 w-3 text-white" />
                        </button>
                        <button type="button" onClick={() => cancelPrecio(it.id)}
                          className="flex h-6 w-6 items-center justify-center rounded"
                          style={{ background: C.border }}>
                          <X className="h-3 w-3" style={{ color: C.muted }} />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => startPrecio(it.id)}
                        className="min-w-[64px] text-right">
                        <p className="font-manrope text-[12px] font-bold"
                          style={{ color: it.precio ? C.ink : C.border }}>
                          {it.precio ? fmt(it.precio) : '+ precio'}
                        </p>
                      </button>
                    )}

                    {/* remove */}
                    {!it.editingPrecio && (
                      <button type="button"
                        onClick={() => {
                          const sugId = it.id.startsWith('sug_') ? it.id.replace('sug_', '') : undefined
                          removeItem(it.id, sugId)
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ background: C.border }}>
                        <X className="h-3 w-3" style={{ color: C.muted }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agregar ítem custom */}
          {showCustom ? (
            <div className="flex gap-2">
              <input type="text" value={customName} autoFocus
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                placeholder="Nombre del ítem libre…"
                className="flex-1 rounded-xl px-4 py-3 font-inter text-[13px] focus:outline-none"
                style={{ background: C.card, border: `1.5px solid ${C.ember}`, color: C.ink }} />
              <button type="button" onClick={addCustom}
                className="px-4 py-3 rounded-xl font-inter text-[12px] font-semibold"
                style={{ background: C.ember, color: '#FFF' }}>
                Agregar
              </button>
              <button type="button" onClick={() => setShowCustom(false)}
                className="px-3 py-3 rounded-xl"
                style={{ background: C.border }}>
                <X className="h-4 w-4" style={{ color: C.muted }} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowCustom(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-inter text-[12px] font-semibold"
              style={{ border: `1.5px dashed ${C.border}`, color: C.muted }}>
              <Plus className="h-4 w-4" />
              Agregar ítem personalizado
            </button>
          )}

        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0"
        style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-inter text-[11px]" style={{ color: C.muted }}>
              {items.length} ítems extras
            </p>
            {totalItems > 0 && (
              <p className="font-manrope text-[13px] font-semibold" style={{ color: C.ink }}>
                {fmt(totalItems)} en extras
              </p>
            )}
          </div>
          <button type="button"
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-manrope text-[13px] font-bold text-white"
            style={{ background: C.ember }}>
            Ver lista de compras
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
