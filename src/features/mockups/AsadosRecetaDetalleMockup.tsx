// MOCKUP — App Asados · Receta detalle
// Aplica para recetas de carne (con cortes como ingredientes) y acompañamientos
import { useState } from 'react'
import { ChevronLeft, Minus, Plus, Users, ChevronDown, ChevronUp, Camera, X } from 'lucide-react'

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

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-CL') }

type Receta = {
  id: string
  nombre: string
  categoria: 'carne' | 'ensalada' | 'salsa' | 'guarnicion'
  catLabel: string
  desc: string
  personas_base: number
  notas?: string
  instrucciones?: string
  fotoGradient?: string   // gradient CSS para simular foto en el mockup
  ingredientes: {
    nombre: string
    cantidad: number
    unidad: string
    esCorte: boolean
    precioUnit: number
  }[]
}

const RECETAS: Record<string, Receta> = {
  entrana_trenz: {
    id: 'entrana_trenz',
    nombre: 'Entraña trenzada',
    categoria: 'carne',
    catLabel: 'Receta de carne',
    desc: 'Entraña limpia con técnica de trenzado para cocción pareja y presentación vistosa.',
    personas_base: 10,
    fotoGradient: 'linear-gradient(135deg, #3D1A08 0%, #7A2E0A 30%, #C4541A 60%, #8B3A12 80%, #2A1005 100%)',
    notas: 'Pedir entraña sin membrana. Se puede preparar el día anterior y refrigerar ya trenzada.',
    instrucciones: 'Limpiar la entraña retirando la membrana exterior. Realizar cortes longitudinales sin separar y trenzar. Sazonar con sal gruesa justo antes de la parrilla.',
    ingredientes: [
      { nombre: 'Entraña',    cantidad: 2.8,  unidad: 'kg',    esCorte: true,  precioUnit: 14200 },
      { nombre: 'Sal gruesa', cantidad: 80,   unidad: 'g',     esCorte: false, precioUnit: 0.8   },
    ],
  },
  malaya_pizza: {
    id: 'malaya_pizza',
    nombre: 'Malaya pizza',
    categoria: 'carne',
    catLabel: 'Receta de carne',
    desc: 'Malaya abierta y rellena con tomate, queso y tocino. Se enrolla y sella en la parrilla.',
    personas_base: 10,
    fotoGradient: 'linear-gradient(135deg, #1A0A00 0%, #5C2209 25%, #9B3D15 50%, #C4541A 70%, #3D1205 100%)',
    notas: 'Pedir malaya bien abierta en la carnicería. El queso derretido es clave — tapar los últimos 5 min.',
    instrucciones: 'Abrir la malaya en libro. Cubrir con láminas de tomate, queso y tiras de tocino. Enrollar y atar con hilo. Sellar a fuego alto y terminar a fuego medio.',
    ingredientes: [
      { nombre: 'Malaya',  cantidad: 2.2,  unidad: 'kg',  esCorte: true,  precioUnit: 8900  },
      { nombre: 'Tomate',  cantidad: 0.6,  unidad: 'kg',  esCorte: false, precioUnit: 1800  },
      { nombre: 'Queso',   cantidad: 0.3,  unidad: 'kg',  esCorte: false, precioUnit: 9500  },
      { nombre: 'Tocino',  cantidad: 0.2,  unidad: 'kg',  esCorte: false, precioUnit: 12000 },
    ],
  },
  ensalada: {
    id: 'ensalada',
    nombre: 'Ensalada chilena',
    categoria: 'ensalada',
    catLabel: 'Ensalada',
    desc: 'Clásica con tomate, cebolla en pluma y cilantro. Se macera la cebolla para suavizarla.',
    personas_base: 10,
    // sin fotoGradient → muestra placeholder "Agregar foto"
    notas: 'Macerar la cebolla con sal 10 min y enjuagar antes de agregar. Condimentar justo antes de servir.',
    instrucciones: 'Cortar tomates en gajos. Cortar cebolla en pluma fina, macerar con sal y enjuagar. Mezclar con cilantro picado, sal, aceite y limón.',
    ingredientes: [
      { nombre: 'Tomate',   cantidad: 1.2,  unidad: 'kg',    esCorte: false, precioUnit: 1800 },
      { nombre: 'Cebolla',  cantidad: 0.6,  unidad: 'kg',    esCorte: false, precioUnit: 1200 },
      { nombre: 'Cilantro', cantidad: 1,    unidad: 'atado', esCorte: false, precioUnit: 900  },
      { nombre: 'Limón',    cantidad: 3,    unidad: 'un',    esCorte: false, precioUnit: 200  },
    ],
  },
}

