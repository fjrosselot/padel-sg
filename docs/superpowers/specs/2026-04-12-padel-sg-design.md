# padel-sg — Diseño completo v1.0

**Fecha:** 2026-04-12  
**Estado:** Aprobado por Pancho  
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Supabase (schema `padel`) + Vercel

---

## 1. Contexto

Plataforma cerrada para la **Rama Pádel del colegio Saint George's College** — comunidad de apoderados que juegan pádel. Acceso solo con aprobación manual del administrador. El producto se construye completo antes de liberarlo al grupo.

El proyecto existente (`padel-court-calc`) contiene un simulador de fixture v5.0 (single HTML + Firebase) cuya lógica de cálculo se portará a TypeScript puro dentro de padel-sg.

---

## 2. Arquitectura

### Frontend
- React 18 + Vite + **TypeScript** (tipos auto-generados desde Supabase)
- Tailwind CSS + shadcn/ui con tokens personalizados
- React Router v6 (rutas anidadas por módulo)
- **TanStack Query** para server state (caching, background refetch, optimistic updates)
- **Zustand** para estado global mínimo (usuario activo, temporada seleccionada)
- Fuentes: **Manrope** (headers/títulos) + **Inter** (body/datos)

### Backend / Infra
- Supabase (schema `padel`) — instancia `finanzas-padel-dev`, región `sa-east-1`
- Vercel Edge Functions para endpoints ICS
- RLS en todas las tablas
- Supabase Storage bucket `avatars/` para fotos de perfil

### Estructura de carpetas
```
src/
├── features/
│   ├── auth/
│   ├── jugadores/
│   ├── rankings/
│   ├── torneos/
│   ├── ligas/
│   ├── amistosos/
│   ├── calendario/
│   ├── finanzas/
│   └── admin/
├── components/        # componentes compartidos (shadcn + propios)
├── lib/               # supabase client, queryClient, utils
├── hooks/             # hooks globales: useUser, useTemporada
└── stores/            # zustand stores
```

---

## 3. Design System

### Paleta de colores
| Token | Hex | Uso |
|-------|-----|-----|
| `navy` | `#0D1B2A` | Fondo sidebar, headers, botones primarios |
| `navy-mid` | `#1A2E45` | Cards en contexto oscuro |
| `gold` | `#F5C518` | Acento principal, CTAs, highlights |
| `surface` | `#F0F4F8` | Fondo general de la app |
| `white` | `#FFFFFF` | Cards, inputs |
| `muted` | `#8FA8C8` | Labels, metadata |
| `slate` | `#4A6580` | Texto secundario |
| `success` | `#006747` | Victorias |
| `error` | `#BA1A1A` | Derrotas, errores |
| `warning` | `#FFF9E6` | Avisos, anuncios |

### Tipografía
- **Manrope** (700–900): títulos de página, nombres de sección, ELO display
- **Inter** (400–600): body, tablas, labels, metadata

### Navegación
- **Desktop:** sidebar de íconos colapsado (48px de ancho), se expande al hover
- **Mobile:** bottom navigation bar fija con 6 ítems principales

### Reglas visuales (del design system existente)
- Sin bordes de 1px para separar secciones — usar tonal layering
- Sombras: `0 20px 40px rgba(7,27,59,0.06)` — tinte navy, no negro
- Border radius: `xl` (12px) para cards, `lg` (8px) para inputs, `full` para avatares
- Glassmorphism en tooltips y estados activos del sidebar

---

## 4. Roles y permisos

| Acción | `jugador` | `admin_torneo` | `superadmin` |
|--------|:---------:|:--------------:|:------------:|
| Usar la plataforma | ✅ | ✅ | ✅ |
| Registrar amistosos | ✅ | ✅ | ✅ |
| Gestionar torneos y ligas | ❌ | ✅ | ✅ |
| Cargar resultados torneos | ❌ | ✅ | ✅ |
| Ver finanzas del grupo | ❌ | 👁 lectura | ✅ |
| Editar finanzas | ❌ | ❌ | ✅ |
| Aprobar usuarios | ❌ | ❌ | ✅ |
| Cambiar roles | ❌ | ❌ | ✅ |
| Enviar emails masivos | ❌ | ❌ | ✅ |
| Config global | ❌ | ❌ | ✅ |

El superadmin puede asignar/cambiar el rol de cualquier usuario desde el panel admin. Un jugador puede ser `admin_torneo` y seguir participando normalmente. Un tercero (no jugador activo) también puede tener cualquier rol.

