import { useFormContext, useWatch } from 'react-hook-form'
import { useMemo } from 'react'
import type { WizardData } from './schema'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'

interface CatSim { nombre: string; partidos: number; duracionMin: number; grupos: number }

function simular(categorias: WizardData['categorias'], cfg: Partial<WizardData>): {
  cats: CatSim[]
  totalPartidos: number
  totalMin: number
  horaFin: string
  canchasMinimas: number
} | null {
  const { num_canchas, hora_inicio, duracion_partido, pausa_entre_partidos,
    parejas_por_grupo, cuantos_avanzan, con_consolacion, con_tercer_lugar } = cfg as WizardData

  if (!categorias?.length || !num_canchas || !hora_inicio || !duracion_partido) return null

  const slot = (duracion_partido ?? 60) + (pausa_entre_partidos ?? 0)
  const [startH, startM] = (hora_inicio ?? '09:00').split(':').map(Number)

  const cats: CatSim[] = categorias.map(cat => {
    const n = cat.num_parejas ?? 0
    if (n < 2) return { nombre: cat.nombre, partidos: 0, duracionMin: 0, grupos: 0 }

    if (cat.formato === 'desafio_puntos') {
      const duracionMin = Math.ceil(n / num_canchas) * slot
      return { nombre: cat.nombre, partidos: n, duracionMin, grupos: 0 }
    }

    const ppg = parejas_por_grupo ?? 4
    const numGrupos = Math.ceil(n / ppg)
    const base = Math.floor(n / numGrupos)
    const extra = n % numGrupos
    let grupoPartidos = 0
    for (let i = 0; i < numGrupos; i++) {
      const sz = i < extra ? base + 1 : base
      grupoPartidos += (sz * (sz - 1)) / 2
    }

    const advancing = numGrupos * (cuantos_avanzan ?? 2)
    let playoffPartidos = 0
    if (advancing >= 2) {
      if (advancing >= 4) {
        playoffPartidos += 2 // semis
        if (con_consolacion) playoffPartidos++
        if (con_tercer_lugar) playoffPartidos++
      }
      playoffPartidos++ // final
    }

    const total = grupoPartidos + playoffPartidos
    const duracionMin = Math.ceil(total / num_canchas) * slot
    return { nombre: cat.nombre, partidos: total, duracionMin, grupos: numGrupos }
  })

  const totalPartidos = cats.reduce((s, c) => s + c.partidos, 0)
  const totalMin = Math.ceil(totalPartidos / num_canchas) * slot

  const endTotalMin = startH * 60 + startM + totalMin
  const endH = Math.floor(endTotalMin / 60)
  const endM = endTotalMin % 60
  const horaFin = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

  // canchas mínimas = max partidos simultáneos en cualquier ronda (simplificado: raíz cuadrada ponderada)
  const canchasMinimas = Math.max(1, Math.min(Math.ceil(totalPartidos / Math.ceil(totalMin / 60)), num_canchas))

  return { cats, totalPartidos, totalMin, horaFin, canchasMinimas }
}

function fmtMin(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`
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

interface Props {
  onCreated?: () => void
}

export default function StepFixture(_props: Props) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<WizardData>()
  const categorias = useWatch({ name: 'categorias' }) as WizardData['categorias']
  const allDesafio = categorias?.length > 0 && categorias.every(c => c.formato === 'desafio_puntos')

  const checkboxFields = [
    { key: 'con_consolacion' as const, label: 'Copa de consolación (Plata)' },
    { key: 'con_tercer_lugar' as const, label: 'Partido por tercer lugar' },
    { key: 'fixture_compacto' as const, label: 'Fixture compacto (no esperar fin de ronda)' },
  ]

  return (
    <div className="space-y-5">
      {allDesafio && (
        <div className="rounded-lg bg-gold/10 border border-gold/30 p-3 text-sm text-navy">
          Todas las categorías son <strong>Desafío por Puntos</strong>. La configuración de grupos no aplica, pero se usan canchas, hora de inicio y duración.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {!allDesafio && (
          <>
            <div>
              <Label htmlFor="parejas_por_grupo" className="label-editorial">Parejas por grupo</Label>
              <Input id="parejas_por_grupo" type="number" min={3} max={8} className="mt-1"
                {...register('parejas_por_grupo', { valueAsNumber: true })} />
              {errors.parejas_por_grupo && <p className="text-[#BA1A1A] text-sm">{errors.parejas_por_grupo.message}</p>}
            </div>
            <div>
              <Label htmlFor="cuantos_avanzan" className="label-editorial">Avanzan por grupo</Label>
              <Input id="cuantos_avanzan" type="number" min={1} max={4} className="mt-1"
                {...register('cuantos_avanzan', { valueAsNumber: true })} />
            </div>
          </>
        )}
        <div>
          <Label htmlFor="num_canchas" className="label-editorial">Canchas disponibles</Label>
          <Input id="num_canchas" type="number" min={1} max={20} className="mt-1"
            {...register('num_canchas', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="hora_inicio" className="label-editorial">Hora de inicio</Label>
          <select
            id="hora_inicio"
            {...register('hora_inicio')}
            className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-3 py-2 font-inter text-sm text-navy focus:border-gold focus:outline-none"
          >
            {Array.from({ length: (21 - 8) * 4 + 1 }, (_, i) => {
              const totalMin = 8 * 60 + i * 15
              const h = Math.floor(totalMin / 60)
              const m = totalMin % 60
              const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
              return <option key={val} value={val}>{val}</option>
            })}
          </select>
        </div>
        <div>
          <Label htmlFor="duracion_partido" className="label-editorial">Duración partido (min)</Label>
          <Input id="duracion_partido" type="number" min={30} max={120} className="mt-1"
            {...register('duracion_partido', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="pausa_entre_partidos" className="label-editorial">Pausa entre partidos (min)</Label>
          <Input id="pausa_entre_partidos" type="number" min={0} max={60} className="mt-1"
            {...register('pausa_entre_partidos', { valueAsNumber: true })} />
        </div>
      </div>

      {!allDesafio && (
        <div className="space-y-3">
          {checkboxFields.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={watch(key) as boolean}
                onChange={e => setValue(key, e.target.checked as never)}
                className="w-4 h-4 rounded border-slate/30"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      )}

      <SimPreview categorias={categorias} allDesafio={allDesafio} />
    </div>
  )
}
