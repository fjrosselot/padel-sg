# Spec: Desafío Sembrado (vs_colegio)

**Fecha:** 2026-04-23  
**Estado:** Aprobado por usuario

---

## Contexto

El formato `desafio_puntos` existe pero `pareja2` siempre es `null` — el rival nunca se asigna. Este spec añade `desafio_sembrado`: un nuevo formato exclusivo para torneos `vs_colegio` donde ambos colegios definen N parejas rankeadas por seed, se empareja seed vs seed (1 partido por pareja), y gana el colegio con más puntos.

---

## Migración DB

```sql
ALTER TABLE padel.inscripciones ADD COLUMN sembrado integer;
```

Un entero nullable. El admin lo asigna manualmente desde RosterAdmin. Sin restricción UNIQUE — el admin controla la consistencia.

---

## Cambios de tipos

### `src/lib/fixture/types.ts`

Agregar `'desafio_sembrado'` a los enums de formato:

```ts
formato?: 'americano_grupos' | 'desafio_puntos' | 'desafio_sembrado'
```

Afecta: `CategoriaFixture.formato`, `CategoriaConfig.formato`.

Agregar campo opcional a `CategoriaConfig` y `CategoriaFixture`:

```ts
rival_pairs?: string[]   // nombres en orden de seed, ej. ["García / López", "Pérez / Martín"]
```

### `src/features/torneos/TorneoWizard/schema.ts`

```ts
formato: z.enum(['americano_grupos', 'desafio_puntos', 'desafio_sembrado']).optional().default('americano_grupos')
```

---

## Componentes a crear / modificar

| Archivo | Acción |
|---------|--------|
| `src/lib/fixture/types.ts` | Modificar — añadir `'desafio_sembrado'` a enums + `rival_pairs` a interfaces |
| `src/lib/fixture/engine.ts` | Modificar — añadir `buildDesafioSembradoFixture` |
| `src/features/torneos/TorneoWizard/schema.ts` | Modificar — añadir valor al enum de formato |
| `src/features/torneos/TorneoWizard/StepCategorias.tsx` | Modificar — mostrar opción "Desafío sembrado" solo cuando tipo === 'vs_colegio' |
| `src/features/torneos/TorneoWizard/StepFixture.tsx` | Modificar — ocultar grupos/consolación/playoffs para desafio_sembrado |
| `src/features/torneos/RosterAdmin.tsx` | Modificar — UI de seed assignment para categorías desafio_sembrado |
| `src/features/torneos/SembradoPanel.tsx` | Crear — subcomponente del panel izquierdo (SG) + derecho (Rival) |
| `src/features/torneos/DesafioView.tsx` | Modificar — mostrar label "Sembrado N" por partido |
| `src/features/torneos/TorneoDetalle.tsx` | Modificar — pasar `sembrados` al generar fixture para desafio_sembrado |

---

## Sección 1 — Wizard

### StepCategorias
- El selector de formato muestra `<option value="desafio_sembrado">Desafío sembrado</option>` **solo cuando** `tipo === 'vs_colegio'` (leído via `useFormContext`)
- Si el usuario cambia el tipo a algo distinto de `vs_colegio`, las categorías con `desafio_sembrado` se resetean a `americano_grupos`

### StepFixture
- Si **todas** las categorías son `desafio_sembrado`: ocultar sección "Formato" (Grupos RR, Copa Plata, 3er lugar, Fixture compacto) y sección de "Parejas / grupo" / "Avanzan". Solo mostrar Canchas, Hora, Duración, Pausa.
- La simulación para `desafio_sembrado` muestra N partidos para N parejas (sin rotaciones). Usa la misma lógica que `desafio_puntos` en `simular()`.

---

## Sección 2 — Motor de fixture

### `buildDesafioSembradoFixture`

```ts
export function buildDesafioSembradoFixture(
  cat: CategoriaConfig,
  sgParejas: ParejaFixture[],     // ordenadas por sembrado ASC
  rivalNames: string[],            // en orden de seed (index 0 = seed 1)
  config: ConfigFixture
): CategoriaFixture
```