---

## 5. Módulos

### 5.1 Auth
- Registro abierto + aprobación manual del superadmin
- Email automático post-registro: "Recibimos tu solicitud, espera aprobación"
- Email de aprobación con link directo a la app
- Email de rechazo con mensaje del admin
- Emails implementados vía Supabase Auth emails + trigger DB para rechazo
- Link de invitación opcional (herramienta del superadmin para troubleshooting)
- Dar de baja: jugador solicita → estado `pendiente_baja` → admin confirma; baja lógica (datos preservados); eliminación física solo por superadmin (GDPR)

**Formulario de registro (6 secciones):**
1. **Datos personales:** nombre, email, teléfono (opt), apodo (opt), sexo
2. **Vinculación SG:** cursos hijos (PK · KK · 1°–8° Básica · 9°–12° Media · Egresado), año egreso si aplica
3. **Nivel de juego:** categoría (según sexo, ver §5.2), gradualidad (−/normal/+), lado preferido, ¿juegas mixto?
4. **Participación:** frecuencia semanal (radio), actividades de interés (checkboxes: interescolares, torneos internos, amistosos intercolegiales, entrenamientos/clases, partidos semana, solo convenio)
5. **Comentarios adicionales:** texto libre (horarios preferidos, busca pareja, etc.)
6. **Contraseña**

### 5.2 Jugadores y perfiles
- Perfil público (visible para miembros activos): foto, nombre, apodo, categoría+gradualidad, lado, estadísticas de temporada
- Perfil propio: editable — foto (upload post-registro a Supabase Storage), disponibilidad horaria, cursos hijos (actualizables), categoría, lado, mixto
- **Cursos hijos:** se guardan como `[{curso_ingreso: "PK", anio: 2022}]` — el curso actual se calcula dinámicamente; el jugador los actualiza desde su perfil cada año
- **Estadísticas en perfil:**
  - Historial de partidos (cronológico: rival, resultado, contexto)
  - Stats derivadas: % victorias, racha actual, ratio de sets
  - Evolución ELO (gráfico de línea temporal)
  - Performance por contexto (torneo vs liga vs amistoso)
- **Head-to-head:** historial personal contra un jugador específico (récord W/L, scores)
- **Directorio de jugadores:** búsqueda, filtros por categoría, sexo
- **Buscador de compañeros:** filtro por disponibilidad horaria, categoría, sexo, mixto

### 5.3 Categorías y niveles

**Hombres:** `5a` → `4a` → `3a` → `Open`  
**Mujeres:** `D` → `C` → `B` → `Open`  
**Gradualidad:** `−` (recién llegando) / `normal` / `+` (transicionando a la siguiente)

Ejemplos: `C+`, `3a−`, `B`, `Open`

Schema: `jugadores.categoria text`, `jugadores.gradualidad text CHECK IN ('-', 'normal', '+')`

El admin puede modificar la categoría de cualquier jugador desde el panel.

### 5.4 Rankings
- **3 sistemas:** ELO (individual), Puntos, WDL (Win-Draw-Loss)
- **ELO es individual** — sube/baja por resultado del partido, independiente del compañero
- Filtrado por temporada activa (selector global en el sidebar)
- Vista de tabla con posición, ELO/puntos, partidos jugados, W/D/L, diferencial sets
- Gráfico de evolución ELO en el tiempo (en perfil del jugador)
- Los partidos de torneo, liga y amistosos (validados) alimentan el ranking

### 5.5 Torneos

**Torneos Internos:**
1. Admin crea torneo con wizard (categorías, formato, canchas, tiempos, fases, copa consolación)
2. Simulador genera fixture — lógica portada desde `padel-court-calc` v5.0 a TypeScript puro
3. Admin revisa y confirma fixture
4. Torneo abre inscripciones: parejas se inscriben, tracking de pagos
5. Torneo pasa a `en_curso`: carga de resultados habilitada (solo admin/admin_torneo)
6. Sistema actualiza bracket + ELO automáticamente al cargar resultados
7. Torneo `finalizado` → ranking de temporada se consolida

**Parámetros del simulador (heredados de padel-court-calc):**
- Categorías con número de parejas por categoría
- Formato: grupos round-robin + playoffs, copa de consolación (Oro/Plata), 3er lugar, byes, fixture compacto, esperar fin de ronda
- Parejas por grupo (3–8) y cuántos avanzan (1–4)
- Duración de partido (slider), pausa entre partidos
- Número de canchas y hora de inicio

