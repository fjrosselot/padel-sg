import { z } from 'zod'

export const wizardLigaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  formato: z.enum(['round_robin', 'escalerilla']),
  temporada_id: z.string().uuid().optional(),
  fecha_inicio: z.string().min(1, 'Fecha inicio requerida'),
  fecha_fin: z.string().optional(),
  jugadores_ids: z.array(z.string().uuid()).min(2, 'Mínimo 2 jugadores'),
})

export type WizardLigaData = z.infer<typeof wizardLigaSchema>
