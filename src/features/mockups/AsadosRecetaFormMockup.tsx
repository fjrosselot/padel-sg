// MOCKUP — App Asados · Crear / editar receta
import { useState } from 'react'
import { ChevronLeft, Camera, Plus, X, Check, Trash2 } from 'lucide-react'

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
}

type Categoria = 'carne' | 'ensalada' | 'salsa' | 'guarnicion' | 'postre' | 'otro'

const CATS: { id: Categoria; label: string }[] = [
  { id: 'carne',     label: 'Carne'      },
  { id: 'ensalada',  label: 'Ensalada'   },
  { id: 'salsa',     label: 'Salsa'      },
  { id: 'guarnicion',label: 'Guarnición' },
  { id: 'postre',    label: 'Postre'     },
  { id: 'otro',      label: 'Otro'       },
]

const UNIDADES = ['kg', 'g', 'un', 'lt', 'ml', 'taza', 'cda', 'cdta', 'atado', 'paq']

type Ingrediente = {
  id: string
  nombre: string
  cantidad: string
  unidad: string
  esCorte: boolean
}

let nextId = 10

const INIT_INGS: Ingrediente[] = [
  { id: '1', nombre: 'Tomate',    cantidad: '0.5', unidad: 'kg',    esCorte: false },
  { id: '2', nombre: 'Cebolla',   cantidad: '0.3', unidad: 'kg',    esCorte: false },
  { id: '3', nombre: 'Cilantro',  cantidad: '1',   unidad: 'atado', esCorte: false },
  { id: '4', nombre: 'Ají verde', cantidad: '2',   unidad: 'un',    esCorte: false },
  { id: '5', nombre: 'Limón',     cantidad: '2',   unidad: 'un',    esCorte: false },
]