**Torneos Externos:**
- Inscripciones centralizadas (el admin consolida quiénes van)
- Seguimiento de resultados en tiempo real (carga manual)
- Los resultados externos alimentan el ELO
- Scraping automático desde webs de torneos → **fase 2**

**Brackets visuales:** cuadro eliminatorio visual (SVG/CSS) reactivo al estado actual del torneo.

### 5.6 Ligas

**Round-Robin:** todas las parejas se enfrentan entre sí, tabla de posiciones viva, acumula puntos a lo largo de semanas.

**Escalerilla (Ladder):**
- Jugadores ordenados en escalera por posición
- Jugador X desafía a jugador Y (máximo 3 posiciones arriba)
- 7 días para jugar — si no juegan, el desafío caduca sin penalización
- Si X gana: suben posiciones, ELO se actualiza
- Tabla de la escalerilla se actualiza en tiempo real

Los partidos de liga alimentan el ELO igual que los de torneo.

### 5.7 Amistosos
- Cualquier jugador registra un partido: selecciona rival, carga resultado por sets
- Sistema notifica al equipo rival
- Rival puede: Confirmar (ELO se actualiza) | Refutar (queda en disputa, admin resuelve)
- Si no hay respuesta en **72 horas** → aprobación automática y ELO se actualiza

### 5.8 Dashboard (Home post-login)

7 widgets:
1. **Saludo + ELO + posición** — mi estado actual en el ranking
2. **Próximo partido** — fecha, hora, cancha, rival
3. **Anuncios del admin** — tarjeta destacada con avisos recientes
4. **Últimos resultados propios** — últimos 2–3 partidos con ELO ganado/perdido
5. **Mini ranking Top 5** — ELO de la temporada activa, con mi posición resaltada
6. **Actividad del grupo** — feed liviano: resultados recientes, desafíos, inscripciones
7. **Próximos eventos** — mini-calendario con los próximos torneos/ligas/amistosos

### 5.9 Calendario
- Vista mensual completa: todos los eventos (torneos internos/externos, ligas, amistosos, otros)
- **Feed ICS público** `/api/ics/public` — solo torneos grandes, sin auth, para suscribir en Google Calendar
- **Feed ICS personal** `/api/ics/[token]` — partidos propios (liga + torneo + amistosos), token UUID único por jugador almacenado en `ics_tokens`
- Ambos endpoints como Vercel Edge Functions

### 5.10 Finanzas

| Vista | `jugador` | `admin_torneo` | `superadmin` |
|-------|:---------:|:--------------:|:------------:|
| Mi deuda propia | ✅ | ✅ | ✅ |
| Deudas de todos | ❌ | ✅ | ✅ |
| Balance del grupo | ❌ | 👁 lectura | ✅ |
| Gastos del grupo | ❌ | 👁 lectura | ✅ editar |

- **Ingresos:** pagos de inscripción (un jugador puede pagar por otro), cuotas del grupo
- **Egresos:** arriendo canchas, pelotas, premios, otros gastos
- Cada pago registra: monto, fecha, quién pagó, por quién pagó, estado, torneo/temporada asociado
- Historial de movimientos filtrable por torneo o temporada

### 5.11 Admin
- Aprobación/rechazo de solicitudes de acceso (con info completa del formulario)
- Asignación y cambio de roles
- Gestión de torneos y ligas
- Panel de pagos e inscripciones
- Creación/cierre de temporadas
- Envío de emails masivos (segmentados por categoría, sexo, todos)
- Gestión de anuncios (CRUD)
- Dar de baja usuarios

### 5.12 Perfil personal
- Foto de perfil (upload, no obligatorio en registro)
- Datos editables: apodo, teléfono, lado, categoría propia, mixto, disponibilidad horaria
- Actualización de cursos hijos
- Historial de partidos y estadísticas
- Link de suscripción ICS personal
- Solicitud de baja de cuenta

### 5.13 Logros y badges
- Badges automáticos: "Primer torneo ganado", "10 victorias seguidas", "100 partidos jugados", "Campeón de temporada", etc.
- Visibles en el perfil del jugador
- Implementación progresiva — se agregan con el tiempo

### 5.14 Galería por torneo
- Sección de fotos por torneo
- Cualquier miembro puede subir fotos (Supabase Storage)
- Admin puede eliminar fotos

### 5.15 Páginas estáticas (Rama)
- Página de reglas de la rama: código de conducta, formato torneos, cómo funciona el ELO
- Contenido en Markdown, editable por superadmin desde el panel

