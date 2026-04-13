import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { wizardLigaSchema, type WizardLigaData } from './schema'
import StepConfig from './StepConfig'
import StepParticipantes from './StepParticipantes'
import StepConfirmar from './StepConfirmar'
import { Button } from '../../../components/ui/button'

const STEPS = ['Configuración', 'Jugadores', 'Confirmar']

interface Props {
  onClose: () => void
  onCreated?: () => void
}

export default function LigaWizard({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const methods = useForm<WizardLigaData>({
    resolver: zodResolver(wizardLigaSchema),
    defaultValues: {
      nombre: '',
      formato: 'round_robin',
      fecha_inicio: '',
      fecha_fin: '',
      jugadores_ids: [],
    },
    mode: 'onChange',
  })

  const StepComponents = [StepConfig, StepParticipantes, StepConfirmar]
  const CurrentStep = StepComponents[step]

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <p className={`text-xs mt-1 text-center ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <CurrentStep onCreated={() => { onCreated?.(); onClose() }} />
      </FormProvider>

      <div className="flex gap-3 pt-4 border-t">
        {step > 0 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Atrás</Button>}
        <Button variant="outline" onClick={onClose} className="ml-auto mr-0">Cancelar</Button>
        {step < STEPS.length - 1 && (
          <Button onClick={() => setStep(s => s + 1)} className="bg-navy text-white">Siguiente</Button>
        )}
      </div>
    </div>
  )
}
