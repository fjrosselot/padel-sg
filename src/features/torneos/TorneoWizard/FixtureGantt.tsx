import { useMemo } from 'react'
import { buildFixture, buildDesafioFixture } from '../../../lib/fixture/engine'
import type { ParejaFixture, ConfigFixture } from '../../../lib/fixture/types'
import type { WizardData } from './schema'

const PX_MIN = 4
const ROW_H = 36
const LABEL_W = 80

const PHASE_COLOR: Record<string, string> = {
  grupo: '#F5C518',
  cuartos: '#F97316',
  semifinal: '#F97316',
  final: '#0D1B2A',
  tercer_lugar: '#8FA8C8',
  consolacion_cuartos: '#C084FC',
  consolacion_sf: '#A855F7',
  consolacion_final: '#7C3AED',
  desafio: '#34D399',
}

function turnoToMin(turno: string): number {
  const [h, m] = turno.split(':').map(Number)
  return h * 60 + m
}

function fmtMin(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

interface Props {
  categorias: WizardData['categorias']
  cfg: Partial<WizardData>
}

export function FixtureGantt({ categorias, cfg }: Props) {
  const data = useMemo(() => {
    if (!categorias?.length || !cfg.num_canchas || !cfg.hora_inicio || !cfg.duracion_partido) return null

    const config: ConfigFixture = {
      con_grupos: cfg.con_grupos ?? true,
      parejas_por_grupo: cfg.parejas_por_grupo ?? 4,
      cuantos_avanzan: cfg.cuantos_avanzan ?? 2,
      con_consolacion: cfg.con_consolacion ?? false,
      con_tercer_lugar: cfg.con_tercer_lugar ?? false,
      duracion_partido: cfg.duracion_partido,
      pausa_entre_partidos: cfg.pausa_entre_partidos ?? 0,
      num_canchas: cfg.num_canchas,
      hora_inicio: cfg.hora_inicio,
      fixture_compacto: cfg.fixture_compacto ?? false,
    }

    const rows: { catLabel: string; cancha: number; partidos: { startMin: number; color: string; label: string }[] }[] = []

    for (const cat of categorias) {
      if ((cat.num_parejas ?? 0) < 2) continue

      const parejas: ParejaFixture[] = Array.from({ length: cat.num_parejas }, (_, i) => ({
        id: `d${i}`, nombre: `P${i + 1}`, jugador1_id: null, jugador2_id: null, elo1: 1000, elo2: 1000,
      }))

      const catConfig = { nombre: cat.nombre, num_parejas: cat.num_parejas, sexo: cat.sexo, formato: cat.formato }
      const fixture = cat.formato === 'desafio_puntos'
        ? buildDesafioFixture(catConfig, parejas, config)
        : buildFixture(catConfig, parejas, config)

      const allPartidos = [
        ...fixture.grupos.flatMap(g => g.partidos),
        ...(fixture.faseEliminatoria ?? []),
        ...(fixture.consola ?? []),
        ...(fixture.partidos ?? []),
      ].filter(p => p.cancha !== null && p.turno !== null)

      const courtMap = new Map<number, { startMin: number; color: string; label: string }[]>()
      for (const p of allPartidos) {
        if (!courtMap.has(p.cancha!)) courtMap.set(p.cancha!, [])
        courtMap.get(p.cancha!)!.push({
          startMin: turnoToMin(p.turno!),
          color: PHASE_COLOR[p.fase] ?? '#8FA8C8',
          label: p.fase === 'grupo' ? `G${p.grupo ?? ''}` : p.fase.replace('_', ' '),
        })
      }

      for (const [cancha, partidos] of Array.from(courtMap.entries()).sort((a, b) => a[0] - b[0])) {
        rows.push({ catLabel: cat.nombre, cancha, partidos })
      }
    }

    if (!rows.length) return null

    const startMin = turnoToMin(config.hora_inicio)
    const allStarts = rows.flatMap(r => r.partidos.map(p => p.startMin))
    const endMin = Math.max(...allStarts) + config.duracion_partido + 15
    const totalW = (endMin - startMin) * PX_MIN

    return { rows, startMin, endMin, totalW, duracion: config.duracion_partido }
  }, [categorias, cfg])

  if (!data) return null

  const ticks: number[] = []
  for (let m = data.startMin; m <= data.endMin; m += 30) ticks.push(m)

  return (
    <div className="rounded-xl border border-navy/10 bg-surface overflow-hidden">
      <div className="px-4 py-2.5 bg-navy/5 border-b border-navy/10 flex items-center justify-between">
        <p className="font-inter text-xs font-bold uppercase tracking-widest text-navy/60">
          Simulador de fixture
        </p>
        <div className="flex items-center gap-3 text-[10px] font-inter text-muted">
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-gold" />Grupos</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[#F97316]" />Playoffs</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-navy" />Final</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[#A855F7]" />Plata</span>
        </div>
      </div>
      <div className="overflow-x-auto p-3">
        {/* Time axis */}
        <div className="flex mb-1" style={{ paddingLeft: LABEL_W }}>
          <div className="relative" style={{ width: data.totalW, height: 16 }}>
            {ticks.map(m => (
              <span
                key={m}
                className="absolute font-inter text-[9px] text-muted -translate-x-1/2"
                style={{ left: (m - data.startMin) * PX_MIN }}
              >
                {fmtMin(m)}
              </span>
            ))}
          </div>
        </div>

        {/* Court rows */}
        <div className="space-y-px">
          {data.rows.map((row, ri) => (
            <div key={ri} className="flex items-center" style={{ height: ROW_H }}>
              <div
                className="shrink-0 text-right pr-2 font-inter text-[10px] text-muted leading-tight"
                style={{ width: LABEL_W }}
              >
                <span className="text-navy/70 font-semibold block">{row.catLabel}</span>
                <span>C{row.cancha}</span>
              </div>
              <div className="relative bg-navy/5 rounded" style={{ width: data.totalW, height: ROW_H - 4 }}>
                {/* gridlines */}
                {ticks.map(m => (
                  <div
                    key={m}
                    className="absolute top-0 bottom-0 w-px bg-navy/10"
                    style={{ left: (m - data.startMin) * PX_MIN }}
                  />
                ))}
                {row.partidos.map((p, pi) => (
                  <div
                    key={pi}
                    className="absolute top-1 bottom-1 rounded flex items-center justify-center overflow-hidden"
                    style={{
                      left: (p.startMin - data.startMin) * PX_MIN,
                      width: data.duracion * PX_MIN - 2,
                      background: p.color,
                      opacity: 0.85,
                    }}
                    title={`${fmtMin(p.startMin)} — ${p.label}`}
                  >
                    <span className="font-inter text-[8px] font-bold text-white/90 truncate px-1">
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