### 5.16 Notificaciones
- **Push/email propio:** partido agendado, desafío recibido, validación pendiente de amistoso, cuenta aprobada
- **Email masivo (admin):** envío segmentado por categoría, sexo, o todos

---

## 6. Modelo de datos — cambios al schema existente

### Modificaciones
```sql
-- jugadores: reemplazar es_admin por rol, ampliar estado_cuenta, ajustar campos
ALTER TABLE padel.jugadores
  DROP COLUMN es_admin,
  DROP COLUMN nivel,             -- reemplazado por categoria + gradualidad
  DROP COLUMN anio_curso_hijo,   -- reemplazado por hijos_sg jsonb
  ADD COLUMN rol text NOT NULL DEFAULT 'jugador'
    CHECK (rol IN ('superadmin', 'admin_torneo', 'jugador')),
  ADD COLUMN categoria text,     -- '5a','4a','3a','Open' / 'D','C','B','Open'
  ADD COLUMN gradualidad text DEFAULT 'normal'
    CHECK (gradualidad IN ('-', 'normal', '+')),
  ADD COLUMN sexo text CHECK (sexo IN ('M', 'F')),
  ADD COLUMN mixto text CHECK (mixto IN ('si', 'no', 'a_veces')),
  ADD COLUMN hijos_sg jsonb DEFAULT '[]',  -- [{curso_ingreso:'PK', anio:2022}]
  ADD COLUMN frecuencia_semanal text,
  ADD COLUMN comentarios_registro text;

-- foto_url ya existe en el schema original (no se duplica)

-- Renombrar intereses (text) → intereses_actividades (jsonb)
ALTER TABLE padel.jugadores
  RENAME COLUMN intereses TO intereses_actividades;
ALTER TABLE padel.jugadores
  ALTER COLUMN intereses_actividades TYPE jsonb USING intereses_actividades::jsonb;

-- Ampliar estado_cuenta para incluir baja lógica
ALTER TABLE padel.jugadores
  DROP CONSTRAINT jugadores_estado_cuenta_check,
  ADD CONSTRAINT jugadores_estado_cuenta_check
    CHECK (estado_cuenta IN ('pendiente', 'activo', 'suspendido', 'pendiente_baja', 'inactivo'));
```

### Tablas nuevas
```sql
-- Ligas
CREATE TABLE padel.ligas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text NOT NULL,
  formato      text NOT NULL CHECK (formato IN ('round_robin', 'escalerilla')),
  temporada_id uuid REFERENCES padel.temporadas(id),
  estado       text NOT NULL DEFAULT 'borrador'
               CHECK (estado IN ('borrador', 'activa', 'finalizada')),
  fecha_inicio date,
  fecha_fin    date,
  deporte_id   text NOT NULL DEFAULT 'padel',
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE padel.liga_participantes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id    uuid NOT NULL REFERENCES padel.ligas(id) ON DELETE CASCADE,
  jugador_id uuid NOT NULL REFERENCES padel.jugadores(id),
  posicion   integer,  -- para escalerilla
  created_at timestamptz DEFAULT now(),
  UNIQUE (liga_id, jugador_id)
);

CREATE TABLE padel.liga_desafios (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id        uuid NOT NULL REFERENCES padel.ligas(id) ON DELETE CASCADE,
  desafiante_id  uuid NOT NULL REFERENCES padel.jugadores(id),
  desafiado_id   uuid NOT NULL REFERENCES padel.jugadores(id),
  partido_id     uuid REFERENCES padel.partidos(id),
  estado         text NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'jugado', 'caducado')),
  expires_at     timestamptz NOT NULL,
  created_at     timestamptz DEFAULT now()
);

-- Pagos de inscripción
CREATE TABLE padel.pagos_inscripcion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id  uuid NOT NULL REFERENCES padel.inscripciones(id) ON DELETE CASCADE,
  pagado_por      uuid NOT NULL REFERENCES padel.jugadores(id),
  monto           numeric,
  fecha_pago      timestamptz,
  estado          text NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'pagado', 'exento')),
  notas           text,
  created_at      timestamptz DEFAULT now()
);

-- Movimientos financieros del grupo
CREATE TABLE padel.movimientos_financieros (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  categoria    text,
  monto        numeric NOT NULL,
  descripcion  text NOT NULL,
  fecha        date NOT NULL,
  temporada_id uuid REFERENCES padel.temporadas(id),
  torneo_id    uuid REFERENCES padel.torneos(id),
  creado_por   uuid REFERENCES padel.jugadores(id),
  deporte_id   text NOT NULL DEFAULT 'padel',
  created_at   timestamptz DEFAULT now()
);

-- Validaciones de amistosos
CREATE TABLE padel.validaciones_partido (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id   uuid NOT NULL REFERENCES padel.partidos(id) ON DELETE CASCADE,
  validado_por uuid REFERENCES padel.jugadores(id),
  estado       text NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente', 'confirmado', 'refutado', 'auto_aprobado')),
  expires_at   timestamptz NOT NULL,  -- 72h desde creación
  created_at   timestamptz DEFAULT now()
);

-- Tokens ICS personales
CREATE TABLE padel.ics_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id uuid NOT NULL REFERENCES padel.jugadores(id) ON DELETE CASCADE,
  token      uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Anuncios del admin
CREATE TABLE padel.anuncios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     text NOT NULL,
  cuerpo     text NOT NULL,
  activo     boolean NOT NULL DEFAULT true,
  creado_por uuid REFERENCES padel.jugadores(id),
  deporte_id text NOT NULL DEFAULT 'padel',
  created_at timestamptz DEFAULT now()
);
```

