// MOCKUP — App Asados · Post-asado (paso 5)
import { useState } from 'react'
import { ChevronLeft, Check, X, TrendingUp, TrendingDown, Save } from 'lucide-react'

const C = {
  bg:        '#FAF8F5',
  card:      '#FFFFFF',
  ink:       '#1C1A17',
  ember:     '#C4541A',
  muted:     '#8B7E74',
  soft:      '#FFF0E8',
  border:    '#EDE8E3',
  green:     '#166534',
  greenSoft: '#DCFCE7',
}

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-CL') }

type EstadoItem = 'ok' | 'sobro' | 'falto'
type TipoItem   = 'corte' | 'receta' | 'otro'

type Item = { id: string; tipo: TipoItem; nombre: string; cantidad: string; estimado: number }

const ITEMS: Item[] = [
  { id:'1', tipo:'corte',  nombre:'Entraña trenzada', cantidad:'4 kg',     estimado: 56800 },
  { id:'2', tipo:'corte',  nombre:'Costillar',         cantidad:'7 kg',     estimado: 45500 },
  { id:'3', tipo:'receta', nombre:'Malaya pizza',      cantidad:'2.5 kg',   estimado: 28000 },
  { id:'4', tipo:'otro',   nombre:'Longaniza',         cantidad:'3 kg',     estimado: 21000 },
  { id:'5', tipo:'otro',   nombre:'Ensalada chilena',  cantidad:'23 p',     estimado: 8500  },
  { id:'6', tipo:'otro',   nombre:'Carbón',            cantidad:'3 bolsas', estimado: 9000  },
  { id:'7', tipo:'otro',   nombre:'Bebidas',           cantidad:'varias',   estimado: 22000 },
]

type IS = { real: number | null; editing: boolean; inputVal: string; estado: EstadoItem }

const ESTADO_CFG: Record<EstadoItem, { label: string; bg: string; color: string }> = {
  ok:    { label: '—',       bg: '#EDE8E3', color: '#8B7E74' },
  sobro: { label: '↑ Sobró', bg: '#DCFCE7', color: '#166534' },
  falto: { label: '↓ Faltó', bg: '#FFF0E8', color: '#C4541A' },
}

function initStates(): Record<string, IS> {
  return Object.fromEntries(ITEMS.map(it => [it.id, { real: null, editing: false, inputVal: '', estado: 'ok' as EstadoItem }]))
}