// ─── Helpers de escalado ──────────────────────────────────────────────────────

function escalar(cantidad: number, base: number, target: number) {
  return cantidad * target / base
}

function formatCant(cantidad: number, unidad: string): string {
  if (unidad === 'kg') {
    const v = Math.ceil(cantidad * 2) / 2
    return `${v.toFixed(v % 1 === 0 ? 0 : 1)} kg`
  }
  if (unidad === 'g') return `${Math.round(cantidad / 10) * 10} g`
  if (unidad === 'atado') return `${Math.ceil(cantidad)} atado${Math.ceil(cantidad) > 1 ? 's' : ''}`
  if (unidad === 'un') return `${Math.ceil(cantidad)} un`
  return `${cantidad} ${unidad}`
}

function costIng(cantidad: number, unidad: string, precioUnit: number): number {
  if (unidad === 'kg') return cantidad * precioUnit
  if (unidad === 'g') return (cantidad / 1000) * precioUnit
  if (unidad === 'atado' || unidad === 'un') return Math.ceil(cantidad) * precioUnit
  return cantidad * precioUnit
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AsadosRecetaDetalleMockup() {
  const [recetaId, setRecetaId] = useState<string>('entrana_trenz')
  const receta = RECETAS[recetaId]

  const [personas, setPersonas]   = useState(23)
  const [showInstr, setShowInstr] = useState(false)

  // foto: null = usa lo que venga del data, true = forzar con foto, false = forzar sin foto
  // En el mockup usamos el estado para simular "eliminar" la foto
  const [fotoRemovida, setFotoRemovida] = useState<Record<string, boolean>>({})
  const tieneFoto = receta.fotoGradient && !fotoRemovida[receta.id]

  const esCarne    = receta.categoria === 'carne'
  const accentColor = esCarne ? C.ember : C.recipe
  const softBg      = esCarne ? C.soft  : C.softR

  const ingredientesEscalados = receta.ingredientes.map(ing => ({
    ...ing,
    cantEscalada: escalar(ing.cantidad, receta.personas_base, personas),
  }))

  const costoTotal = ingredientesEscalados.reduce((s, ing) =>
    s + costIng(ing.cantEscalada, ing.unidad, ing.precioUnit), 0)

  const costoPorPersona = personas > 0 ? costoTotal / personas : 0

  return (
    <div className="min-h-screen pb-8" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Selector de receta (solo para el mockup) */}
        <div className="flex gap-1.5 px-4 pt-6 pb-0">
          {Object.values(RECETAS).map(r => (
            <button key={r.id} type="button" onClick={() => setRecetaId(r.id)}
              className="flex-1 font-inter text-[10px] font-semibold px-2 py-1.5 rounded-lg truncate"
              style={{
                background: recetaId === r.id ? C.ink : C.card,
                color:      recetaId === r.id ? '#FFF' : C.muted,
                boxShadow:  recetaId === r.id ? 'none' : '0 1px 3px rgba(28,26,23,0.07)',
              }}>
              {r.nombre}
            </button>
          ))}
        </div>
        <p className="font-inter text-[9px] text-center mt-1 mb-2" style={{ color: C.border }}>
          selector solo en mockup
        </p>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-1">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.card, boxShadow: '0 1px 3px rgba(28,26,23,0.1)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: C.muted }} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-manrope text-xl font-bold truncate" style={{ color: C.ink }}>
                {receta.nombre}
              </h1>
              <span className="shrink-0 font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ background: softBg, color: accentColor }}>
                {receta.catLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-4 mt-3">

          {/* ── Foto de referencia ────────────────────────────────────────── */}
          {tieneFoto ? (
            <div className="relative rounded-2xl overflow-hidden"
              style={{ height: 180, background: receta.fotoGradient }}>
              {/* grain overlay para simular textura fotográfica */}
              <div className="absolute inset-0"
                style={{ background: 'rgba(28,26,23,0.18)' }} />
              {/* etiqueta */}
              <div className="absolute bottom-3 left-3">
                <span className="font-inter text-[10px] font-semibold text-white/70 uppercase tracking-widest">
                  Foto de referencia
                </span>
              </div>
              {/* botones: cambiar + eliminar */}
              <div className="absolute top-3 right-3 flex gap-1.5">
                <button type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-inter text-[11px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', color: '#FFF' }}>
                  <Camera className="h-3.5 w-3.5" />
                  Cambiar
                </button>
                <button type="button"
                  onClick={() => setFotoRemovida(p => ({ ...p, [receta.id]: true }))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}>
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          ) : (
            /* Placeholder vacío */
            <button type="button"
              onClick={() => setFotoRemovida(p => ({ ...p, [receta.id]: false }))}
              className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-7 transition-colors"
              style={{
                border: `1.5px dashed ${C.border}`,
                background: C.card,
              }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: softBg }}>
                <Camera className="h-5 w-5" style={{ color: accentColor }} />
              </div>
              <div className="text-center">
                <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
                  Agregar foto de referencia
                </p>
                <p className="font-inter text-[11px] mt-0.5" style={{ color: C.muted }}>
                  Útil para recordar la presentación
                </p>
              </div>
            </button>
          )}

          {/* Descripción */}
          <p className="font-inter text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {receta.desc}
          </p>

          {/* Scaler de personas */}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: accentColor }} />
              <p className="font-inter text-[12px] font-semibold" style={{ color: C.muted }}>
                Escalar para
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPersonas(p => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: C.border }}>
                <Minus className="h-3.5 w-3.5" style={{ color: C.muted }} />
              </button>
              <span className="font-manrope text-[18px] font-bold w-10 text-center" style={{ color: C.ink }}>
                {personas}
              </span>
              <button type="button" onClick={() => setPersonas(p => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: accentColor }}>
                <Plus className="h-3.5 w-3.5 text-white" />
              </button>
              <p className="font-inter text-[12px]" style={{ color: C.muted }}>personas</p>
            </div>
          </div>

          {/* Ingredientes escalados */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Ingredientes
            </p>
            <div className="rounded-xl overflow-hidden"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              {ingredientesEscalados.map((ing, i) => {
                const costo = costIng(ing.cantEscalada, ing.unidad, ing.precioUnit)
                return (
                  <div key={i} className={`flex items-center px-4 py-3.5 ${i > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: C.border }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
                          {ing.nombre}
                        </p>
                        {ing.esCorte && (
                          <span className="font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                            style={{ background: C.soft, color: C.ember }}>
                            corte
                          </span>
                        )}
                      </div>
                      {ing.precioUnit > 0 && (
                        <p className="font-inter text-[11px] mt-0.5" style={{ color: C.border }}>
                          {ing.unidad === 'kg'    ? `${fmt(ing.precioUnit)}/kg`    :
                           ing.unidad === 'atado' ? `${fmt(ing.precioUnit)}/atado` :
                           ing.unidad === 'un'    ? `${fmt(ing.precioUnit)}/un`    : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-manrope text-[14px] font-bold" style={{ color: C.ink }}>
                        {formatCant(ing.cantEscalada, ing.unidad)}
                      </p>
                      {costo > 0 && (
                        <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                          {fmt(costo)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Subtotal */}
              <div className="flex items-center justify-between px-4 py-3 border-t"
                style={{ borderColor: C.border, background: softBg }}>
                <div>
                  <p className="font-inter text-[11px] font-semibold" style={{ color: accentColor }}>
                    Costo total
                  </p>
                  <p className="font-inter text-[10px]" style={{ color: C.muted }}>
                    {fmt(Math.round(costoPorPersona))}/persona
                  </p>
                </div>
                <p className="font-manrope text-[18px] font-bold" style={{ color: accentColor }}>
                  {fmt(costoTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Preparación (colapsable) */}
          {receta.instrucciones && (
            <div>
              <button type="button" onClick={() => setShowInstr(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
                <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: C.muted }}>
                  Preparación
                </p>
                {showInstr
                  ? <ChevronUp   className="h-4 w-4" style={{ color: C.muted }} />
                  : <ChevronDown className="h-4 w-4" style={{ color: C.muted }} />}
              </button>
              {showInstr && (
                <div className="mt-1 px-4 py-3 rounded-xl"
                  style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
                  <p className="font-inter text-[13px] leading-relaxed" style={{ color: C.ink }}>
                    {receta.instrucciones}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          {receta.notas && (
            <div className="rounded-xl px-4 py-3"
              style={{ background: softBg, border: `1px solid ${C.border}` }}>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: accentColor }}>
                Notas
              </p>
              <p className="font-inter text-[12px] leading-relaxed" style={{ color: C.ink }}>
                {receta.notas}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
