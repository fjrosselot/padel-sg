# Spec: Edición y Borrado de Torneos

**Fecha:** 2026-04-23  
**Estado:** Aprobado por usuario

---

## Contexto

`TorneoDetalle` permite transiciones de estado y carga de resultados, pero no existe edición de datos ni borrado. `TorneosList` solo tiene creación. Este spec añade tres capacidades admin: editar datos del torneo, reemplazar jugadores en parejas, y eliminar torneos con confirmación.

---

## Componentes a crear / modificar

| Archivo | Acción |
|---------|--------|
| `src/features/torneos/EditTorneoModal.tsx` | Crear — modal de edición de torneo |
| `src/features/torneos/EditParejaModal.tsx` | Crear — modal de reemplazo/renombrado de pareja |
| `src/features/torneos/TorneoDetalle.tsx` | Modificar — botón Editar en header + Danger Zone al fondo |
| `src/features/torneos/RosterAdmin.tsx` | Modificar — botón lápiz por pareja |

---

## Sección 1 — EditTorneoModal

### Trigger
Botón `Editar` en el header de `TorneoDetalle`, visible solo cuando `isAdmin`. Abre `EditTorneoModal` (Dialog de shadcn/ui).

### Campos siempre editables
- `nombre` (text input)
- `fecha_inicio` (date input)
- `colegio_rival` (text input, solo visible si `tipo === 'vs_colegio'`)

### Campos solo en estado `borrador`
- `tipo`: selector radio/select (Interno / vs Colegio / Externo)
- **Categorías:** lista de categorías actuales con botón eliminar por cada una + botón "Agregar categoría" con los mismos preset chips del `TorneoWizard/StepCategorias`
- **Config fixture:** campos numéricos/text: `duracion_partido`, `pausa_entre_partidos`, `num_canchas`, `hora_inicio`

### Comportamiento
- Carga los valores actuales del torneo al abrir
- Validación mínima: nombre no vacío, fecha válida
- Save: `PATCH torneos?id=eq.{id}` con los campos modificados
- `onSuccess`: `invalidateQueries(['torneo', id])` + `invalidateQueries(['torneos'])` + cerrar modal

---

## Sección 2 — EditParejaModal

### Trigger
Ícono lápiz (`Pencil`) por fila de pareja en `RosterAdmin`, visible solo cuando `isAdmin`.

### Tabs

**Tab "Renombrar"**
- Campo de texto libre con el nombre actual de la pareja (ej. `"Rosselot / García"`)
- Save: PATCH `torneos` actualizando el `nombre` de la pareja correspondiente en `torneos.categorias` (fixture JSON)
- No toca la tabla `inscripciones`

**Tab "Reemplazar jugador"** (deshabilitado si estado `finalizado`)
- Radio: "Reemplazar Jugador 1" / "Reemplazar Jugador 2"
- `PlayerCombobox` (componente existente en `src/features/torneos/PlayerCombobox.tsx`) para seleccionar el nuevo jugador
- Save:
  1. PATCH `inscripciones?id=eq.{inscripcionId}` → actualiza `jugador1_id` o `jugador2_id`
  2. PATCH `torneos?id=eq.{torneoId}` → reconstruye el nombre de pareja en `torneos.categorias` como `"${nuevoJugador.nombre} / ${otroJugador.nombre}"`
- `onSuccess`: `invalidateQueries(['torneo', torneoId])` + `invalidateQueries(['inscripciones', torneoId])`

### Nombre de pareja reconstruido
El nombre se reconstruye como `apellido + ", " + nombre_pila` de cada jugador, separados por ` / `. Si el jugador no tiene `nombre_pila`, usar `nombre` completo como fallback.

---

## Sección 3 — Danger Zone (eliminar torneo)

### Ubicación
Al fondo de `TorneoDetalle`, visible solo para admin. Separada visualmente con `border-t border-defeat/20` y fondo `bg-defeat/5`.

### Mensaje de impacto según estado
| Estado | Texto |
|--------|-------|
| `borrador` | "Se eliminará el torneo y su configuración." |
| `inscripcion` | "Se eliminará el torneo y todas las inscripciones asociadas." |
| `en_curso` / `finalizado` | "Se eliminará el torneo, inscripciones, partidos y resultados registrados." |

### Flujo
1. Botón "Eliminar torneo" (rojo, `text-defeat`) → abre `Dialog` de confirmación inline (no componente separado — Dialog dentro de TorneoDetalle)
2. Dialog muestra:
   - Nombre del torneo en `text-defeat font-bold`
   - Mensaje de impacto
   - Checkbox: "Entiendo que esta acción es irreversible"
   - Botón "Eliminar definitivamente" habilitado solo cuando checkbox está marcado
3. Al confirmar: `DELETE torneos?id=eq.{id}` via `padelApi.delete` (existente en `src/lib/padelApi.ts`)
4. `onSuccess`: `navigate('/torneos')` + `invalidateQueries(['torneos'])`

### Cascade
Las `inscripciones` tienen FK a `torneos.id` con `ON DELETE CASCADE` (ya definido en el schema). No se necesita lógica adicional.

---

## Decisiones de diseño

- **Sin reutilizar TorneoWizard:** el wizard tiene 4 pasos con lógica de validación acoplada a la creación. La edición usa campos simples en un modal — más predecible y fácil de mantener.
- **Nombre de pareja en fixture JSON:** el fixture se guarda como JSON en `torneos.categorias`. Al reemplazar jugador, se actualiza el campo `nombre` de la `ParejaFixture` correspondiente buscando por `pareja.id === inscripcion.id`.
- **No se recalcula ELO al reemplazar:** el ELO del nuevo jugador solo se ve afectado cuando se carguen resultados de partidos futuros. Partidos ya jugados no se retroactivan.
- **Cascade delete:** se confía en el FK de la DB. No se hacen deletes manuales de inscripciones ni partidos desde el frontend.
- **Dialog de confirmación inline:** no se crea `ConfirmDeleteModal` como componente separado — Dialog state en `TorneoDetalle` con `useState` es suficiente.
