# Design System: padel-sg — Rama Pádel Saint George's
**Stitch Project ID:** `5985153279308347646`

---

## 1. Visual Theme & Atmosphere

**"The Athletic Editorial"** — La interfaz fusiona la energía de un tablero de marcador con la sobriedad de un club deportivo de élite. No es un SaaS genérico: es una publicación deportiva de alto nivel que también funciona como herramienta de gestión.

La clave visual es el **contraste controlado**: un sidebar de navy profundo ancla la identidad de marca en cada pantalla, mientras el surface claro y los cards blancos crean espacio para que los datos respiren. El gold aparece quirúrgicamente — solo donde importa (acción principal, estado activo, logro).

**Jerarquía sin líneas**: la separación entre secciones se logra exclusivamente mediante capas tonales — nunca bordes de 1px. El ojo navega por diferencias de profundidad, no por divisiones.

---

## 2. Color Palette & Roles

| Token | Nombre descriptivo | Hex | Rol |
|---|---|---|---|
| `navy` | Deep Ink Navy | `#0D1B2A` | Sidebar, headers oscuros, botones primarios sobre fondos claros |
| `navy-mid` | Midnight Slate | `#1A2E45` | Cards en contexto oscuro, hover del sidebar |
| `gold` | Championship Gold | `#F5C518` | Acción primaria, estado activo en nav, highlights, CTAs |
| `gold-dim` | Burnished Gold | `#F0C110` | Variante de gold para gradientes y estados pressed |
| `surface` | Court Grey | `#F0F4F8` | Fondo general de la app — el "canvas" |
| `white` | Clean White | `#FFFFFF` | Cards, inputs, contenido elevado |
| `surface-high` | Warm Mist | `#E4E9ED` | Wells interiores, metadata inset, fondos de tablas |
| `slate` | Steel Slate | `#4A6580` | Texto secundario, descripciones |
| `muted` | Fog Blue | `#8FA8C8` | Labels, timestamps, metadata, placeholders |
| `success` | Victory Green | `#006747` | Victorias, estados positivos |
| `error` | Defeat Red | `#BA1A1A` | Derrotas, errores, alertas críticas |
| `warning-bg` | Amber Whisper | `#FFF9E6` | Fondo de avisos y anuncios del admin |

### Regla "Sin líneas"
**Prohibido** usar bordes de 1px para separar secciones. En su lugar:
- Card blanca (`#FFFFFF`) sobre fondo surface (`#F0F4F8`) = separación natural
- Section `#F0F4F8` dentro de card blanca = well interno
- Espaciado vertical generoso (24px+) como separador principal

---

## 3. Typography Rules

**Dos voces, un sistema:**

- **Manrope 700–900** — La voz atlética. Títulos de página, nombres de sección, displays de ELO y puntuaciones, encabezados de torneo. Tight tracking, presencia fuerte. Usar en mayúsculas con `letter-spacing: 0.05em` para labels de categoría.
- **Inter 400–600** — La voz periodística. Body copy, tablas de datos, labels de formulario, timestamps, descripciones. Alta legibilidad a cualquier tamaño.

**Jerarquía:**
- `display-lg` (Manrope 900, 3–3.5rem): ELO de un jugador, resultado de partido destacado
- `headline-md` (Manrope 700, 1.5rem): Títulos de sección, nombre de torneo
- `title-md` (Manrope 700 / Inter 600, 1rem): Encabezados de card, nombre de jugador
- `body-md` (Inter 400, 0.875rem): Contenido general
- `label-sm` (Inter 600, 0.75rem, ALL-CAPS, +0.05em): Categorías, estados, etiquetas técnicas

---

## 4. Component Stylings

### Buttons
- **Primary:** Fondo Championship Gold (`#F5C518`), texto Deep Ink Navy (`#0D1B2A`), peso 700. Corners suavemente redondeados (8px). Sin borde. Usado exclusivamente para la acción más importante de la pantalla.
- **Secondary:** Fondo Deep Ink Navy (`#0D1B2A`), texto Championship Gold. Para acciones secundarias de alta visibilidad sobre fondos claros.
- **Ghost:** Sin fondo, borde sutil con `outline_variant` al 40%, texto navy. Para acciones terciarias.
- **Destructive:** Fondo `#FEE8E8`, texto `#BA1A1A`. Para confirmar eliminaciones.

