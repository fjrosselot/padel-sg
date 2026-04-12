import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { registerSchema, type RegisterFormData } from './schemas'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const STEPS = ['Datos personales', 'Vinculación SG', 'Nivel de juego', 'Participación', 'Comentarios', 'Acceso']

const CURSOS = ['PK', 'KK', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°', '12°', 'Egresado']
const CATEGORIAS_H = ['5a', '4a', '3a', 'Open']
const CATEGORIAS_M = ['D', 'C', 'B', 'Open']
const ACTIVIDADES = [
  { value: 'interescolares', label: 'Torneos interescolares' },
  { value: 'torneos_internos', label: 'Torneos internos' },
  { value: 'amistosos', label: 'Amistosos intercolegiales' },
  { value: 'entrenamientos', label: 'Entrenamientos / clases' },
  { value: 'partidos_semana', label: 'Partidos de semana' },
  { value: 'solo_convenio', label: 'Solo usar el convenio' },
]

export function RegisterForm() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gradualidad: 'normal',
      hijos_sg: [],
      intereses_actividades: [],
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = form
  const sexo = watch('sexo')
  const hijossg = watch('hijos_sg') ?? []

  const STEP_FIELDS: (keyof RegisterFormData)[][] = [
    ['nombre', 'email', 'sexo'],
    [],
    ['categoria'],
    ['frecuencia_semanal'],
    [],
    ['password', 'password_confirm'],
  ]

  const nextStep = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setLoading(true)
    setError(null)
    const { error: authError, data: signUpData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    const userId = signUpData?.user?.id
    if (userId) {
      await supabase.schema('padel').from('jugadores').insert({
        id: userId,
        nombre: data.nombre,
        apodo: data.apodo ?? null,
        email: data.email,
        telefono: data.telefono ?? null,
        sexo: data.sexo,
        categoria: data.categoria,
        gradualidad: data.gradualidad,
        mixto: data.mixto ?? null,
        hijos_sg: data.hijos_sg ?? [],
        frecuencia_semanal: data.frecuencia_semanal,
        intereses_actividades: data.intereses_actividades ?? [],
        comentarios_registro: data.comentarios_registro ?? null,
        estado_cuenta: 'pendiente',
        rol: 'jugador',
      })
    }
    navigate('/pendiente')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <BrandLogo />
          <span className="font-inter text-xs text-muted">Paso {step + 1} de {STEPS.length}</span>
        </div>

        <div className="mb-2 h-1.5 rounded-full bg-surface-high">
          <div
            className="h-1.5 rounded-full bg-gold transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <h2 className="mb-6 mt-4 font-manrope text-lg font-bold text-navy">{STEPS[step]}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Paso 0: Datos personales */}
          {step === 0 && (
            <>
              <div>
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input id="nombre" {...register('nombre')} className="mt-1" />
                {errors.nombre && <p className="mt-1 font-inter text-xs text-defeat">{errors.nombre.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register('email')} className="mt-1" />
                {errors.email && <p className="mt-1 font-inter text-xs text-defeat">{errors.email.message}</p>}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" {...register('telefono')} placeholder="+56 9 XXXX XXXX" className="mt-1" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="apodo">Apodo</Label>
                  <Input id="apodo" {...register('apodo')} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Sexo *</Label>
                <div className="mt-2 flex gap-3">
                  {[{ v: 'M', l: 'Masculino' }, { v: 'F', l: 'Femenino' }].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValue('sexo', v as 'M' | 'F')}
                      className={`flex-1 rounded-md border py-2 font-inter text-sm font-medium transition-colors ${
                        sexo === v ? 'border-navy bg-navy text-gold' : 'border-surface-high text-slate'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {errors.sexo && <p className="mt-1 font-inter text-xs text-defeat">{errors.sexo.message}</p>}
              </div>
            </>
          )}

          {/* Paso 1: Vinculación SG */}
          {step === 1 && (
            <div>
              <Label className="mb-2 block">Cursos de tus hijos en Saint George's</Label>
              <p className="mb-3 font-inter text-xs text-slate">Selecciona todos los que apliquen</p>
              <div className="flex flex-wrap gap-2">
                {CURSOS.map((curso) => {
                  const selected = hijossg.some((h) => h.curso_ingreso === curso)
                  return (
                    <button
                      key={curso}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setValue('hijos_sg', hijossg.filter((h) => h.curso_ingreso !== curso))
                        } else {
                          setValue('hijos_sg', [...hijossg, { curso_ingreso: curso, anio: new Date().getFullYear() }])
                        }
                      }}
                      className={`rounded-md px-3 py-1.5 font-inter text-xs font-semibold transition-colors ${
                        selected ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {curso}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Paso 2: Nivel de juego */}
          {step === 2 && (
            <>
              <div>
                <Label className="mb-2 block">Categoría *</Label>
                <div className="flex flex-wrap gap-2">
                  {(sexo === 'F' ? CATEGORIAS_M : CATEGORIAS_H).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setValue('categoria', cat)}
                      className={`rounded-md px-3 py-1.5 font-inter text-sm font-semibold transition-colors ${
                        watch('categoria') === cat ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {errors.categoria && <p className="mt-1 font-inter text-xs text-defeat">{errors.categoria.message}</p>}
              </div>
              <div>
                <Label className="mb-2 block">Gradualidad</Label>
                <div className="flex gap-2">
                  {(['-', 'normal', '+'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setValue('gradualidad', g)}
                      className={`flex-1 rounded-md py-2 font-inter text-sm font-medium transition-colors ${
                        watch('gradualidad') === g ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {g === '-' ? 'Recién llegando (−)' : g === '+' ? 'Subiendo (+)' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">¿Juegas mixto?</Label>
                <div className="flex gap-2">
                  {[{ v: 'si', l: 'Sí' }, { v: 'no', l: 'No' }, { v: 'a_veces', l: 'A veces' }].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValue('mixto', v as 'si' | 'no' | 'a_veces')}
                      className={`flex-1 rounded-md py-2 font-inter text-sm transition-colors ${
                        watch('mixto') === v ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Paso 3: Participación */}
          {step === 3 && (
            <>
              <div>
                <Label className="mb-2 block">Frecuencia semanal *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'menos_1', l: 'Menos de 1 vez' },
                    { v: '1', l: '1 vez' },
                    { v: '2', l: '2 veces' },
                    { v: '3_mas', l: '3 o más veces' },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValue('frecuencia_semanal', v as RegisterFormData['frecuencia_semanal'])}
                      className={`rounded-md py-2.5 font-inter text-sm transition-colors ${
                        watch('frecuencia_semanal') === v ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {errors.frecuencia_semanal && <p className="mt-1 font-inter text-xs text-defeat">{errors.frecuencia_semanal.message}</p>}
              </div>
              <div>
                <Label className="mb-2 block">Actividades de interés</Label>
                <div className="space-y-2">
                  {ACTIVIDADES.map(({ value, label }) => {
                    const selected = (watch('intereses_actividades') ?? []).includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          const curr = watch('intereses_actividades') ?? []
                          setValue('intereses_actividades', selected ? curr.filter((a) => a !== value) : [...curr, value])
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 font-inter text-sm transition-colors ${
                          selected ? 'bg-navy/10 text-navy' : 'bg-surface text-slate'
                        }`}
                      >
                        <span className={`h-4 w-4 rounded border-2 ${selected ? 'border-navy bg-navy' : 'border-muted'}`} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Paso 4: Comentarios */}
          {step === 4 && (
            <div>
              <Label htmlFor="comentarios">Comentarios adicionales</Label>
              <p className="mb-2 font-inter text-xs text-slate">Horarios preferidos, si buscas pareja, etc.</p>
              <textarea
                id="comentarios"
                {...register('comentarios_registro')}
                rows={4}
                className="w-full rounded-md bg-surface px-3 py-2 font-inter text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                placeholder="Ej: Juego los martes y jueves tarde..."
              />
            </div>
          )}

          {/* Paso 5: Contraseña */}
          {step === 5 && (
            <>
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input id="password" type="password" {...register('password')} className="mt-1" />
                {errors.password && <p className="mt-1 font-inter text-xs text-defeat">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="password_confirm">Confirmar contraseña *</Label>
                <Input id="password_confirm" type="password" {...register('password_confirm')} className="mt-1" />
                {errors.password_confirm && <p className="mt-1 font-inter text-xs text-defeat">{errors.password_confirm.message}</p>}
              </div>
              {error && (
                <div className="rounded-md bg-defeat/10 p-3 font-inter text-sm text-defeat">{error}</div>
              )}
              <div className="rounded-md border-l-2 border-gold bg-warning-bg p-3 font-inter text-xs text-slate">
                Tu solicitud será revisada por el administrador. Recibirás un email cuando tu cuenta sea aprobada.
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            {step > 0 && (
              <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Atrás
              </Button>
            )}
            <div className="ml-auto">
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep} className="bg-gold text-navy hover:bg-gold-dim">
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="bg-gold text-navy hover:bg-gold-dim">
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </Button>
              )}
            </div>
          </div>
        </form>

        <p className="mt-4 text-center font-inter text-xs text-muted">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-navy underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  )
}
