import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import type { WizardData } from './schema'
import { stepTipoSchema, stepCategoriasSchema } from './schema'
import StepTipo from './StepTipo'
import StepCategorias from './StepCategorias'
import { Button } from '../../../components/ui/button'

const STEPS = ['Tipo', 'Categorías', 'Fixture', 'Confirmar']
const STEP_SCHEMAS = [stepTipoSchema, stepCategoriasSchema, null, null]

// Placeholder components for steps 3 and 4 — will be replaced in Task 6
function StepFixturePlaceholder({ onCreated: _ }: { onCreated?: () => void }) {
  return <div className="text-muted py-8 text-center">Parámetros del fixture (próximamente)</div>
}
function StepConfirmarPlaceholder({ onCreated: _ }: { onCreated?: () => void }) {
  return <div className="text-muted py-8 text-center">Confirmar (próximamente)</div>
}

interface Props {
  onClose: () => void
  onCreated?: () => void
}

export default function TorneoWizard({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const methods = useForm<WizardData>({
    defaultValues: {
      tipo: 'interno',
      nombre: '',
      fecha_inicio: '',
      categorias: [],
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

  async function handleNext() {
    const schema = STEP_SCHEMAS[step]
    if (schema) {
      const values = methods.getValues()
      const result = schema.safeParse(values)
      if (!result.success) {
        methods.trigger()
        return
      }
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const StepComponents = [StepTipo, StepCategorias, StepFixturePlaceholder, StepConfirmarPlaceholder]
  const CurrentStep = StepComponents[step]

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <p className={`text-xs mt-1 text-center ${i === step ? 'text-blue-600 font-medium' : 'text-muted'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <CurrentStep onCreated={onCreated} />
      </FormProvider>

      <div className="flex gap-3 pt-4 border-t">
        {step > 0 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Atrás</Button>}
        <Button variant="outline" onClick={onClose} className="ml-auto mr-0">Cancelar</Button>
        {step < STEPS.length - 1 && (
          <Button onClick={handleNext} className="bg-navy text-white">Siguiente</Button>
        )}
      </div>
    </div>
  )
}
