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
            <div className={`h-1 rounded-full ${i <= step ? 'bg-gold' : 'bg-surface-high'}`} />
            <p className={`text-xs mt-1 text-center ${i === step ? 'text-navy font-medium' : 'text-muted'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <CurrentStep onCreated={() => { onCreated?.(); onClose() }} />
      </FormProvider>

      <div className="flex gap-3 pt-4 border-t border-surface-high">
        {step > 0 && <Button variant="outline" onClick={() => setStep(s => s - 1)} className="border border-slate/30 text-slate bg-transparent hover:bg-surface">Atrás</Button>}
        <Button variant="outline" onClick={onClose} className="ml-auto mr-0 border border-slate/30 text-slate bg-transparent hover:bg-surface">Cancelar</Button>
        {step < STEPS.length - 1 && (
          <Button
            onClick={async () => {
              const fieldsPerStep: Array<(keyof WizardLigaData)[]> = [
                ['nombre', 'formato', 'fecha_inicio'],
                ['jugadores_ids'],
              ]
              const valid = await methods.trigger(fieldsPerStep[step])
              if (valid) setStep(s => s + 1)
            }}
            className="bg-navy text-white font-bold"
          >Siguiente</Button>
        )}
      </div>
    </div>
  )
}
