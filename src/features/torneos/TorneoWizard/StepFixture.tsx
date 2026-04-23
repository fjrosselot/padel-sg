import { useFormContext, useWatch } from 'react-hook-form'
import { useMemo } from 'react'
import type { WizardData } from './schema'
import { FixtureGantt } from './FixtureGantt'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// ── Primitivos locales ────────────────────────────────────────────────────────

function Stepper({
  label, value, onChange, min, max,
}: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-inter text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-lg border border-navy/20 bg-surface flex items-center justify-center font-mono text-lg text-navy disabled:opacity-30 hover:border-gold hover:text-gold transition-colors"
        >−</button>
        <input
          type="number"
          min={min} max={max}
          value={value}
          onChange={e => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)))
          }}
          className="w-12 text-center font-manrope text-xl font-bold text-navy tabular-nums bg-transparent border-b border-navy/20 focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-lg border border-navy/20 bg-surface flex items-center justify-center font-mono text-lg text-navy disabled:opacity-30 hover:border-gold hover:text-gold transition-colors"
        >+</button>
      </div>
    </div>
  )
}

function SliderField({
  label, value, onChange, min, max, step, unit,
}: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-inter text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</span>
        <span className="font-manrope text-base font-bold text-navy">{value} {unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="w-7 h-7 rounded border border-navy/20 bg-surface flex items-center justify-center font-mono text-sm text-navy disabled:opacity-30 hover:border-gold hover:text-gold transition-colors shrink-0"
        >−</button>
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-1 rounded accent-gold cursor-pointer"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="w-7 h-7 rounded border border-navy/20 bg-surface flex items-center justify-center font-mono text-sm text-navy disabled:opacity-30 hover:border-gold hover:text-gold transition-colors shrink-0"
        >+</button>
      </div>
    </div>
  )
}

function TogglePill({
  checked, onChange, label, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-inter font-medium transition-all
        ${disabled ? 'opacity-40 cursor-not-allowed border-navy/10 bg-surface text-muted' :
          checked ? 'border-gold bg-gold/10 text-navy' : 'border-navy/15 bg-surface text-muted hover:border-navy/30'}`}
    >
      <span
        className={`relative flex-shrink-0 w-8 h-4 rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-navy/20'}`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </span>
      {label}
    </button>
  )
}

// ── Simulación estimada ───────────────────────────────────────────────────────