export default function AsadosRecetaFormMockup() {
  const [nombre,   setNombre]   = useState('Pebre')
  const [cat,      setCat]      = useState<Categoria>('salsa')
  const [personas, setPersonas] = useState(10)
  const [ings,     setIngs]     = useState<Ingrediente[]>(INIT_INGS)
  const [instruc,  setInstruc]  = useState('')
  const [notas,    setNotas]    = useState('')
  const [saved,    setSaved]    = useState(false)
  const [showIns,  setShowIns]  = useState(false)

  // New ingredient form
  const [newIng, setNewIng] = useState<Omit<Ingrediente, 'id'>>({ nombre: '', cantidad: '', unidad: 'kg', esCorte: false })
  const [addingIng, setAddingIng] = useState(false)

  function addIng() {
    if (!newIng.nombre.trim()) return
    setIngs(p => [...p, { ...newIng, id: String(nextId++) }])
    setNewIng({ nombre: '', cantidad: '', unidad: 'kg', esCorte: false })
    setAddingIng(false)
  }
  function removeIng(id: string) {
    setIngs(p => p.filter(ing => ing.id !== id))
  }
  function updateIng(id: string, field: keyof Ingrediente, val: string | boolean) {
    setIngs(p => p.map(ing => ing.id === id ? { ...ing, [field]: val } : ing))
  }

  const esCarne     = cat === 'carne'
  const accentColor = esCarne ? C.ember : C.recipe
  const softBg      = esCarne ? C.soft  : C.softR
  const isValid     = nombre.trim().length > 0 && ings.length > 0

  return (
    <div className="min-h-screen pb-28" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-8 pb-1">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.card, boxShadow: '0 1px 3px rgba(28,26,23,0.1)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: C.muted }} />
          </button>
          <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>
            {nombre.trim() || 'Nueva receta'}
          </h1>
        </div>

        <div className="px-4 space-y-5 mt-4">

          {/* Nombre */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Nombre
            </p>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Ensalada chilena, Pebre, Pan de ajo…"
              className="w-full rounded-xl px-4 py-3 font-manrope text-[15px] font-bold focus:outline-none"
              style={{
                background: C.card,
                color: C.ink,
                border: `2px solid ${nombre.trim() ? accentColor : C.border}`,
                boxShadow: '0 1px 4px rgba(28,26,23,0.07)',
              }} />
          </div>

          {/* Categoría + Personas base */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: C.muted }}>
                Categoría
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CATS.map(c => (
                  <button key={c.id} type="button" onClick={() => setCat(c.id)}
                    className="font-inter text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: cat === c.id ? C.ink : C.card,
                      color:      cat === c.id ? '#FFF' : C.muted,
                      boxShadow:  cat === c.id ? 'none' : '0 1px 3px rgba(28,26,23,0.07)',
                    }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: C.muted }}>
                Personas base
              </p>
              <div className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
                <button type="button" onClick={() => setPersonas(p => Math.max(1, p - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: C.border }}>
                  <X className="h-3 w-3" style={{ color: C.muted }} />
                </button>
                <span className="font-manrope text-[18px] font-bold" style={{ color: C.ink }}>
                  {personas}
                </span>
                <button type="button" onClick={() => setPersonas(p => p + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: accentColor }}>
                  <Plus className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Foto */}
          <button type="button"
            className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-6 transition-colors"
            style={{ border: `1.5px dashed ${C.border}`, background: C.card }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: softBg }}>
              <Camera className="h-5 w-5" style={{ color: accentColor }} />
            </div>
            <div className="text-center">
              <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
                Agregar foto de referencia
              </p>
              <p className="font-inter text-[11px] mt-0.5" style={{ color: C.muted }}>
                Opcional — para recordar la presentación
              </p>
            </div>
          </button>

          {/* Ingredientes */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Ingredientes (para {personas} personas)
            </p>
            <div className="rounded-xl overflow-hidden"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              {ings.map((ing, i) => (
                <div key={ing.id} className={`flex items-center gap-2 px-3 py-3 ${i > 0 ? 'border-t' : ''}`}
                  style={{ borderColor: C.border }}>
                  {/* nombre */}
                  <input type="text" value={ing.nombre}
                    onChange={e => updateIng(ing.id, 'nombre', e.target.value)}
                    className="flex-1 font-manrope text-[13px] font-bold bg-transparent focus:outline-none min-w-0"
                    style={{ color: C.ink }} />
                  {/* cantidad */}
                  <input type="text" value={ing.cantidad}
                    onChange={e => updateIng(ing.id, 'cantidad', e.target.value)}
                    className="w-10 font-inter text-[12px] text-center bg-transparent focus:outline-none rounded"
                    style={{ color: C.ink, border: `1px solid ${C.border}` }} />
                  {/* unidad */}
                  <select value={ing.unidad}
                    onChange={e => updateIng(ing.id, 'unidad', e.target.value)}
                    className="font-inter text-[11px] bg-transparent focus:outline-none rounded px-1"
                    style={{ color: C.muted, border: `1px solid ${C.border}` }}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  {/* esCorte toggle */}
                  <button type="button" onClick={() => updateIng(ing.id, 'esCorte', !ing.esCorte)}
                    className="shrink-0 font-inter text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: ing.esCorte ? C.soft   : C.border,
                      color:      ing.esCorte ? C.ember  : C.muted,
                    }}>
                    corte
                  </button>
                  {/* remove */}
                  <button type="button" onClick={() => removeIng(ing.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: C.border }}>
                    <X className="h-3 w-3" style={{ color: C.muted }} />
                  </button>
                </div>
              ))}

              {/* Add ingredient inline */}
              {addingIng ? (
                <div className="flex items-center gap-2 px-3 py-3 border-t" style={{ borderColor: C.border }}>
                  <input type="text" value={newIng.nombre} autoFocus
                    onChange={e => setNewIng(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ingrediente…"
                    className="flex-1 font-inter text-[13px] bg-transparent focus:outline-none"
                    style={{ color: C.ink }} />
                  <input type="text" value={newIng.cantidad}
                    onChange={e => setNewIng(p => ({ ...p, cantidad: e.target.value }))}
                    placeholder="Cant."
                    className="w-10 font-inter text-[12px] text-center bg-transparent focus:outline-none rounded"
                    style={{ color: C.ink, border: `1px solid ${C.border}` }} />
                  <select value={newIng.unidad}
                    onChange={e => setNewIng(p => ({ ...p, unidad: e.target.value }))}
                    className="font-inter text-[11px] bg-transparent focus:outline-none rounded px-1"
                    style={{ color: C.muted, border: `1px solid ${C.border}` }}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button type="button" onClick={addIng}
                    className="flex h-6 w-6 items-center justify-center rounded"
                    style={{ background: accentColor }}>
                    <Check className="h-3 w-3 text-white" />
                  </button>
                  <button type="button" onClick={() => setAddingIng(false)}
                    className="flex h-6 w-6 items-center justify-center rounded"
                    style={{ background: C.border }}>
                    <X className="h-3 w-3" style={{ color: C.muted }} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingIng(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 border-t font-inter text-[12px] font-semibold"
                  style={{ borderColor: C.border, color: accentColor }}>
                  <Plus className="h-3.5 w-3.5" />
                  Agregar ingrediente
                </button>
              )}
            </div>
          </div>

          {/* Instrucciones colapsable */}
          <div>
            <button type="button" onClick={() => setShowIns(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: C.muted }}>
                Instrucciones {showIns ? '' : '(opcional)'}
              </p>
              <span className="font-inter text-[10px]" style={{ color: C.muted }}>
                {showIns ? '▲' : '▼'}
              </span>
            </button>
            {showIns && (
              <textarea value={instruc} onChange={e => setInstruc(e.target.value)} rows={4}
                placeholder="Pasos de preparación…"
                className="w-full mt-1 rounded-xl px-4 py-3 font-inter text-[13px] leading-relaxed resize-none focus:outline-none"
                style={{ background: C.card, color: C.ink, border: `1.5px solid ${instruc ? accentColor : C.border}` }} />
            )}
          </div>

          {/* Notas */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Notas (opcional)
            </p>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              placeholder="Tips, variaciones, advertencias…"
              className="w-full rounded-xl px-4 py-3 font-inter text-[13px] leading-relaxed resize-none focus:outline-none"
              style={{ background: C.card, color: C.ink, border: `1.5px solid ${notas ? accentColor : C.border}` }} />
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0"
        style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-md mx-auto px-4 py-4 flex gap-3">
          <button type="button"
            className="flex items-center justify-center h-12 w-12 rounded-xl shrink-0"
            style={{ background: C.border }}>
            <Trash2 className="h-4 w-4" style={{ color: C.muted }} />
          </button>
          <button type="button"
            className="flex-1 font-manrope text-[13px] font-bold rounded-xl"
            style={{ background: C.border, color: C.muted }}>
            Cancelar
          </button>
          <button type="button"
            disabled={!isValid}
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-manrope text-[13px] font-bold transition-all"
            style={{ background: saved ? '#22C55E' : isValid ? accentColor : C.border, color: '#FFF' }}>
            {saved ? <><Check className="h-4 w-4" /> Guardado</> : 'Guardar receta'}
          </button>
        </div>
      </div>
    </div>
  )
}