### Tablas sin cambios
`temporadas`, `torneos`, `inscripciones`, `partidos`, `ranking`, `eventos`, `disponibilidad`, `evento_participantes`, `deportes`

---

## 7. Flujos clave

### Auth
1. Usuario se registra → estado `pendiente`, email automático de confirmación
2. Superadmin aprueba → estado `activo`, email de bienvenida con link
3. (Si rechaza) → email de rechazo
4. Login normal desde ese punto
5. Baja: jugador solicita → `pendiente_baja` → admin confirma → `inactivo` (datos preservados)

### Torneo interno
1. Admin abre wizard → configura parámetros → simulador genera fixture
2. Admin confirma fixture → torneo abre inscripciones
3. Parejas se inscriben → admin registra pagos
4. Admin pasa a `en_curso` → se habilita carga de resultados
5. Admin carga resultados → bracket y ELO se actualizan automáticamente
6. Torneo `finalizado` → ranking consolidado

### Amistoso
1. Jugador A registra partido con resultado
2. Sistema notifica a equipo rival (B)
3. B confirma → ELO actualizado | B refuta → admin resuelve | 72h sin respuesta → auto-aprobado

### Liga escalerilla
1. Admin crea liga, define posición inicial de cada jugador
2. Jugador X desafía a Y (máximo 3 posiciones arriba)
3. Tienen 7 días para jugar
4. Si juegan: ganador sube/baja posición, ELO se actualiza
5. Si no juegan: desafío caduca automáticamente

### Calendario ICS
- `GET /api/ics/public` → feed iCal torneos grandes, sin auth
- `GET /api/ics/[token]` → feed iCal personal del jugador, token UUID en URL

---

## 8. Formulario de registro — campos completos

1. Nombre completo *
2. Email *
3. Teléfono (opcional)
4. Apodo/como te llaman (opcional)
5. Sexo * (Masculino / Femenino)
6. Cursos hijos en SG: PK · KK · 1°–8° (Básica) · 9°–12° (Media) · Egresado (multiselect)
7. Año de egreso del último hijo (si aplica)
8. Categoría * (según sexo: 5a/4a/3a/Open o D/C/B/Open)
9. Gradualidad * (−/normal/+)
10. Lado preferido (Drive / Reves / Ambos)
11. ¿Juegas mixto? * (Sí / No / A veces)
12. Frecuencia semanal * (radio: <1 / 1 / 2 / 3+)
13. Actividades de interés (checkboxes: interescolares, torneos internos, amistosos intercolegiales, entrenamientos, partidos semana, solo convenio)
14. Comentarios adicionales (texto libre)
15. Contraseña * + Confirmar contraseña *

---

## 9. Referencia de repos

- **padel-sg** (este repo): plataforma principal
- **padel-court-calc**: simulador de fixture v5.0, lógica a portar como TypeScript puro
- **Americano SG v2**: formato americano, revisar para eventuales ligas de este tipo

---

## 10. Fuera de scope (fase 2 o descartado)

- Scraping automático de webs de torneos externos
- Procesamiento de pagos real (Stripe, Mercado Pago)
- Chat interno (WhatsApp cubre esto)
- Formato americano en ligas (revisar en fase 2 desde Americano SG v2)
