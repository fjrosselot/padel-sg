import { z } from 'zod'

export const stepTipoSchema = z.object({
  tipo: z.enum(['interno', 'vs_colegio', 'externo']),
  nombre: z.string().min(1, 'Nombre requerido'),
  fecha_inicio: z.string().min(1, 'Fecha requerida'),
  colegio_rival: z.string().optional(),
})

export const categoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  num_parejas: z.number().min(2).max(64),
  sexo: z.enum(['M', 'F', 'Mixto']),
  formato: z.enum(['americano_grupos', 'desafio_puntos']).optional().default('americano_grupos'),
})

export const stepCategoriasSchema = z.object({
  categorias: z.array(categoriaSchema).min(1, 'Al menos una categoría'),
})

export const stepFixtureSchema = z.object({
  parejas_por_grupo: z.number().min(3).max(8),
  cuantos_avanzan: z.number().min(1).max(4),
  con_consolacion: z.boolean(),
  con_tercer_lugar: z.boolean(),
  duracion_partido: z.number().min(30).max(120),
  pausa_entre_partidos: z.number().min(0).max(60),
  num_canchas: z.number().min(1).max(20),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  fixture_compacto: z.boolean(),
})

export const wizardSchema = stepTipoSchema
  .merge(stepCategoriasSchema)
  .merge(stepFixtureSchema)

export type WizardData = z.infer<typeof wizardSchema>
export type StepTipoData = z.infer<typeof stepTipoSchema>
export type StepCategoriasData = z.infer<typeof stepCategoriasSchema>
export type StepFixtureData = z.infer<typeof stepFixtureSchema>
