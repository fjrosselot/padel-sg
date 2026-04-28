import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { useQueryClient } from '@tanstack/react-query'
import logo from '@/assets/logo.jpeg'

const inputCls = 'w-full rounded-lg border border-navy/20 bg-white px-3 py-2.5 font-inter text-sm text-navy placeholder:text-muted/50 focus:border-gold focus:outline-none'
const labelCls = 'block font-inter text-[11px] font-semibold uppercase tracking-wider text-slate mb-1.5'
const sectionCls = 'pt-5 border-t border-navy/8'

const CURSOS = ['Pre-kinder', 'Kinder', '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico', 'I° Medio', 'II° Medio', 'III° Medio', 'IV° Medio']

type Hijo = { anio: number; curso_ingreso: string }

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-lg border px-3 py-2 font-inter text-xs font-semibold transition-colors ${active ? 'border-gold bg-gold/10 text-navy' : 'border-navy/15 text-muted hover:border-navy/30'}`}>
      {label}
    </button>
  )
}

export default function SetupEmailPage() {
  const { data: user } = useUser()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const u = user as (typeof user & { rut?: string | null })

  const [email, setEmail] = useState('')
  const [nombrePila, setNombrePila] = useState(u?.nombre_pila ?? '')
  const [rut, setRut] = useState(u?.rut ?? '')
  const [fechaNacimiento, setFechaNacimiento] = useState(u?.fecha_nacimiento ?? '')
  const [sexo, setSexo] = useState(u?.sexo ?? '')
  const [telefono, setTelefono] = useState(u?.telefono ?? '')
  const [ladoPreferido, setLadoPreferido] = useState(u?.lado_preferido ?? '')
  const [mixto, setMixto] = useState(u?.mixto ?? '')
  const [frecuencia, setFrecuencia] = useState(u?.frecuencia_semanal ?? '')
  const [hijos, setHijos] = useState<Hijo[]>((u?.hijos_sg as Hijo[]) ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsEmail = u?.email?.endsWith('@sgpadel.cl')
  const nombre = u?.nombre_pila ?? u?.nombre?.split(' ')[0] ?? 'Jugador'

  const addHijo = () => setHijos(h => [...h, { anio: new Date().getFullYear(), curso_ingreso: '' }])
  const removeHijo = (i: number) => setHijos(h => h.filter((_, idx) => idx !== i))
  const updateHijo = (i: number, curso: string) =>
    setHijos(h => h.map((hijo, idx) => idx === i ? { ...hijo, curso_ingreso: curso } : hijo))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()

    if (needsEmail) {
      if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        setError('Ingresa un correo válido.'); return
      }
      if (trimmedEmail.endsWith('@sgpadel.cl')) {
        setError('Ingresa tu correo personal, no un usuario del sistema.'); return
      }
    }

    setLoading(true)
    setError(null)

    if (u?.id) {
      const patch: Record<string, unknown> = {
        nombre_pila: nombrePila.trim() || null,
        rut: rut.trim() || null,
        fecha_nacimiento: fechaNacimiento || null,
        sexo: sexo || null,
        telefono: telefono.trim() || null,
        lado_preferido: ladoPreferido || null,
        mixto: mixto || null,
        frecuencia_semanal: frecuencia || null,
        hijos_sg: hijos.filter(h => h.curso_ingreso),
        ficha_validada: true,
      }
      if (needsEmail && trimmedEmail) patch.email = trimmedEmail

      const { error: updateErr } = await supabase
        .schema('padel').from('jugadores').update(patch).eq('id', u.id)

      if (updateErr) {
        setError('No se pudo guardar. Intenta nuevamente.')
        setLoading(false)
        return
      }
    }

    await qc.invalidateQueries({ queryKey: ['user'] })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 overflow-hidden rounded-full" style={{ background: '#FFD91C' }}>
            <img src={logo} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="font-manrope text-lg font-black text-navy">Padel<span className="text-gold">SG</span></span>
        </div>

        <h1 className="font-manrope text-2xl font-bold text-navy mb-1">Hola, {nombre} 👋</h1>
        <p className="font-inter text-sm text-slate mb-6">Completa tu ficha antes de entrar. Solo la primera vez.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-defeat/20 bg-defeat/8 px-3.5 py-3">
            <p className="font-inter text-sm text-defeat">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className={labelCls}>Nombre completo</label>
            <div className="rounded-lg border border-navy/10 bg-surface px-3 py-2.5 font-inter text-sm text-muted">{u?.nombre ?? '—'}</div>
          </div>

          <div>
            <label className={labelCls}>¿Cómo te llaman? <span className="normal-case font-normal text-muted/60">(apodo o nombre corto)</span></label>
            <input className={inputCls} placeholder="Ej: Pancho, Caro, Titi…" value={nombrePila} onChange={e => setNombrePila(e.target.value)} />
          </div>

          {/* Identificación */}
          <div className={sectionCls}>
            <label className={labelCls}>RUT</label>
            <input className={inputCls} placeholder="12.345.678-9" value={rut} onChange={e => setRut(e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Fecha de nacimiento</label>
            <input type="date" className={inputCls} value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Sexo</label>
            <div className="flex gap-2">
              <Pill label="Hombre" active={sexo === 'M'} onClick={() => setSexo('M')} />
              <Pill label="Mujer" active={sexo === 'F'} onClick={() => setSexo('F')} />
            </div>
          </div>

          {/* Contacto */}
          <div className={sectionCls}>
            <label className={labelCls}>Teléfono</label>
            <input className={inputCls} placeholder="+56 9 XXXX XXXX" value={telefono} onChange={e => setTelefono(e.target.value)} />
          </div>

          {needsEmail && (
            <div>
              <label className={labelCls}>Tu correo electrónico <span className="text-defeat">*</span></label>
              <input type="email" className={inputCls} placeholder="tu@correo.cl" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              <p className="mt-1 font-inter text-[11px] text-muted">Lo usarás para ingresar la próxima vez.</p>
            </div>
          )}

          {/* Pádel */}
          <div className={sectionCls}>
            <label className={labelCls}>Lado preferido en cancha</label>
            <div className="grid grid-cols-3 gap-2">
              {(['drive', 'reves', 'ambos'] as const).map(lado => (
                <Pill key={lado} active={ladoPreferido === lado} onClick={() => setLadoPreferido(lado)}
                  label={lado === 'drive' ? 'Drive' : lado === 'reves' ? 'Revés' : 'Ambos'} />
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>¿Juegas mixto?</label>
            <div className="flex gap-2">
              {([['si', 'Sí'], ['no', 'No'], ['a_veces', 'A veces']] as const).map(([val, lbl]) => (
                <Pill key={val} label={lbl} active={mixto === val} onClick={() => setMixto(val)} />
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Frecuencia de juego</label>
            <div className="flex flex-wrap gap-2">
              {(['1x/semana', '2x/semana', '3x/semana', '4+/semana'] as const).map(f => (
                <Pill key={f} label={f} active={frecuencia === f} onClick={() => setFrecuencia(f)} />
              ))}
            </div>
          </div>

          {/* Hijos en SG */}
          <div className={sectionCls}>
            <label className={labelCls}>Hijos en Saint George's</label>
            <div className="space-y-2">
              {hijos.map((hijo, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    className={`${inputCls} flex-1`}
                    value={hijo.curso_ingreso}
                    onChange={e => updateHijo(i, e.target.value)}
                  >
                    <option value="">Selecciona curso…</option>
                    {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => removeHijo(i)}
                    className="shrink-0 rounded-lg border border-navy/15 p-2 text-muted hover:border-defeat/40 hover:text-defeat transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addHijo}
                className="flex items-center gap-1.5 font-inter text-xs font-semibold text-slate hover:text-navy transition-colors">
                <Plus className="h-3.5 w-3.5" /> Agregar hijo/a
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (needsEmail ? !email.trim() : false)}
            className="w-full flex h-12 items-center justify-center gap-2 rounded-lg bg-gold font-inter text-sm font-bold text-navy disabled:opacity-50 mt-2"
          >
            {loading ? 'Guardando…' : <>Confirmar mi ficha <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </div>
  )
}
