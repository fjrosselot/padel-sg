import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { registerSchema, type RegisterFormData } from './schemas'

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

const inputCls = 'w-full rounded-lg border border-navy-mid bg-navy px-4 py-3 font-inter text-sm text-white placeholder-slate transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold'
const labelCls = 'mb-1.5 block font-inter text-xs font-medium uppercase tracking-widest text-muted'

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 font-inter text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 ${
        active ? 'bg-gold text-navy' : 'border border-navy-mid bg-navy text-muted hover:border-gold/30 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export function RegisterForm() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { gradualidad: 'normal', hijos_sg: [], intereses_actividades: [] },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = form
  const sexo = watch('sexo')
  const hijossg = watch('hijos_sg') ?? []

  const STEP_FIELDS: (keyof RegisterFormData)[][] = [
    ['nombre_pila', 'apellido', 'email', 'sexo'], [], ['categoria'], ['frecuencia_semanal'], [], ['password', 'password_confirm'],
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
      const np = data.nombre_pila.trim()
      const ap = data.apellido.trim()
      await supabase.schema('padel').from('jugadores').insert({
        id: userId,
        nombre: ap ? `${np} ${ap}` : np,
        nombre_pila: np,
        apellido: ap,
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(245,197,24,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandLogo variant="compact" />
          <p className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Solicitar acceso
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-navy-mid bg-navy-mid/50 px-7 py-7 backdrop-blur-sm">
          {/* Header con progreso */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-manrope text-base font-bold text-white">{STEPS[step]}</h2>
              <span className="font-inter text-xs text-muted">{step + 1} / {STEPS.length}</span>
            </div>
            <div className="h-1 rounded-full bg-navy">
              <div
                className="h-1 rounded-full bg-gold transition-all duration-300"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Paso 0: Datos personales */}
            {step === 0 && (
              <>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="nombre_pila" className={labelCls}>Nombre *</label>
                    <input id="nombre_pila" {...register('nombre_pila')} className={inputCls} placeholder="María José" />
                    {errors.nombre_pila && <p className="mt-1 font-inter text-xs text-defeat">{errors.nombre_pila.message}</p>}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="apellido" className={labelCls}>Apellido *</label>
                    <input id="apellido" {...register('apellido')} className={inputCls} placeholder="González" />
                    {errors.apellido && <p className="mt-1 font-inter text-xs text-defeat">{errors.apellido.message}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className={labelCls}>Email *</label>
                  <input id="email" type="email" {...register('email')} className={inputCls} placeholder="tu@email.com" />
                  {errors.email && <p className="mt-1 font-inter text-xs text-defeat">{errors.email.message}</p>}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="telefono" className={labelCls}>Teléfono</label>
                    <input id="telefono" {...register('telefono')} placeholder="+56 9..." className={inputCls} />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="apodo" className={labelCls}>Apodo</label>
                    <input id="apodo" {...register('apodo')} className={inputCls} />
                  </div>
                </div>
                <div>
                  <p className={labelCls}>Sexo *</p>
                  <div className="flex gap-2">
                    {[{ v: 'M', l: 'Masculino' }, { v: 'F', l: 'Femenino' }].map(({ v, l }) => (
                      <ToggleBtn key={v} active={sexo === v} onClick={() => setValue('sexo', v as 'M' | 'F')}>
                        {l}
                      </ToggleBtn>
                    ))}
                  </div>
                  {errors.sexo && <p className="mt-1 font-inter text-xs text-defeat">{errors.sexo.message}</p>}
                </div>
              </>
            )}

            {/* Paso 1: Vinculación SG */}
            {step === 1 && (
              <div>
                <p className={labelCls}>Cursos de tus hijos en SG</p>
                <p className="mb-3 font-inter text-xs text-slate">Selecciona todos los que apliquen</p>
                <div className="flex flex-wrap gap-2">
                  {CURSOS.map((curso) => {
                    const selected = hijossg.some((h) => h.curso_ingreso === curso)
                    return (
                      <ToggleBtn
                        key={curso}
                        active={selected}
                        onClick={() => {
                          if (selected) setValue('hijos_sg', hijossg.filter((h) => h.curso_ingreso !== curso))
                          else setValue('hijos_sg', [...hijossg, { curso_ingreso: curso, anio: new Date().getFullYear() }])
                        }}
                      >
                        {curso}
                      </ToggleBtn>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Paso 2: Nivel de juego */}
            {step === 2 && (
              <>
                <div>
                  <p className={labelCls}>Categoría *</p>
                  <div className="flex flex-wrap gap-2">
                    {(sexo === 'F' ? CATEGORIAS_M : CATEGORIAS_H).map((cat) => (
                      <ToggleBtn key={cat} active={watch('categoria') === cat} onClick={() => setValue('categoria', cat)}>
                        {cat}
                      </ToggleBtn>
                    ))}
                  </div>
                  {errors.categoria && <p className="mt-1 font-inter text-xs text-defeat">{errors.categoria.message}</p>}
                </div>
                <div>
                  <p className={labelCls}>Gradualidad</p>
                  <div className="flex gap-2">
                    {(['-', 'normal', '+'] as const).map((g) => (
                      <ToggleBtn key={g} active={watch('gradualidad') === g} onClick={() => setValue('gradualidad', g)}>
                        {g === '-' ? 'Recién (−)' : g === '+' ? 'Subiendo (+)' : 'Normal'}
                      </ToggleBtn>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={labelCls}>¿Juegas mixto?</p>
                  <div className="flex gap-2">
                    {[{ v: 'si', l: 'Sí' }, { v: 'no', l: 'No' }, { v: 'a_veces', l: 'A veces' }].map(({ v, l }) => (
                      <ToggleBtn key={v} active={watch('mixto') === v} onClick={() => setValue('mixto', v as 'si' | 'no' | 'a_veces')}>
                        {l}
                      </ToggleBtn>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Paso 3: Participación */}
            {step === 3 && (
              <>
                <div>
                  <p className={labelCls}>Frecuencia semanal *</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: 'menos_1', l: 'Menos de 1 vez' },
                      { v: '1', l: '1 vez' },
                      { v: '2', l: '2 veces' },
                      { v: '3_mas', l: '3 o más' },
                    ].map(({ v, l }) => (
                      <ToggleBtn key={v} active={watch('frecuencia_semanal') === v} onClick={() => setValue('frecuencia_semanal', v as RegisterFormData['frecuencia_semanal'])}>
                        {l}
                      </ToggleBtn>
                    ))}
                  </div>
                  {errors.frecuencia_semanal && <p className="mt-1 font-inter text-xs text-defeat">{errors.frecuencia_semanal.message}</p>}
                </div>
                <div>
                  <p className={labelCls}>Actividades de interés</p>
                  <div className="space-y-2">
                    {ACTIVIDADES.map(({ value, label }) => {
                      const selected = (watch('intereses_actividades') ?? []).includes(value)
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            const curr = watch('intereses_actividades') ?? []
                            setValue('intereses_actividades', selected ? curr.filter((a) => a !== value) : [...curr, value])
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-inter text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                            selected ? 'bg-gold/10 text-gold' : 'border border-navy-mid bg-navy text-muted hover:border-gold/30'
                          }`}
                        >
                          <span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-gold bg-gold' : 'border-slate'}`}>
                            {selected && (
                              <svg className="h-2.5 w-2.5 text-navy" viewBox="0 0 10 10" fill="currentColor">
                                <path d="M1.5 5L4 7.5 8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                              </svg>
                            )}
                          </span>
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
                <label htmlFor="comentarios" className={labelCls}>Comentarios adicionales</label>
                <p className="mb-2 font-inter text-xs text-slate">Horarios preferidos, si buscas pareja, etc.</p>
                <textarea
                  id="comentarios"
                  {...register('comentarios_registro')}
                  rows={4}
                  className="w-full rounded-lg border border-navy-mid bg-navy px-4 py-3 font-inter text-sm text-white placeholder-slate transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Ej: Juego los martes y jueves tarde..."
                />
              </div>
            )}

            {/* Paso 5: Contraseña */}
            {step === 5 && (
              <>
                <div>
                  <label htmlFor="password" className={labelCls}>Contraseña *</label>
                  <input id="password" type="password" {...register('password')} className={inputCls} placeholder="••••••••" />
                  {errors.password && <p className="mt-1 font-inter text-xs text-defeat">{errors.password.message}</p>}
                </div>
                <div>
                  <label htmlFor="password_confirm" className={labelCls}>Confirmar contraseña *</label>
                  <input id="password_confirm" type="password" {...register('password_confirm')} className={inputCls} placeholder="••••••••" />
                  {errors.password_confirm && <p className="mt-1 font-inter text-xs text-defeat">{errors.password_confirm.message}</p>}
                </div>
                {error && (
                  <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">{error}</div>
                )}
                <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
                  <p className="font-inter text-xs text-muted">
                    Tu solicitud será revisada por el administrador. Recibirás un email al ser aprobado.
                  </p>
                </div>
              </>
            )}

            {/* Navegación */}
            <div className="flex items-center justify-between pt-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="font-inter text-sm text-muted transition-colors hover:text-white"
                >
                  Atrás
                </button>
              ) : <div />}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-lg bg-gold px-5 py-2.5 font-manrope text-sm font-bold text-navy transition-all hover:bg-gold-dim active:scale-[0.98]"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-gold px-5 py-2.5 font-manrope text-sm font-bold text-navy transition-all hover:bg-gold-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="mt-6 text-center font-inter text-xs text-slate">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-muted transition-colors hover:text-gold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
