# Fixtures, Brackets y Timeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar tres tabs (Fixture, Bracket, Horario) a TorneoDetalle para torneos con formato `americano_grupos`, manteniendo la vista `DesafioView` existente para `desafio_puntos`.

**Architecture:** Se extraen componentes de `FixtureView.tsx` (shared `PartidoRow`, `DesafioView`), se crean tres tabs nuevos (`FixtureTab`, `BracketTab`, `HorarioTab`), y `TorneoDetalle` se refactoriza para usar `@radix-ui/react-tabs`. Los datos ya existen en `CategoriaFixture`; no hay cambios de DB ni de motor de fixture.

**Tech Stack:** React 18, Tailwind CSS, @radix-ui/react-tabs, SVG inline (sin dependencias nuevas), TypeScript 6.

---

## File Map

| Archivo | Acción |
|---------|--------|
| `src/features/torneos/PartidoRow.tsx` | **Crear** — componente compartido extraído de FixtureView |
| `src/features/torneos/DesafioView.tsx` | **Crear** — extraído de FixtureView, solo `desafio_puntos` |
| `src/features/torneos/FixtureTab.tsx` | **Crear** — grupos + eliminatoria en lista para `americano_grupos` |
| `src/features/torneos/BracketTab.tsx` | **Crear** — árbol visual con SVG + Copa Plata |
| `src/features/torneos/HorarioTab.tsx` | **Crear** — grilla transpuesta canchas × tiempo |
| `src/features/torneos/FixtureView.tsx` | **Eliminar** — reemplazado por los tres componentes anteriores |
| `src/features/torneos/TorneoDetalle.tsx` | **Modificar** — agregar tabs, importar nuevos componentes |

---

## Task 1: PartidoRow — componente compartido

**Files:**
- Create: `src/features/torneos/PartidoRow.tsx`

- [ ] **Crear el archivo con el componente PartidoRow**

