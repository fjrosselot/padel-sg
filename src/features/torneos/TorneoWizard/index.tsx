import { useState } from 'react'
import { useForm, FormProvider, useFormContext, useWatch } from 'react-hook-form'
import type { WizardData } from './schema'
import { stepTipoSchema, stepCategoriasSchema } from './schema'
import StepTipo from './StepTipo'
import StepCategorias from './StepCategorias'
import StepFixture from './StepFixture'
import StepConfirmar from './StepConfirmar'
import { Button } from '../../../components/ui/button'

// Indices: 0=Tipo, 1=Categorías, 2=Fixture, 3=Confirmar
const STEPS = ['Tipo', 'Categorías', 'Fixture', 'Confirmar']
const STEP_SCHEMAS = [stepTipoSchema, stepCategoriasSchema, null, null]
const StepComponents = [StepTipo, StepCategorias, StepFixture, StepConfirmar]

interface Props {
  onClose: () => void
  onCreated?: () => void
}

function WizardInner({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const { getValues, trigger } = useFormContext<WizardData>()
  const tipo = useWatch<WizardData, 'tipo'>({ name: 'tipo' })
  const esExterno = tipo === 'externo'

  async function handleNext() {
    const schema = STEP_SCHEMAS[step]
    if (schema) {
      const result = schema.safeParse(getValues())
      if (!result.success) { trigger(); return }
    }
    const next = step === 1 && esExterno ? 3 : step + 1
    setStep(Math.min(next, STEPS.length - 1))
  }

  function handleBack() {
    const prev = step === 3 && esExterno ? 1 : step - 1
    setStep(Math.max(prev, 0))
  }

  const CurrentStep = StepComponents[step]

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {STEPS.map((label, i) => {
          const isSkipped = esExterno && i === 2
          const isActive = i === step
          const isPast = i < step && !isSkipped
          return (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full transition-colors ${isPast || isActive ? 'bg-gold' : 'bg-surface-high'}`} />
              <p className={`text-xs mt-1 text-center ${isSkipped ? 'text-muted/40 line-through' : isActive ? 'text-navy font-medium' : 'text-muted'}`}>
                {label}
              </p>
            </div>
          )
        })}
      </div>

      <CurrentStep onCreated={onCreated} />

      <div className="flex gap-3 pt-4">
        {step > 0 && <Button variant="outline" onClick={handleBack} className="border border-slate/30 text-slate bg-transparent hover:bg-surface rounded-lg">Atrás</Button>}
        <Button variant="outline" onClick={onClose} className="ml-auto mr-0 border border-slate/30 text-slate bg-transparent hover:bg-surface rounded-lg">Cancelar</Button>
        {step < STEPS.length - 1 && (
          <Button onClick={handleNext} className="bg-navy text-gold font-bold rounded-lg">Siguiente</Button>
        )}
      </div>
    </div>
  )
}

export default function TorneoWizard({ onClose, onCreated }: Props) {
  const methods = useForm<WizardData>({
    defaultValues: {
      tipo: 'interno',
      nombre: '',
      fecha_inicio: '',
      categorias: [],
      con_grupos: true,
      parejas_por_grupo: 4,
      cuantos_avanzan: 2,
      con_consolacion: true,
      con_tercer_lugar: true,
      duracion_partido: 60,
      pausa_entre_partidos: 15,
      num_canchas: 2,
      hora_inicio: '09:00',
      fixture_compacto: false,
    },
    mode: 'onChange',
  })

  return (
    <FormProvider {...methods}>
      <WizardInner onClose={onClose} onCreated={onCreated} />
    </FormProvider>
  )
}