### Cards & Containers
- **Main Card:** Fondo White (`#FFFFFF`), corners generosamente redondeados (12px), sombra navy-tinted difusa (`0 20px 40px rgba(13,27,42,0.06)`). Padding interno 20–24px.
- **Inner Well:** Fondo Court Grey (`#F0F4F8`) dentro de una card blanca. Para metadata inset o secciones secundarias.
- **Dark Card:** Fondo Midnight Slate (`#1A2E45`) sobre sidebar navy. Para widgets en contexto oscuro.

### Sidebar Navigation
- **Collapsed (48px):** Fondo Deep Ink Navy. Logo mark circular en gold arriba. Íconos en Fog Blue (`#8FA8C8`) cuando inactivos, blancos sobre pill gold cuando activos. Pill gold de ancho completo (40px alto, 6px radius) como indicador de estado activo.
- **Expanded (220px):** Mismo sistema con labels Inter 13px en blanco a la derecha del ícono. Wordmark "Pádel SG" en gold. Transición suave (200ms ease).
- **Glassmorphism:** En tooltips y overlays del sidebar — `backdrop-blur: 12px`, `background: rgba(255,255,255,0.08)`.

### Inputs & Forms
- **Field:** Fondo `#F0F4F8`, corners 8px, sin borde visible en reposo. En focus: borde de 2px Championship Gold al 60% de opacidad. Label Inter 11px Steel Slate arriba.
- **Select/Dropdown:** Mismo estilo que field, con chevron navy a la derecha.
- **Toggle Chips (multi-select):** Fondo `#F0F4F8`, texto Steel Slate cuando inactivos. Activos: fondo Deep Ink Navy, texto Championship Gold. 6px radius, padding 5px 11px.

### Status Badges
- `pendiente` → `#FFF3CD` fondo, `#856404` texto
- `activo` → `#D1FAE5` fondo, `#065F46` texto
- `suspendido` / `rechazado` → `#FEE8E8` fondo, `#BA1A1A` texto
- `victoria` → Victory Green (`#006747`) con fondo al 10% de opacidad
- `derrota` → Defeat Red (`#BA1A1A`) con fondo al 10% de opacidad

---

## 5. Layout Principles

**Estructura base:**
```
[Sidebar 48px navy] | [Top bar 56px white] 
                    | [Content area — #F0F4F8]
                    |   [Cards blancas en grid]
```

**Grid de contenido:** 24px gap entre cards. Máximo 3 columnas en desktop, 2 en tablet, 1 en mobile.

**Espaciado:** Generoso. Si algo se siente apretado, aumentar padding antes de agregar líneas. Secciones separadas por 24–32px de whitespace vertical.

**Mobile (Bottom Nav):** Barra fija en el fondo, fondo blanco, 6 ítems. Ícono activo con punto gold debajo y tinte gold en el ícono. Labels Inter 10px. Sin bordes superiores — solo sombra navy-tinted difusa hacia arriba.

**Elevación por capas:**
1. `#F0F4F8` — App background (base)
2. `#FFFFFF` — Cards (elevado)
3. `#F0F4F8` dentro de card — Wells (hundido)
4. Sidebar `#0D1B2A` — Anclaje de marca (máxima autoridad visual)

**Sombras:** Siempre con tinte navy, nunca negro puro.
- Cards en reposo: `0 4px 12px rgba(13,27,42,0.06)`
- Cards en hover: `0 12px 32px rgba(13,27,42,0.10)`
- Modales: `0 20px 40px rgba(13,27,42,0.14)`

---

## 6. Prompting Guide (para generar nuevas pantallas en Stitch)

Incluir siempre este bloque en los prompts de Stitch:

```
DESIGN SYSTEM (REQUIRED):
- Platform: Web, Desktop-first
- Theme: Light surface with dark navy sidebar, athletic editorial aesthetic
- App Background: Court Grey (#F0F4F8)
- Sidebar: Deep Ink Navy (#0D1B2A), 48px collapsed
- Primary Accent: Championship Gold (#F5C518) for active states and CTAs
- Cards: White (#FFFFFF), 12px radius, navy-tinted shadow
- Text Primary: Deep Ink Navy (#0D1B2A) on light surfaces
- Text Secondary: Steel Slate (#4A6580)
- Metadata/Labels: Fog Blue (#8FA8C8)
- Font Headlines: Manrope 700-900
- Font Body: Inter 400-600
- No 1px borders — tonal layering only
- Shadows: always navy-tinted, never pure black
```