```tsx
// src/features/torneos/PartidoRow.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { PartidoFixture } from '../../lib/fixture/types'

interface Props {
  partido: PartidoFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
}

export default function PartidoRow({ partido, torneoId, isAdmin, onCargarResultado }: Props) {
  const qc = useQueryClient()

  const toggleBloqueo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .schema('padel')
        .from('partidos')
        .update({ resultado_bloqueado: !partido.resultado_bloqueado })
        .eq('id', partido.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', torneoId] }),
    onError: () => toast.error('No se pudo cambiar el bloqueo'),
  })

  const puedeCargar = isAdmin && !partido.resultado_bloqueado && !partido.ganador

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
      partido.ganador ? 'bg-surface-high' : 'bg-surface'
    }`}>
      <span className="text-muted w-14 shrink-0 font-inter text-xs">
        {partido.turno ?? '--:--'} C{partido.cancha ?? '?'}
      </span>
      <span className={`flex-1 text-right font-inter text-sm ${
        partido.ganador === 1 ? 'font-semibold text-navy' : 'text-slate'
      }`}>
        {partido.pareja1?.nombre ?? 'TBD'}
      </span>
      <span className="text-muted text-xs">vs</span>
      <span className={`flex-1 font-inter text-sm ${
        partido.ganador === 2 ? 'font-semibold text-navy' : 'text-slate'
      }`}>
        {partido.pareja2?.nombre ?? 'TBD'}
      </span>
      {partido.resultado && (
        <span className="text-muted text-xs w-16 text-right font-inter">{partido.resultado}</span>
      )}
      {puedeCargar && (
        <button
          type="button"
          onClick={() => onCargarResultado(partido)}
          className="text-xs text-gold hover:underline shrink-0 font-inter"
        >
          Cargar
        </button>
      )}
      {isAdmin && partido.ganador && (
        <button
          type="button"
          aria-label={partido.resultado_bloqueado ? 'Desbloquear resultado' : 'Bloquear resultado'}
          onClick={() => toggleBloqueo.mutate()}
          disabled={toggleBloqueo.isPending}
          className="shrink-0 text-muted hover:text-navy transition-colors disabled:opacity-50"
        >
          {partido.resultado_bloqueado
            ? <Lock className="h-3.5 w-3.5 text-defeat" />
            : <Unlock className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Verificar TypeScript**

```bash
cd "/home/francisco-rosselot/Documents/Proyectos Claude Code/padel-sg"
npx tsc --noEmit 2>&1 | head -20
```

Esperado: sin errores.

- [ ] **Commit**

```bash
git add src/features/torneos/PartidoRow.tsx
git commit -m "refactor: extract PartidoRow into shared component"
```

---

## Task 2: DesafioView — vista de desafío por puntos

**Files:**
- Create: `src/features/torneos/DesafioView.tsx`

- [ ] **Crear el archivo**

```tsx
// src/features/torneos/DesafioView.tsx
import PartidoRow from './PartidoRow'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

interface Props {
  categorias: CategoriaFixture[]
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  colegioRival?: string
}

function DesafioCategoria({
  categoria, torneoId, isAdmin, onCargarResultado, colegioRival,
}: {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (p: PartidoFixture) => void
  colegioRival?: string
}) {
  const partidos = categoria.partidos ?? []
  const sgPts = partidos.filter(p => p.ganador === 1).length
  const rivalPts = partidos.filter(p => p.ganador === 2).length
  const totalJugados = partidos.filter(p => p.ganador !== null).length

  return (
    <div className="space-y-4">
      <h3 className="font-manrope text-lg font-bold text-navy">{categoria.nombre}</h3>
      <div className="flex items-center justify-between rounded-xl bg-navy p-4">
        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-wide">SG</p>
          <p className="text-3xl font-bold text-gold">{sgPts}</p>
        </div>
        <div className="text-center text-white/40 text-xs">
          {totalJugados}/{partidos.length} jugados
        </div>
        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-wide">{colegioRival ?? 'Rival'}</p>
          <p className="text-3xl font-bold text-white">{rivalPts}</p>
        </div>
      </div>
      <div className="space-y-1">
        {partidos.map(p => (
          <PartidoRow
            key={p.id}
            partido={p}
            torneoId={torneoId}
            isAdmin={isAdmin}
            onCargarResultado={onCargarResultado}
          />
        ))}
      </div>
    </div>
  )
}

export default function DesafioView({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival }: Props) {
  return (
    <div className="space-y-8">
      {categorias.map(cat => (
        <DesafioCategoria
          key={cat.nombre}
          categoria={cat}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
          colegioRival={colegioRival}
        />
      ))}
    </div>
  )
}
```

- [ ] **Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
git add src/features/torneos/DesafioView.tsx
git commit -m "refactor: extract DesafioView as standalone component"
```

---

## Task 3: FixtureTab — lista de grupos y eliminatoria

**Files:**
- Create: `src/features/torneos/FixtureTab.tsx`

- [ ] **Crear el archivo**

```tsx
// src/features/torneos/FixtureTab.tsx
import { Badge } from '../../components/ui/badge'
import PartidoRow from './PartidoRow'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

const FASE_LABEL: Record<string, string> = {
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: 'Final',
  consolacion_cuartos: 'Cuartos Plata',
  consolacion_sf: 'SF Plata',
  consolacion_final: 'Final Plata',
}

interface Props {
  categorias: CategoriaFixture[]
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
}

function CategoriaFixtureSection({
  categoria, torneoId, isAdmin, onCargarResultado,
}: {
  categoria: CategoriaFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (p: PartidoFixture) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-manrope text-base font-bold text-navy">{categoria.nombre}</h3>

      {/* Grupos */}
      {categoria.grupos.map(g => (
        <div key={g.letra}>
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
            Grupo {g.letra}
          </p>
          <div className="space-y-1">
            {g.partidos.map(p => (
              <PartidoRow
                key={p.id}
                partido={p}
                torneoId={torneoId}
                isAdmin={isAdmin}
                onCargarResultado={onCargarResultado}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Eliminatoria */}
      {categoria.faseEliminatoria.length > 0 && (
        <div>
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
            Eliminatoria
          </p>
          <div className="space-y-1">
            {categoria.faseEliminatoria.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                  {FASE_LABEL[p.fase] ?? p.fase}
                </Badge>
                <PartidoRow
                  partido={p}
                  torneoId={torneoId}
                  isAdmin={isAdmin}
                  onCargarResultado={onCargarResultado}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copa Plata */}
      {categoria.consola.length > 0 && (
        <div>
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
            🥈 Copa Plata
          </p>
          <div className="space-y-1">
            {categoria.consola.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                  {FASE_LABEL[p.fase] ?? p.fase}
                </Badge>
                <PartidoRow
                  partido={p}
                  torneoId={torneoId}
                  isAdmin={isAdmin}
                  onCargarResultado={onCargarResultado}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FixtureTab({ categorias, torneoId, isAdmin, onCargarResultado }: Props) {
  if (categorias.length === 0) {
    return <p className="font-inter text-sm text-muted py-4">Sin categorías con fixture generado.</p>
  }
  return (
    <div className="space-y-8">
      {categorias.map(cat => (
        <CategoriaFixtureSection
          key={cat.nombre}
          categoria={cat}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
        />
      ))}
    </div>
  )
}
```

- [ ] **Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
git add src/features/torneos/FixtureTab.tsx
git commit -m "feat: add FixtureTab component for americano_grupos"
```

---

## Task 4: BracketTab — árbol visual con SVG

**Files:**
- Create: `src/features/torneos/BracketTab.tsx`

- [ ] **Crear el archivo**

```tsx
// src/features/torneos/BracketTab.tsx
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

const CARD_H = 72   // altura de cada match card en px
const CARD_GAP = 12 // separación entre cards
const SLOT = CARD_H + CARD_GAP

// Construye los paths SVG para conectar left con right
// leftCount matches → leftCount/2 matches
function connectorPaths(leftCount: number) {
  const rightCount = leftCount / 2
  const paths: string[] = []
  const dots: number[] = []

  for (let i = 0; i < rightCount; i++) {
    const topY = i * 2 * SLOT + CARD_H / 2
    const botY = (i * 2 + 1) * SLOT + CARD_H / 2
    const midY = (topY + botY) / 2
    paths.push(`M0,${topY} H24 V${midY} H48`)
    paths.push(`M0,${botY} H24 V${midY}`)
    dots.push(topY, botY)
  }
  return { paths, dots }
}

function BracketConnector({ leftCount, pending = false }: { leftCount: number; pending?: boolean }) {
  const svgH = leftCount * SLOT - CARD_GAP
  const { paths, dots } = connectorPaths(leftCount)
  const stroke = pending ? '#1e293b' : '#334155'
  const dotFill = pending ? '#334155' : '#F5C518'

  return (
    <svg width="48" height={svgH} viewBox={`0 0 48 ${svgH}`} fill="none" className="shrink-0">
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={stroke}
          strokeWidth="1.5"
          strokeDasharray={pending ? '4 3' : undefined}
        />
      ))}
      {dots.map((y, i) => (
        <circle key={i} cx={0} cy={y} r={3} fill={dotFill} />
      ))}
    </svg>
  )
}

function parseScores(resultado: string | null): [string, string] {
  if (!resultado) return ['—', '—']
  const parts = resultado.split('-')
  if (parts.length !== 2) return [resultado, '']
  return [parts[0].trim(), parts[1].trim()]
}

function BracketCard({ partido, isFinal = false }: { partido: PartidoFixture; isFinal?: boolean }) {
  const [s1, s2] = parseScores(partido.resultado)
  const win1 = partido.ganador === 1
  const win2 = partido.ganador === 2
  const pending = !partido.ganador

  return (
    <div
      className={`w-44 rounded-xl overflow-hidden border ${
        isFinal
          ? 'border-gold shadow-[0_0_0_3px_rgba(245,197,24,0.15)]'
          : 'border-navy/15'
      } bg-white`}
      style={{ height: CARD_H }}
    >
      {/* Pareja 1 */}
      <div className={`flex items-center justify-between px-2.5 py-1.5 gap-2 ${win1 ? 'bg-gold/8' : ''}`}
        style={{ height: (CARD_H - 1) / 2 }}>
        <span className={`font-inter text-[11px] flex-1 truncate ${
          pending ? 'text-muted italic' : win1 ? 'font-semibold text-navy' : 'text-slate'
        }`}>
          {partido.pareja1?.nombre ?? 'Por definir'}
        </span>
        <span className={`font-manrope text-sm font-bold shrink-0 ${win1 ? 'text-gold' : 'text-muted'}`}>
          {s1}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-high" />

      {/* Pareja 2 */}
      <div className={`flex items-center justify-between px-2.5 py-1.5 gap-2 ${win2 ? 'bg-gold/8' : ''}`}
        style={{ height: (CARD_H - 1) / 2 }}>
        <span className={`font-inter text-[11px] flex-1 truncate ${
          pending ? 'text-muted italic' : win2 ? 'font-semibold text-navy' : 'text-slate'
        }`}>
          {partido.pareja2?.nombre ?? 'Por definir'}
        </span>
        <span className={`font-manrope text-sm font-bold shrink-0 ${win2 ? 'text-gold' : 'text-muted'}`}>
          {s2}
        </span>
      </div>
    </div>
  )
}

const ELIM_PHASES = ['cuartos', 'semifinal', 'tercer_lugar', 'final'] as const
const CONSOLA_PHASES = ['consolacion_cuartos', 'consolacion_sf', 'consolacion_final'] as const

const FASE_LABEL: Record<string, string> = {
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: '🏆 Final',
  consolacion_cuartos: 'Cuartos Plata',
  consolacion_sf: 'SF Plata',
  consolacion_final: '🥈 Final Plata',
}

function BracketTree({
  rounds,
  isFinalCopa = false,
}: {
  rounds: { label: string; partidos: PartidoFixture[] }[]
  isFinalCopa?: boolean
}) {
  if (rounds.length === 0) return null

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {rounds.map((round, ri) => {
        const isLast = ri === rounds.length - 1
        const colH = round.partidos.length * SLOT - CARD_GAP
        const nextCount = rounds[ri + 1]?.partidos.length ?? 0
        const allPending = round.partidos.every(p => !p.ganador)

        return (
          <div key={round.label} className="flex items-start shrink-0">
            {/* Columna de ronda */}
            <div className="flex flex-col shrink-0">
              {/* Label */}
              <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-3 text-center w-44">
                {round.label}
              </p>
              {/* Cards */}
              <div
                className="flex flex-col"
                style={{ gap: CARD_GAP, height: colH }}
              >
                {round.partidos.map(p => (
                  <BracketCard
                    key={p.id}
                    partido={p}
                    isFinal={isLast && isFinalCopa}
                  />
                ))}
              </div>
            </div>

            {/* Conector hacia la siguiente ronda */}
            {!isLast && nextCount > 0 && round.partidos.length > nextCount && (
              <div className="mt-[32px]"> {/* 32px = label height + mb-3 */}
                <BracketConnector
                  leftCount={round.partidos.length}
                  pending={allPending}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Trofeo al final */}
      <div className="flex flex-col items-center justify-center pl-3 mt-[32px]" style={{ height: SLOT }}>
        <span className="text-2xl">{isFinalCopa ? '🥈' : '🏆'}</span>
      </div>
    </div>
  )
}

function CategoriaBracket({ categoria }: { categoria: CategoriaFixture }) {
  // Armar rondas Oro
  const byPhase = (phases: readonly string[], partidos: PartidoFixture[]) =>
    phases
      .map(phase => ({
        label: FASE_LABEL[phase] ?? phase,
        partidos: partidos.filter(p => p.fase === phase),
      }))
      .filter(r => r.partidos.length > 0)

  const oroRounds = byPhase(ELIM_PHASES, categoria.faseEliminatoria)
  const plataRounds = byPhase(CONSOLA_PHASES, categoria.consola)

  return (
    <div className="space-y-6">
      <h3 className="font-manrope text-base font-bold text-navy">{categoria.nombre}</h3>

      {oroRounds.length > 0 ? (
        <BracketTree rounds={oroRounds} isFinalCopa={false} />
      ) : (
        <p className="font-inter text-sm text-muted">Fase eliminatoria pendiente.</p>
      )}

      {plataRounds.length > 0 && (
        <div className="pt-4 border-t border-surface-high">
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-4">
            🥈 Copa Plata
          </p>
          <BracketTree rounds={plataRounds} isFinalCopa={true} />
        </div>
      )}
    </div>
  )
}

interface Props {
  categorias: CategoriaFixture[]
}

export default function BracketTab({ categorias }: Props) {
  const cats = categorias.filter(c => !c.formato || c.formato === 'americano_grupos')

  if (cats.length === 0) {
    return <p className="font-inter text-sm text-muted py-4">Sin categorías con bracket.</p>
  }

  return (
    <div className="space-y-10">
      {cats.map(cat => (
        <CategoriaBracket key={cat.nombre} categoria={cat} />
      ))}
    </div>
  )
}
```

- [ ] **Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
git add src/features/torneos/BracketTab.tsx
git commit -m "feat: add BracketTab with SVG connectors and Copa Plata"
```

---

## Task 5: HorarioTab — grilla transpuesta canchas × tiempo

**Files:**
- Create: `src/features/torneos/HorarioTab.tsx`

- [ ] **Crear el archivo**

```tsx
// src/features/torneos/HorarioTab.tsx
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

const CAT_COLORS: [string, string][] = [
  ['open', '#f59e0b'],
  ['4a',   '#3b82f6'],
  ['3a',   '#8b5cf6'],
  [' d',   '#ec4899'],
  [' c',   '#a855f7'],
  ['d ',   '#ec4899'],
  ['c ',   '#a855f7'],
]

function catColor(nombre: string): string {
  const lower = nombre.toLowerCase()
  for (const [key, color] of CAT_COLORS) {
    if (lower.includes(key)) return color
  }
  return '#64748b'
}

const FASE_LABEL: Record<string, string> = {
  grupo: 'Grupo',
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: '🏆 Final',
  consolacion_cuartos: 'Cuartos Plata',
  consolacion_sf: 'SF Plata',
  consolacion_final: '🥈 Final Plata',
  desafio: 'Desafío',
}

function partidoLabel(p: PartidoFixture): string {
  switch (p.fase) {
    case 'grupo':              return `P·${p.numero}`
    case 'cuartos':            return `C·${p.numero}`
    case 'semifinal':          return `SF·${p.numero}`
    case 'tercer_lugar':       return `3P`
    case 'final':              return `F·${p.numero}`
    case 'consolacion_cuartos':return `CP·${p.numero}`
    case 'consolacion_sf':     return `SF·P${p.numero}`
    case 'consolacion_final':  return `F·P${p.numero}`
    default:                   return String(p.numero)
  }
}

function parseScores(resultado: string | null): [string, string] {
  if (!resultado) return ['—', '—']
  const parts = resultado.split('-')
  if (parts.length !== 2) return [resultado, '']
  return [parts[0].trim(), parts[1].trim()]
}

// ── MatchCell ─────────────────────────────────────────────────────────────────

interface MatchEntry {
  partido: PartidoFixture
  catNombre: string
  isPlata: boolean
}

function MatchCell({ entry }: { entry: MatchEntry }) {
  const { partido, catNombre, isPlata } = entry
  const [s1, s2] = parseScores(partido.resultado)
  const win1 = partido.ganador === 1
  const win2 = partido.ganador === 2
  const pending = !partido.pareja1 || !partido.pareja2
  const played = !!partido.ganador

  const cupShadow = isPlata
    ? '0 0 0 1.5px #94a3b8'
    : '0 0 0 1.5px #F5C518'
  const topColor = catColor(catNombre)

  return (
    <div
      className={`rounded-lg p-2 h-full flex flex-col gap-1 ${played ? 'opacity-75' : ''} ${pending ? 'opacity-45' : ''}`}
      style={{
        background: '#f8fafc',
        borderTop: `2.5px solid ${topColor}`,
        boxShadow: cupShadow,
        borderRadius: 8,
        minHeight: 76,
      }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-1.5">
        <span className="font-inter text-[9px] font-bold text-muted bg-white rounded px-1 py-0.5 border border-navy/10">
          {partidoLabel(partido)}
        </span>
        <span className="font-inter text-[9px] text-muted uppercase tracking-wide truncate flex-1">
          {FASE_LABEL[partido.fase] ?? partido.fase}
        </span>
        <span
          className="font-inter text-[8px] font-bold rounded px-1 py-0.5 shrink-0"
          style={{ background: topColor + '22', color: topColor }}
        >
          {catNombre}
        </span>
      </div>

      {/* Pareja 1 */}
      <div className="flex items-center justify-between gap-1">
        <span className={`font-inter text-[10px] flex-1 truncate ${
          pending ? 'text-muted italic' : win1 ? 'font-semibold text-navy' : 'text-slate'
        }`}>
          {partido.pareja1?.nombre ?? 'Por definir'}
        </span>
        <span className={`font-manrope text-xs font-bold shrink-0 ${win1 ? 'text-gold' : 'text-muted'}`}>
          {s1}
        </span>
      </div>

      <div className="h-px bg-navy/5" />

      {/* Pareja 2 */}
      <div className="flex items-center justify-between gap-1">
        <span className={`font-inter text-[10px] flex-1 truncate ${
          pending ? 'text-muted italic' : win2 ? 'font-semibold text-navy' : 'text-slate'
        }`}>
          {partido.pareja2?.nombre ?? 'Por definir'}
        </span>
        <span className={`font-manrope text-xs font-bold shrink-0 ${win2 ? 'text-gold' : 'text-muted'}`}>
          {s2}
        </span>
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend({ catNames }: { catNames: string[] }) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {catNames.map(name => (
        <div key={name} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: catColor(name) }}
          />
          <span className="font-inter text-xs text-muted">{name}</span>
        </div>
      ))}
      <div className="w-px bg-navy/10 mx-1" />
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-gold" />
        <span className="font-inter text-xs text-muted">Copa Oro</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-slate" />
        <span className="font-inter text-xs text-muted">Copa Plata</span>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  categorias: CategoriaFixture[]
}

export default function HorarioTab({ categorias }: Props) {
  // Construir índice de partidos con turno y cancha asignados
  const entries: MatchEntry[] = []

  for (const cat of categorias) {
    const plataIds = new Set(cat.consola.map(p => p.id))
    const allPartidos: PartidoFixture[] = [
      ...cat.grupos.flatMap(g => g.partidos),
      ...cat.faseEliminatoria,
      ...cat.consola,
      ...(cat.partidos ?? []),
    ]
    for (const p of allPartidos) {
      if (p.turno != null && p.cancha != null) {
        entries.push({ partido: p, catNombre: cat.nombre, isPlata: plataIds.has(p.id) })
      }
    }
  }

  if (entries.length === 0) {
    return (
      <p className="font-inter text-sm text-muted py-4">
        No hay horarios asignados. Se generan al crear el fixture con hora de inicio configurada.
      </p>
    )
  }

  // Ejes: canchas (rows) y tiempos (columns)
  const courts = [...new Set(entries.map(e => e.partido.cancha!))].sort((a, b) => a - b)
  const times = [...new Set(entries.map(e => e.partido.turno!))].sort()

  // Lookup: `${cancha}|${turno}` → MatchEntry
  const lookup = new Map<string, MatchEntry>()
  for (const e of entries) {
    lookup.set(`${e.partido.cancha}|${e.partido.turno}`, e)
  }

  const catNames = [...new Set(categorias.map(c => c.nombre))]

  return (
    <div>
      <Legend catNames={catNames} />

      <div className="overflow-x-auto rounded-xl border border-navy/10">
        <table className="border-collapse" style={{ minWidth: courts.length * 156 + 88 }}>
          <thead>
            <tr>
              {/* Corner */}
              <th className="bg-navy text-left px-3 py-2.5 rounded-tl-xl" style={{ width: 88 }}>
                <span className="font-inter text-[9px] font-bold uppercase tracking-widest text-white/40">
                  Cancha
                </span>
              </th>
              {/* Time headers */}
              {times.map((t, ti) => (
                <th
                  key={t}
                  className={`bg-navy px-2 py-2.5 text-center ${ti === times.length - 1 ? 'rounded-tr-xl' : ''}`}
                  style={{ minWidth: 148 }}
                >
                  <p className="font-manrope text-sm font-bold text-gold">{t}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courts.map((court, ci) => (
              <tr key={court} className={ci % 2 === 0 ? 'bg-white' : 'bg-surface/50'}>
                {/* Court header */}
                <td className="bg-navy px-3 py-2 align-middle">
                  <p className="font-manrope text-sm font-bold text-white">C{court}</p>
                </td>
                {/* Match cells */}
                {times.map(t => {
                  const entry = lookup.get(`${court}|${t}`)
                  return (
                    <td key={t} className="p-1.5 align-top">
                      {entry ? (
                        <MatchCell entry={entry} />
                      ) : (
                        <div className="rounded-lg bg-surface/30 flex items-center justify-center"
                          style={{ minHeight: 76 }}>
                          <span className="text-navy/10 text-lg">·</span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-inter text-[10px] text-muted mt-2 text-right">← desliza para ver más →</p>
    </div>
  )
}
```

- [ ] **Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
git add src/features/torneos/HorarioTab.tsx
git commit -m "feat: add HorarioTab with transposed court/time grid"
```

---

## Task 6: Actualizar TorneoDetalle + eliminar FixtureView

**Files:**
- Modify: `src/features/torneos/TorneoDetalle.tsx`
- Delete: `src/features/torneos/FixtureView.tsx`

- [ ] **Reemplazar el contenido de TorneoDetalle.tsx**

```tsx
// src/features/torneos/TorneoDetalle.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Banknote } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Tabs from '@radix-ui/react-tabs'
import { adminHeaders } from '../../lib/adminHeaders'
import { useUser } from '../../hooks/useUser'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import FixtureTab from './FixtureTab'
import BracketTab from './BracketTab'
import HorarioTab from './HorarioTab'
import DesafioView from './DesafioView'
import InscripcionesPanel from './InscripcionesPanel'
import ResultadosModal from './ResultadosModal'
import RosterAdmin from './RosterAdmin'
import GenerarCobroModal from './GenerarCobroModal'
import { buildFixture, buildDesafioFixture } from '../../lib/fixture/engine'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaConfig, CategoriaFixture, PartidoFixture, ParejaFixture, ConfigFixture } from '../../lib/fixture/types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const SB = import.meta.env.VITE_SUPABASE_URL as string

async function padelGet(path: string) {
  const headers = await adminHeaders('read')
  const res = await fetch(`${SB}/rest/v1/${path}`, { headers })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`) }
  return res.json()
}

async function padelPatch(table: string, id: string, body: Record<string, unknown>) {
  const headers = await adminHeaders('write')
  const res = await fetch(`${SB}/rest/v1/${table}?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`) }
}

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  inscripcion: 'Inscripciones',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
}

const TAB_CLS = [
  'font-inter text-sm font-semibold px-4 py-2 rounded-lg transition-colors',
  'data-[state=inactive]:text-muted data-[state=inactive]:hover:text-navy',
  'data-[state=active]:bg-navy data-[state=active]:text-gold',
].join(' ')

export default function TorneoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const [partidoModal, setPartidoModal] = useState<PartidoFixture | null>(null)
  const [showCobro, setShowCobro] = useState(false)
  const [activeTab, setActiveTab] = useState('fixture')

  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const qc = useQueryClient()

  const { data: torneo, isLoading } = useQuery({
    queryKey: ['torneo', id],
    queryFn: () => padelGet(`torneos?id=eq.${id}&select=*`).then((rows: Torneo[]) => rows[0] ?? null),
    enabled: !!id,
  })

  const abrirInscripciones = useMutation({
    mutationFn: () => padelPatch('torneos', id!, { estado: 'inscripcion' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['torneo', id] }),
  })

  const generarFixture = useMutation({
    mutationFn: async () => {
      const inscritas: any[] = await padelGet(
        `inscripciones?select=id,jugador1_id,jugador2_id,categoria_nombre,j1:jugadores!jugador1_id(id,nombre,elo),j2:jugadores!jugador2_id(id,nombre,elo)&torneo_id=eq.${id}&estado=eq.confirmada&lista_espera=eq.false`
      )
      const configFixture = torneo!.config_fixture as unknown as ConfigFixture
      if (!configFixture) throw new Error('El torneo no tiene configuración de fixture guardada.')

      const categoriasFixture = categoriasConfig.map(cat => {
        const parejas: ParejaFixture[] = inscritas
          .filter((i: any) => i.categoria_nombre === cat.nombre)
          .map((i: any) => ({
            id: i.id,
            nombre: `${i.j1?.nombre ?? '?'} / ${i.j2?.nombre ?? '?'}`,
            jugador1_id: i.jugador1_id,
            jugador2_id: i.jugador2_id,
            elo1: i.j1?.elo ?? 1200,
            elo2: i.j2?.elo ?? 1200,
          }))
        return cat.formato === 'desafio_puntos'
          ? buildDesafioFixture(cat, parejas, configFixture)
          : buildFixture(cat, parejas, configFixture)
      })

      await padelPatch('torneos', id!, { categorias: categoriasFixture, estado: 'en_curso' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['torneo', id] })
      qc.invalidateQueries({ queryKey: ['inscripciones', id] })
    },
  })

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando…</div>
  if (!torneo) return <div className="p-6 text-defeat font-inter text-sm">Torneo no encontrado</div>

  const rawCategorias = (torneo.categorias as unknown as (CategoriaFixture | CategoriaConfig)[]) ?? []
  const categorias = rawCategorias.filter(
    (c): c is CategoriaFixture =>
      Array.isArray((c as CategoriaFixture).grupos) || Array.isArray((c as CategoriaFixture).partidos)
  )
  const categoriasConfig = rawCategorias.filter(
    (c): c is CategoriaConfig =>
      !Array.isArray((c as CategoriaFixture).grupos) && !Array.isArray((c as CategoriaFixture).partidos)
  ) as CategoriaConfig[]

  const americanoCats = categorias.filter(c => !c.formato || c.formato === 'americano_grupos')
  const desafioCats = categorias.filter(c => c.formato === 'desafio_puntos')
  const hasAmericano = americanoCats.length > 0
  const hasDesafio = desafioCats.length > 0

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted font-inter text-sm hover:text-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Torneos
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-manrope text-navy">{torneo.nombre}</h1>
          <p className="text-muted text-sm font-inter">{torneo.fecha_inicio}</p>
        </div>
        <Badge>{ESTADO_LABELS[torneo.estado]}</Badge>
      </div>

      {isAdmin && (torneo.estado === 'inscripcion' || torneo.estado === 'en_curso') && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs rounded-lg border-navy/20 text-navy gap-1.5"
            onClick={() => setShowCobro(true)}
          >
            <Banknote className="h-3.5 w-3.5" /> Cobro inscripción
          </Button>
        </div>
      )}

      {isAdmin && (torneo.estado === 'borrador' || torneo.estado === 'inscripcion') && (
        <div className="flex gap-2 flex-wrap">
          {torneo.estado === 'borrador' && (
            <Button
              size="sm"
              className="bg-navy text-white text-xs font-semibold rounded-lg"
              onClick={() => abrirInscripciones.mutate()}
              disabled={abrirInscripciones.isPending}
            >
              {abrirInscripciones.isPending ? 'Abriendo…' : 'Abrir inscripciones'}
            </Button>
          )}
          {torneo.estado === 'inscripcion' && (
            <Button
              size="sm"
              className="bg-gold text-navy font-bold text-xs rounded-lg"
              onClick={() => generarFixture.mutate()}
              disabled={generarFixture.isPending}
            >
              {generarFixture.isPending ? 'Generando fixture…' : 'Generar fixture y comenzar'}
            </Button>
          )}
          {abrirInscripciones.error && (
            <p className="text-xs text-defeat w-full font-inter">
              {abrirInscripciones.error instanceof Error ? abrirInscripciones.error.message : 'Error al abrir inscripciones'}
            </p>
          )}
          {generarFixture.error && (
            <p className="text-xs text-defeat w-full font-inter">
              {generarFixture.error instanceof Error ? generarFixture.error.message : 'Error al generar fixture'}
            </p>
          )}
        </div>
      )}

      {/* ── Fixture section ── */}
      <div className="rounded-xl bg-white shadow-card p-4 space-y-6">

        {/* Categorías desafío: sin tabs */}
        {hasDesafio && (
          <DesafioView
            categorias={desafioCats}
            torneoId={torneo.id}
            isAdmin={isAdmin}
            onCargarResultado={setPartidoModal}
            colegioRival={torneo.colegio_rival ?? undefined}
          />
        )}

        {/* Categorías americano: con tabs */}
        {hasAmericano && (
          categorias.length === 0 ? (
            <p className="font-inter text-sm text-muted">
              El fixture se generará cuando el torneo pase a inscripción.
            </p>
          ) : (
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="flex gap-1 bg-surface rounded-xl p-1 mb-6">
                <Tabs.Trigger value="fixture" className={TAB_CLS}>Fixture</Tabs.Trigger>
                <Tabs.Trigger value="bracket" className={TAB_CLS}>Bracket</Tabs.Trigger>
                <Tabs.Trigger value="horario" className={TAB_CLS}>Horario</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="fixture">
                <FixtureTab
                  categorias={americanoCats}
                  torneoId={torneo.id}
                  isAdmin={isAdmin}
                  onCargarResultado={setPartidoModal}
                />
              </Tabs.Content>

              <Tabs.Content value="bracket">
                <BracketTab categorias={americanoCats} />
              </Tabs.Content>

              <Tabs.Content value="horario">
                <HorarioTab categorias={americanoCats} />
              </Tabs.Content>
            </Tabs.Root>
          )
        )}

        {/* Inscripciones */}
        <div>
          <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-4">
            Inscripciones
          </p>
          {isAdmin
            ? <RosterAdmin torneoId={torneo.id} categorias={categoriasConfig} />
            : <InscripcionesPanel torneoId={torneo.id} estado={torneo.estado} categorias={categoriasConfig} />
          }
        </div>
      </div>

      {showCobro && (
        <GenerarCobroModal
          torneoId={torneo.id}
          torneoNombre={torneo.nombre}
          onClose={() => setShowCobro(false)}
        />
      )}
      {partidoModal && (
        <ResultadosModal
          partido={partidoModal}
          torneoId={id!}
          torneo={{ id: id!, nombre: torneo.nombre, fecha_inicio: torneo.fecha_inicio ?? '', colegio_rival: torneo.colegio_rival }}
          onClose={() => setPartidoModal(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Eliminar FixtureView.tsx**

```bash
rm "/home/francisco-rosselot/Documents/Proyectos Claude Code/padel-sg/src/features/torneos/FixtureView.tsx"
```

- [ ] **Verificar TypeScript sin errores**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Esperado: sin errores.

- [ ] **Bump de versión a 0.2.9**

En `package.json`, cambiar `"version": "0.2.8"` a `"version": "0.2.9"`.

- [ ] **Commit final**

```bash
git add src/features/torneos/TorneoDetalle.tsx package.json
git rm src/features/torneos/FixtureView.tsx
git commit -m "feat: tournament tabs — FixtureTab, BracketTab, HorarioTab (v0.2.9)"
```

---

## Self-Review

- **Spec coverage:**
  - ✅ Tab Fixture con grupos, eliminatoria, copa plata y acciones admin
  - ✅ Tab Bracket árbol SVG + Copa Plata separada
  - ✅ Tab Horario grilla transpuesta con colores por categoría y copa
  - ✅ DesafioView sin tabs para `desafio_puntos`
  - ✅ PartidoRow compartido con lock/unlock y "Cargar resultado"
  - ✅ Número de partido (`P·N`, `SF·N`, `F·N`, etc.)
  - ✅ Colores por categoría y borde por copa (oro/plata)
  - ✅ Marcador inline al lado de jugadores
  - ✅ Estados: played / upcoming / pending (TBD)
  - ✅ `@radix-ui/react-tabs` (ya en package.json)
  - ✅ Sin dependencias nuevas
  - ✅ FixtureView.tsx eliminado

- **Tipos consistentes:** `PartidoFixture`, `CategoriaFixture`, `GrupoFixture` de `../../lib/fixture/types` usados uniformemente. Props de `onCargarResultado: (partido: PartidoFixture) => void` coherentes en todos los componentes.

- **Sin placeholders:** Todo el código está completo y funcional.