export default function AsadosPostAsadoMockup() {
  const [states, setStates] = useState<Record<string, IS>>(initStates)
  const [obs,    setObs]    = useState('')
  const [saved,  setSaved]  = useState(false)

  function startEdit(id: string) {
    const item = ITEMS.find(it => it.id === id)!
    setStates(p => ({ ...p, [id]: { ...p[id], editing: true, inputVal: String(p[id].real ?? item.estimado) } }))
  }
  function confirmEdit(id: string) {
    const val = parseInt(states[id].inputVal.replace(/\D/g, ''), 10)
    if (!isNaN(val) && val > 0)
      setStates(p => ({ ...p, [id]: { ...p[id], real: val, editing: false } }))
    else
      setStates(p => ({ ...p, [id]: { ...p[id], editing: false } }))
  }
  function cancelEdit(id: string) {
    setStates(p => ({ ...p, [id]: { ...p[id], editing: false } }))
  }
  function toggleEstado(id: string) {
    const next: EstadoItem = states[id].estado === 'ok' ? 'sobro' : states[id].estado === 'sobro' ? 'falto' : 'ok'
    setStates(p => ({ ...p, [id]: { ...p[id], estado: next } }))
  }

  const estimadoTotal = ITEMS.reduce((s, it) => s + it.estimado, 0)
  const realTotal     = ITEMS.reduce((s, it) => s + (states[it.id].real ?? it.estimado), 0)
  const delta         = realTotal - estimadoTotal
  const editedCount   = ITEMS.filter(it => states[it.id].real !== null).length

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
              Paso 5 de 5
            </p>
            <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>Post-asado</h1>
          </div>
        </div>

        {/* Progress — 100% */}
        <div className="px-4 mb-5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div className="h-full rounded-full" style={{ width: '100%', background: C.ember }} />
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* Delta card */}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{
              background: delta <= 0 ? C.greenSoft : C.soft,
              border: `1px solid ${delta <= 0 ? '#BBF7D0' : C.border}`,
            }}>
            <div>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: delta <= 0 ? C.green : C.ember }}>
                {delta <= 0 ? 'Ahorro vs. estimado' : 'Excedido vs. estimado'}
              </p>
              <p className="font-inter text-[11px] mt-0.5" style={{ color: C.muted }}>
                Estimado {fmt(estimadoTotal)} → Real {fmt(realTotal)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {delta <= 0
                ? <TrendingDown className="h-4 w-4" style={{ color: C.green }} />
                : <TrendingUp   className="h-4 w-4" style={{ color: C.ember }} />}
              <p className="font-manrope text-[20px] font-bold"
                style={{ color: delta <= 0 ? C.green : C.ember }}>
                {fmt(Math.abs(delta))}
              </p>
            </div>
          </div>

          {/* Items list */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Precio real · Sobró / Faltó
            </p>
            <div className="rounded-xl overflow-hidden"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              {ITEMS.map((it, i) => {
                const st  = states[it.id]
                const cfg = ESTADO_CFG[st.estado]
                const modificado = st.real !== null && st.real !== it.estimado
                return (
                  <div key={it.id} className={`px-4 py-3 ${i > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: C.border }}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-manrope text-[13px] font-bold truncate" style={{ color: C.ink }}>
                            {it.nombre}
                          </p>
                          {it.tipo !== 'otro' && (
                            <span className="shrink-0 font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                              style={{ background: C.soft, color: C.ember }}>
                              {it.tipo}
                            </span>
                          )}
                        </div>
                        <p className="font-inter text-[11px]" style={{ color: C.muted }}>{it.cantidad}</p>
                      </div>

                      {st.editing ? (
                        <div className="flex items-center gap-1">
                          <div className="rounded-lg px-2 py-1.5 flex items-center"
                            style={{ border: `1.5px solid ${C.ember}`, background: C.bg }}>
                            <span className="font-inter text-[11px]" style={{ color: C.muted }}>$</span>
                            <input type="number" value={st.inputVal} autoFocus
                              onChange={e => setStates(p => ({ ...p, [it.id]: { ...p[it.id], inputVal: e.target.value } }))}
                              className="w-20 font-manrope text-[13px] font-bold bg-transparent outline-none"
                              style={{ color: C.ink }} />
                          </div>
                          <button type="button" onClick={() => confirmEdit(it.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: C.ember }}>
                            <Check className="h-3.5 w-3.5 text-white" />
                          </button>
                          <button type="button" onClick={() => cancelEdit(it.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: C.border }}>
                            <X className="h-3.5 w-3.5" style={{ color: C.muted }} />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => startEdit(it.id)} className="text-right mr-2">
                          {modificado && (
                            <p className="font-inter text-[10px] line-through" style={{ color: C.border }}>
                              {fmt(it.estimado)}
                            </p>
                          )}
                          <p className="font-manrope text-[13px] font-bold"
                            style={{ color: st.real !== null ? C.ink : C.muted }}>
                            {fmt(st.real ?? it.estimado)}
                          </p>
                          {st.real === null && (
                            <p className="font-inter text-[9px]" style={{ color: C.border }}>estimado</p>
                          )}
                        </button>
                      )}

                      {!st.editing && (
                        <button type="button" onClick={() => toggleEstado(it.id)}
                          className="shrink-0 font-inter text-[10px] font-semibold px-2 py-1.5 rounded-lg transition-colors"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {editedCount > 0 && (
              <p className="font-inter text-[10px] mt-1.5 text-center" style={{ color: C.muted }}>
                {editedCount} de {ITEMS.length} precios actualizados
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Observaciones
            </p>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={4}
              placeholder="¿Qué sobró? ¿Qué faltó? ¿Qué cambiarías la próxima vez?"
              className="w-full rounded-xl px-4 py-3 font-inter text-[13px] leading-relaxed resize-none focus:outline-none"
              style={{
                background: C.card,
                color: C.ink,
                border: `1.5px solid ${obs.trim() ? C.ember : C.border}`,
                boxShadow: '0 1px 4px rgba(28,26,23,0.07)',
              }} />
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0"
        style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-md mx-auto px-4 py-4">
          <button type="button"
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-manrope text-[14px] font-bold transition-all"
            style={{ background: saved ? '#22C55E' : C.ember, color: '#FFF' }}>
            {saved
              ? <><Check className="h-4 w-4" /> ¡Asado registrado!</>
              : <><Save  className="h-4 w-4" /> Registrar asado</>}
          </button>
        </div>
      </div>
    </div>
  )
}
