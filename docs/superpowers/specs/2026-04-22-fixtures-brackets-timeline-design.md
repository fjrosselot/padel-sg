# Spec: Fixtures, Brackets y Timeline de Torneos

**Fecha:** 2026-04-22  
**Estado:** Aprobado por usuario

---

## Contexto

`TorneoDetalle` actualmente muestra el fixture como una lista plana de partidos por grupo (`FixtureView.tsx`). No existe visualización de bracket ni horario. El motor de fixture ya genera los datos correctos (`engine.ts`) y los tipos están definidos (`types.ts`). Este spec añade tres vistas organizadas en tabs.

Formatos soportados: `americano_grupos` (grupos + eliminatoria) y `desafio_puntos` (marcador SG vs Rival — ya tiene vista propia, no cambia).

---

## Estructura general

Dentro de `TorneoDetalle`, cuando el formato es `americano_grupos`, se muestran **tres tabs**:

| Tab | Componente | Descripción |
|-----|-----------|-------------|
| Fixture | `FixtureTab` | Grupos con tabla de posiciones + resultados |
| Bracket | `BracketTab` | Árbol visual de eliminatoria + Copa Plata |
| Horario | `HorarioTab` | Grilla transpuesta: canchas ↕, tiempo → |

Para `desafio_puntos` se mantiene la `DesafioView` actual sin tabs.

---

## Tab 1 — Fixture

Reemplaza al `FixtureView` actual. Mantiene la misma lógica pero mejora el diseño:

- Sección por grupo (`Grupo A`, `Grupo B`, …)
- Cada partido en una fila: hora · cancha · Pareja 1 vs Pareja 2 · resultado
- Ganador destacado en negativo (`font-semibold text-navy`)
- Badge de fase para partidos eliminatorios (`Cuartos`, `Semifinal`, `Final`)
- Botón "Cargar resultado" para admin si el partido no tiene resultado y no está bloqueado
- Icono Lock/Unlock para bloquear resultados (admin)

No hay cambios en la lógica de datos, solo rediseño visual alineado al design system.

---

## Tab 2 — Bracket

### Componente: `BracketTab`

Árbol horizontal con SVG para las líneas conectoras entre rondas.

**Estructura visual:**
```
[Cuartos] ──SVG── [Semis] ──SVG── [Final] 🏆
```

**Match card** (por partido):
- Dos filas: una por pareja
- Cada fila: `nombre de pareja` + `score` al lado derecho
- Ganador: fondo levemente dorado (`bg-gold/6`), texto `font-semibold text-navy`
- Perdedor: texto `text-muted`
- Partido pendiente (TBD): nombres en cursiva `text-muted`, score `—`
- Card final: borde `border-gold` + sombra dorada sutil

**Conectores SVG:**
- Línea que sale del centro de la card ganadora hacia la siguiente ronda
- Punto dorado (`fill="#F5C518"`) en el origen de la línea (equipo ganador)
- Línea punteada cuando el partido destino está pendiente
- Color: `#334155` para líneas jugadas, `#1e293b` para pendientes

**Copa Plata:**
- Sección separada debajo del bracket principal
- Título `🥈 Copa Plata` con separador horizontal
- Mismo componente de árbol, border plateado en card final

**Responsividad:** scroll horizontal en móvil. El componente no colapsa a vista lista — siempre árbol.

---

## Tab 3 — Horario

### Componente: `HorarioTab`

Grilla transpuesta: **canchas en eje vertical (filas), tiempo en eje horizontal (columnas)**.

**Encabezado de columnas (horas):**
- Hora formateada `HH:MM` (es-CL, `America/Santiago`)
- Subtítulo con duración del slot o `— descanso —` para huecos sin partidos

**Encabezado de filas (canchas):**
- `C1 / Principal`, `C2 / Auxiliar`, etc.
- Fondo `bg-navy`

**Match card dentro de celda:**

```
┌─────────────────────────────────────┐  ← borde top: color categoría
│ P·3  GRUPO A              [4a]      │  ← número partido + fase + badge cat.
│ Rosselot / Figueroa          6      │  ← nombre win (bold) + score win (gold)
│ ─────────────────────────────────── │
│ Leniz / Geyger               3      │  ← nombre + score
└─────────────────────────────────────┘  ← borde perimetral: copa (oro/plata)
```

**Número de partido:** formato `P·N` (grupo), `SF·N` (semifinal), `F·N` (final), `SF·PN` / `F·PN` (plata). Permite vincular visualmente con el tab Fixture.

**Colores por categoría (borde superior):**
| Categoría | Color |
|-----------|-------|
| 4a | `#3b82f6` (azul) |
| 3a | `#8b5cf6` (violeta) |
| Open | `#f59e0b` (naranja) |
| D (Fem.) | `#ec4899` (rosa) |
| C (Fem.) | `#a855f7` (púrpura) |

**Borde perimetral por copa:**
- Copa Oro: `box-shadow: 0 0 0 1.5px #F5C518`
- Copa Plata: `box-shadow: 0 0 0 1.5px #94a3b8`

**Estados de card:**
- `played`: opacidad 75%, fondo más oscuro
- `upcoming`: opacidad 100%, fondo normal
- `pending` (TBD): opacidad 45%, borde punteado, nombres en cursiva

**Celda vacía:** fondo `#0a1020`, sin contenido (punto decorativo centrado).

**Leyenda:** strip horizontal encima de la grilla con chips de categoría + indicadores de copa.

**Scroll:** `overflow-x: auto` en wrapper. Nota de scroll visible en mobile.

---

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/features/torneos/TorneoDetalle.tsx` | Agregar tabs, refactorizar secciones |
| `src/features/torneos/FixtureTab.tsx` | Nuevo — rediseño de `FixtureView` actual |
| `src/features/torneos/BracketTab.tsx` | Nuevo — árbol visual con SVG |
| `src/features/torneos/HorarioTab.tsx` | Nuevo — grilla transpuesta |
| `src/features/torneos/FixtureView.tsx` | Renombrar a `DesafioView.tsx` y acotar a `desafio_puntos`; el nuevo `FixtureTab` cubre `americano_grupos` |
| `src/lib/fixture/types.ts` | Sin cambios |
| `src/lib/fixture/engine.ts` | Sin cambios |

---

## Decisiones de diseño

- **Tabs:** usar `@radix-ui/react-tabs` (ya en el proyecto). `value` controlado por estado local en `TorneoDetalle`. Tab "Fixture" activo por defecto.
- **SVG inline** para conectores del bracket (no librería externa). Los paths se calculan con posiciones fijas relativas al número de equipos por ronda — suficiente para los formatos actuales (cuartos, semis, final).
- **No se agrega dependencia nueva.** Todo con Tailwind + SVG + lógica existente.
- **Datos del horario** vienen de `partido.turno` (string `"HH:MM"`) y `partido.cancha` (número) ya presentes en `PartidoFixture`. No requiere cambios en DB ni en el motor.
- **Número de partido** se deriva del campo `partido.numero` ya existente en el tipo, combinado con `partido.fase` para el prefijo.
- **Colores de categoría** se mapean desde `categoria.nombre` con un dict en el componente. Si una categoría no tiene color asignado, cae en un gris neutro.

---

## Fuera de scope

- Drag & drop para reasignar horarios
- Edición de cancha/turno desde el horario (sigue siendo en ResultadosModal)
- Vista de bracket para `desafio_puntos`
- Impresión / exportar PDF