function fmtMin(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`
}

interface CatSim { nombre: string; partidos: number; duracionMin: number; grupos: number }

function simular(categorias: WizardData['categorias'], cfg: Partial<WizardData>): {
  cats: CatSim[]; totalPartidos: number; totalMin: number; horaFin: string
} | null {
  const { num_canchas, hora_inicio, duracion_partido, pausa_entre_partidos,
    parejas_por_grupo, cuantos_avanzan, con_consolacion, con_tercer_lugar, con_grupos } = cfg as WizardData

  if (!categorias?.length || !num_canchas || !hora_inicio || !duracion_partido) return null

  const slot = (duracion_partido ?? 60) + (pausa_entre_partidos ?? 0)
  const [startH, startM] = (hora_inicio ?? '09:00').split(':').map(Number)

  const cats: CatSim[] = categorias.map(cat => {
    const n = cat.num_parejas ?? 0
    if (n < 2) return { nombre: cat.nombre, partidos: 0, duracionMin: 0, grupos: 0 }

    if (cat.formato === 'desafio_puntos' || cat.formato === 'desafio_sembrado') {
      return { nombre: cat.nombre, partidos: n, duracionMin: Math.ceil(n / num_canchas) * slot, grupos: 0 }
    }

    let grupoPartidos = 0
    let numGrupos = 1

    if (con_grupos) {
      const ppg = parejas_por_grupo ?? 4
      numGrupos = Math.ceil(n / ppg)
      const base = Math.floor(n / numGrupos)
      const extra = n % numGrupos
      for (let i = 0; i < numGrupos; i++) {
        const sz = i < extra ? base + 1 : base
        grupoPartidos += (sz * (sz - 1)) / 2
      }
    } else {
      grupoPartidos = (n * (n - 1)) / 2
    }

    const apg = cuantos_avanzan ?? 2
    const advancing = numGrupos * apg
    let bracketSize = 1
    while (bracketSize < advancing) bracketSize *= 2
    let playoffPartidos = advancing >= 2 ? bracketSize - 1 : 0
    if (con_tercer_lugar && advancing >= 4) playoffPartidos++
    if (con_consolacion) {
      const silverTeams = numGrupos * Math.max(0, (parejas_por_grupo ?? 4) - apg)
      if (silverTeams >= 2) {
        let silverSize = 1
        while (silverSize < silverTeams) silverSize *= 2
        playoffPartidos += silverSize - 1
      } else if (silverTeams === 0) {
        // No non-classified teams (e.g. all advance); skip
      } else {
        playoffPartidos += 1 // 1 team can't play, but keep minimal
      }
    }

    const total = grupoPartidos + playoffPartidos
    return { nombre: cat.nombre, partidos: total, duracionMin: Math.ceil(total / num_canchas) * slot, grupos: numGrupos }
  })

  const totalPartidos = cats.reduce((s, c) => s + c.partidos, 0)
  const totalMin = Math.ceil(totalPartidos / num_canchas) * slot
  const endTotalMin = startH * 60 + startM + totalMin
  const horaFin = `${String(Math.floor(endTotalMin / 60)).padStart(2, '0')}:${String(endTotalMin % 60).padStart(2, '0')}`

  return { cats, totalPartidos, totalMin, horaFin }
}

function SimPreview({ categorias, allDesafio }: { categorias: WizardData['categorias']; allDesafio: boolean }) {
  const cfg = useWatch<WizardData>() as Partial<WizardData>
  const sim = useMemo(() => simular(categorias, cfg), [categorias, cfg])
  if (!sim) return null

  return (
    <div className="rounded-xl border border-navy/10 bg-surface overflow-hidden">
      <div className="px-4 py-2.5 bg-navy/5 border-b border-navy/10">
        <p className="font-inter text-xs font-bold uppercase tracking-widest text-navy/60">Simulación estimada</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="font-manrope text-xl font-bold text-navy">{sim.totalPartidos}</p>
            <p className="font-inter text-[10px] uppercase tracking-wide text-muted">Partidos totales</p>
          </div>
          <div className="text-center">
            <p className="font-manrope text-xl font-bold text-navy">{fmtMin(sim.totalMin)}</p>
            <p className="font-inter text-[10px] uppercase tracking-wide text-muted">Duración total</p>
          </div>
          <div className="text-center">
            <p className="font-manrope text-xl font-bold text-navy">{sim.horaFin}</p>
            <p className="font-inter text-[10px] uppercase tracking-wide text-muted">Hora fin est.</p>
          </div>
        </div>
        {sim.cats.length > 1 && (
          <div className="space-y-1.5 pt-1 border-t border-navy/5">
            {sim.cats.map(c => (
              <div key={c.nombre} className="flex items-center justify-between text-xs">
                <span className="font-inter font-semibold text-navy">{c.nombre}</span>
                <span className="font-inter text-muted">
                  {c.partidos} partidos
                  {!allDesafio && c.grupos > 0 && ` · ${c.grupos} grupo${c.grupos > 1 ? 's' : ''}`}
                  {' · '}{fmtMin(c.duracionMin)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step principal ────────────────────────────────────────────────────────────

interface Props { onCreated?: () => void }

export default function StepFixture(_props: Props) {
  const { watch, setValue } = useFormContext<WizardData>()
  const categorias = useWatch({ name: 'categorias' }) as WizardData['categorias']
  const isDesafioFormat = (c: { formato?: string }) =>
    c.formato === 'desafio_puntos' || c.formato === 'desafio_sembrado'
  const allDesafio = categorias?.length > 0 && categorias.every(isDesafioFormat)
  const anyDesafio = categorias?.some(c => !isDesafioFormat(c))

  const conGrupos = watch('con_grupos')
  const conConsolacion = watch('con_consolacion')
  const conTercerLugar = watch('con_tercer_lugar')
  const fixtureCompacto = watch('fixture_compacto')
  const ppg = watch('parejas_por_grupo')
  const adv = watch('cuantos_avanzan')
  const canchas = watch('num_canchas')
  const horaInicio = watch('hora_inicio')
  const duracion = watch('duracion_partido')
  const pausa = watch('pausa_entre_partidos')

  const cfg = useWatch<WizardData>() as Partial<WizardData>

  const horaOptions = Array.from({ length: (21 - 8) * 4 + 1 }, (_, i) => {
    const totalMin = 8 * 60 + i * 15
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })

  return (
    <Tabs defaultValue="config" className="space-y-4">
      <TabsList className="w-full">
        <TabsTrigger value="config" className="flex-1">Configuración</TabsTrigger>
        <TabsTrigger value="sim" className="flex-1">Simulación</TabsTrigger>
      </TabsList>

      <TabsContent value="config" className="space-y-5 mt-0">
        {/* Formato toggles */}
        <div className="space-y-2">
          <p className="font-inter text-[10px] font-semibold uppercase tracking-widest text-muted">Formato</p>
          <div className="grid grid-cols-2 gap-2">
            {anyDesafio && (
              <TogglePill
                checked={conGrupos}
                onChange={v => setValue('con_grupos', v)}
                label="Grupos (RR)"
              />
            )}
            {!allDesafio && (
              <>
                <TogglePill
                  checked={conConsolacion}
                  onChange={v => setValue('con_consolacion', v)}
                  label="Copa Plata"
                />
                <TogglePill
                  checked={conTercerLugar}
                  onChange={v => setValue('con_tercer_lugar', v)}
                  label="3er lugar"
                />
                <TogglePill
                  checked={fixtureCompacto}
                  onChange={v => setValue('fixture_compacto', v)}
                  label="Fixture compacto"
                />
              </>
            )}
          </div>
        </div>

        {/* Grupos options */}
        {!allDesafio && conGrupos && (
          <div className="grid grid-cols-2 gap-6">
            <Stepper
              label="Parejas / grupo"
              value={ppg}
              onChange={v => setValue('parejas_por_grupo', v)}
              min={3} max={8}
            />
            <Stepper
              label="Avanzan"
              value={adv}
              onChange={v => setValue('cuantos_avanzan', v)}
              min={1} max={4}
            />
          </div>
        )}

        {!allDesafio && !conGrupos && (
          <div className="rounded-lg bg-gold/10 border border-gold/30 px-3 py-2 text-sm text-navy">
            <strong>Americano puro:</strong> todos juegan entre sí en un solo grupo.
            Los primeros <strong>{adv}</strong> clasifican al playoff.
            <div className="mt-2">
              <Stepper
                label="Clasifican al playoff"
                value={adv}
                onChange={v => setValue('cuantos_avanzan', v)}
                min={2} max={8}
              />
            </div>
          </div>
        )}

        {/* Canchas + hora */}
        <div className="grid grid-cols-2 gap-6 items-end">
          <Stepper
            label="Canchas disponibles"
            value={canchas}
            onChange={v => setValue('num_canchas', v)}
            min={1} max={20}
          />
          <div className="space-y-1.5">
            <span className="font-inter text-[10px] font-semibold uppercase tracking-widest text-muted">Hora de inicio</span>
            <select
              value={horaInicio}
              onChange={e => setValue('hora_inicio', e.target.value)}
              className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 font-manrope text-base font-bold text-navy focus:border-gold focus:outline-none"
            >
              {horaOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-2 gap-6">
          <SliderField
            label="Duración partido"
            value={duracion} onChange={v => setValue('duracion_partido', v)}
            min={30} max={120} step={5} unit="min"
          />
          <SliderField
            label="Pausa entre partidos"
            value={pausa} onChange={v => setValue('pausa_entre_partidos', v)}
            min={0} max={30} step={5} unit="min"
          />
        </div>
      </TabsContent>

      <TabsContent value="sim" className="space-y-4 mt-0">
        <SimPreview categorias={categorias} allDesafio={allDesafio} />
        <FixtureGantt categorias={categorias} cfg={cfg} />
      </TabsContent>
    </Tabs>
  )
}