- Genera N partidos donde N = `min(sgParejas.length, rivalNames.length)`
- Partido i:
  - `pareja1 = sgParejas[i]`
  - `pareja2 = { id: `rival_${i}`, nombre: rivalNames[i], jugador1_id: null, jugador2_id: null, elo1: 0, elo2: 0 }`
  - `fase = 'desafio'`, `numero = i + 1`
- Scheduling: `cancha = (i % num_canchas) + 1`, `turno` calculado igual que en `buildDesafioFixture`
- Retorna `CategoriaFixture` con `formato: 'desafio_sembrado'`, `grupos: []`, `faseEliminatoria: []`, `consola: []`, `partidos: [...]`, `rival_pairs: rivalNames`

### Integración en TorneoDetalle

Cuando se genera el fixture para una categoría `desafio_sembrado`:
1. Leer inscripciones con `sembrado IS NOT NULL` para esa categoría, ordenadas por `sembrado ASC`
2. Leer `cat.rival_pairs` del JSON de categorias
3. Llamar `buildDesafioSembradoFixture(cat, sgParejas, cat.rival_pairs ?? [], config)`

---

## Sección 3 — RosterAdmin (SembradoPanel)

Se muestra debajo de la lista de inscripciones cuando `categoria.formato === 'desafio_sembrado'` y el torneo no está `finalizado`.

### Layout

Dos columnas lado a lado:

**Columna SG (izquierda)**
- Título: "Sembrado SG"
- Lista de inscripciones `confirmada` ordenadas por `sembrado ASC` (si no tienen sembrado, por ranking de la categoría como sugerencia, luego por nombre)
- Cada fila: número de seed (#1, #2...) + nombre de pareja + badge ranking si aplica + botones ↑↓ para reordenar
- Botón "Guardar orden" → `PATCH inscripciones?id=eq.{id}` con `sembrado = index + 1` para cada inscripción en orden

**Columna Rival (derecha)**
- Título: "Sembrado {colegio_rival}"
- N inputs de texto, donde N = número de inscritos SG confirmados
- Label: "Sembrado 1", "Sembrado 2", etc.
- Placeholder: "Apellido / Apellido"
- Botón "Guardar rival" → `PATCH torneos?id=eq.{torneoId}` actualizando `rival_pairs` dentro del JSON de `categorias` para esa categoría

### Comportamiento
- Ambos "Guardar" son independientes (no un solo submit)
- Si `sembrado` ya está asignado, muestra el orden guardado al cargar
- `invalidateQueries(['torneo', torneoId])` y `invalidateQueries(['inscripciones', torneoId])` en onSuccess de cada save
- No visible para inscripciones en estado `espera` o `rechazada`

---

## Sección 4 — DesafioView

En `PartidoRow` (o directamente en `DesafioView`), para torneos `desafio_sembrado`, mostrar el label "Sembrado {partido.numero}" encima o al lado de los nombres de pareja.

El campo `partido.numero` ya existe y es el índice del seed (1-based).

---

## Decisiones de diseño

- **Sin restricción UNIQUE en `sembrado`**: el admin controla. Si dos inscripciones tienen el mismo seed, se toma el primero en orden de ID. El sistema no bloquea errores de duplicado — el admin los ve visualmente.
- **Rival como nombres libres**: `pareja2` en el fixture tiene `jugador1_id: null`, `jugador2_id: null`. No se calcula ELO para el rival.
- **`rival_pairs` en `categorias` JSON**: se guarda en `CategoriaConfig` durante la fase de inscripción. Al generar fixture, se migra a `CategoriaFixture.rival_pairs`.
- **N partidos = min(SG, Rival)**: si hay 4 parejas SG pero solo 3 rival cargadas, se generan 3 partidos. El sistema no bloquea — el admin ve el desbalance en el panel.
- **Sugerencia por ranking**: al cargar `SembradoPanel`, si ninguna inscripción tiene `sembrado`, se ordenan por `rankPos` (del hook `usePlayerRankings` o del rankingMap ya disponible en RosterAdmin).
