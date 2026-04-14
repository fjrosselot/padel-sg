# 🎾 App Central de Pádel — Saint George

## Qué es esto
Aplicación web para la comunidad de pádel de apoderados del colegio Saint George.
Grupo cerrado: acceso solo con aprobación manual del admin. Incluye perfiles de jugadores,
ranking (3 sistemas configurables), torneos con fixture, inscripciones, registro de
partidos amistosos y buscador de compañeros por disponibilidad horaria.

Diseñada para escalar a otros deportes en el futuro (arquitectura multi-deporte desde v1).

---

## Versionado — convención X.Y.Z

```
X  → Major: cambio de arquitectura o nuevo deporte incorporado
Y  → Minor: nuevo módulo o funcionalidad
Z  → Patch: bug fix, ajuste menor, mejora de UI

Versión inicial MVP: 0.1.0
```

### Historial de versiones:
| Versión | Fecha | Descripción |
|---|---|---|
| 0.1.0 | — | MVP: perfiles, ranking, torneos, fixture, resultados |
| 0.2.0 | — | Buscador de compañeros por disponibilidad |
| 0.3.0 | — | Registro de partidos amistosos |
| 0.4.0 | — | Sistema de ranking ELO |
| 1.0.0 | — | Versión estable para uso del grupo |

---

## Stack técnico

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend/DB:** Supabase — schema `padel` dentro de la instancia compartida del ecosistema
- **Auth:** Supabase Auth (email/password) con aprobación manual de admin
- **Deploy:** Vercel
- **Repo:** https://github.com/fjrosselot/padel-sg
- **Referencia previa:** Existe versión anterior en Netlify — revisar qué lógica reutilizar

> ⚠️ NO usar Firebase. Supabase cubre todos los casos de uso sin tiempo real.
> Una sola instancia Supabase Pro con schema separado `padel`.

---

## Design System
- Refer to /DESIGN.md for colors, typography, spacing, and component specs
- Reference designs are in /stitch-designs/ — one folder per screen
- Stack: React + Vite + Tailwind CSS
- All designs should be implemented as responsive components (web-first, mobile-friendly)
- ⚠️ La referencia visual definitiva son los diseños en /stitch-designs/. 
- Ignorar ~/Pictures/AppPadel/ — ya fue reemplazado por Stitch.


## Arquitectura multi-deporte (para escalar)

Todas las tablas tienen el campo `deporte_id` para futuras extensiones.
En v1 solo existe el deporte `padel`. Esto NO agrega complejidad ahora,
solo asegura que no haya que reescribir el modelo de datos en el futuro.

---

## Estructura de carpetas

```
/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx          # Solicitud de acceso (pendiente aprobación)
│   │   │   └── AdminApproval.jsx     # Panel admin: aprobar/rechazar usuarios
│   │   ├── jugadores/
│   │   │   ├── PerfilJugador.jsx     # Vista perfil propio y ajeno
│   │   │   ├── EditarPerfil.jsx      # Solo propio
│   │   │   ├── DirectorioJugadores.jsx
│   │   │   └── BuscadorCompanero.jsx # Filtro por horario + nivel
│   │   ├── torneos/
│   │   │   ├── TorneosList.jsx
│   │   │   ├── TorneoDetalle.jsx          # Vista general del torneo: grupos + bracket + resultados
│   │   │   ├── wizard/
│   │   │   │   ├── WizardTorneo.jsx       # Contenedor del wizard (5 pasos)
│   │   │   │   ├── Paso1General.jsx
│   │   │   │   ├── Paso2Formato.jsx
│   │   │   │   ├── Paso3Turnos.jsx
│   │   │   │   ├── Paso4Fixture.jsx       # Preview del fixture generado
│   │   │   │   └── Paso5Publicar.jsx
│   │   │   ├── BracketVisual.jsx          # Cuadro eliminatorio visual (SVG/CSS)
│   │   │   ├── TablaGrupo.jsx             # Tabla de posiciones de un grupo
│   │   │   ├── InscripcionForm.jsx
│   │   │   └── PartidoResultado.jsx       # Modal para cargar resultado por sets
│   │   ├── temporadas/
│   │   │   ├── TemporadaSelector.jsx    # Dropdown global para filtrar por temporada
│   │   │   ├── TemporadaDetalle.jsx     # Resumen: torneos, ranking y eventos de la temporada
│   │   │   └── TemporadaAdmin.jsx       # Crear/cerrar temporadas (solo admin)
│   │   ├── calendario/
│   │   │   ├── Calendario.jsx           # Vista mensual de todos los eventos
│   │   │   ├── EventoCard.jsx           # Tarjeta de evento en el calendario
│   │   │   ├── EventoDetalle.jsx        # Modal/página de detalle del evento
│   │   │   ├── EventoCrear.jsx          # Admin crea evento (solo admin)
│   │   │   └── EventoInscripcion.jsx    # Jugador se inscribe a un evento con cupo
│   │   ├── ranking/
│   │   │   ├── RankingTabla.jsx
│   │   │   └── RankingConfig.jsx
│   │   ├── partidos/
│   │   │   └── PartidoAmistoso.jsx
│   │   └── admin/
│   │       └── AdminPanel.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── ranking/
│   │   │   ├── elo.js                # Algoritmo ELO
│   │   │   ├── puntos.js             # Sistema por puntos acumulados
│   │   │   └── wdl.js                # Win/Draw/Loss simple
│   │   ├── fixture.js                # Generación automática de fixture
│   │   └── formatters.js
│   ├── hooks/
│   │   ├── useAuth.js                # Hook de autenticación y rol
│   │   └── useRanking.js
│   ├── App.jsx
│   └── main.jsx
├── DESIGN.md                  # Resumen del proyecto de Stitch
├── CLAUDE.md                  
└── package.json
```

---

## Modelo de datos (Supabase — schema: `padel`)

### Tabla: `deportes`
| campo | tipo | descripción |
|---|---|---|
| id | text | PK — ej. `padel`, `tenis` |
| nombre | text | Nombre visible |
| activo | boolean | true |

> Insertar `padel` en seed inicial. No agregar más en v1.

### Tabla: `temporadas`
Agrupa torneos, eventos y ranking por año o período definido.
| campo | tipo | descripción |
|---|---|---|
| id | uuid | PK |
| nombre | text | Ej. "Temporada 2026", "Primer Semestre 2026" |
| anio | integer | Ej. 2026 |
| fecha_inicio | date | Inicio del período |
| fecha_fin | date | Fin del período |
| activa | boolean | Solo una activa por deporte a la vez |
| deporte_id | text | `padel` |
| descripcion | text | Opcional |
| created_at | timestamp | Auto |

> El ranking se calcula y muestra por temporada.
> Al iniciar una nueva temporada, el ranking parte desde cero (ELO vuelve a 1200,
> puntos a 0), pero se conserva el historial de temporadas anteriores.
> El admin puede comparar rankings entre temporadas.

### Tabla: `eventos`
Calendario centralizado de todos los eventos de la rama pádel.
| campo | tipo | descripción |
|---|---|---|
| id | uuid | PK |
| titulo | text | Nombre del evento |
| tipo | text | Ver tipos abajo |
| ambito | text | `interno` / `externo` |
| descripcion | text | Detalle opcional |
| ubicacion | text | Lugar (cancha, club, colegio, dirección) |
| url_externo | text | Link a torneo externo (FPT, Federación, etc.) |
| fecha_inicio | date | |
| hora_inicio | time | Opcional |
| fecha_fin | date | Null si es de un solo día |
| hora_fin | time | Opcional |
| todo_dia | boolean | true si es evento de día completo sin hora exacta |
| temporada_id | uuid | FK → temporadas.id |
| torneo_id | uuid | FK → torneos.id (null si no es torneo) |
| inscripcion_abierta | boolean | Para eventos con cupo |
| cupo_max | integer | Null si sin límite |
| es_publico | boolean | true = visible sin login (para compartir calendario) |
| creado_por | uuid | FK → jugadores.id |
| deporte_id | text | `padel` |
| created_at | timestamp | Auto |

### Tipos de evento válidos:
- `torneo_interno` — torneo organizado dentro del grupo SG
- `torneo_externo` — torneo en otro club o federación al que van miembros
- `amistoso` — partido amistoso pactado (puede ser con otro club)
- `entrenamiento` — sesión de práctica grupal
- `clase` — clase con profesor
- `social` — evento social del grupo (asado, reunión, etc.)
- `otro` — cualquier otro evento relevante

### Tabla: `evento_participantes`
Para eventos con inscripción.
| campo | tipo | descripción |
|---|---|---|
| id | uuid | PK |
| evento_id | uuid | FK → eventos.id |
| jugador_id | uuid | FK → jugadores.id |
| estado | text | `inscrito` / `confirmado` / `baja` |
| created_at | timestamp | Auto |

> UNIQUE constraint en (evento_id, jugador_id)

### Tabla: `jugadores`
| campo | tipo | descripción |
|---|---|---|
| id | uuid | PK = mismo UUID que auth.users |
| nombre | text | Nombre completo |
| apodo | text | Opcional — nombre visible en ranking |
| email | text | UNIQUE |
| telefono | text | WhatsApp preferido |
| foto_url | text | Avatar (Supabase Storage) |
| nivel | integer | 1 (iniciación) a 5 (avanzado) — lo declara el jugador, admin puede corregir |
| lado_preferido | text | `drive` / `reves` / `ambos` |
| anio_curso_hijo | text | Ej. "4°B" — para contexto del grupo |
| intereses | text | JSON array: `["torneos","amistosos","clases","mixto"]` |
| estado_cuenta | text | `pendiente` / `activo` / `suspendido` |
| es_admin | boolean | false por defecto |
| deporte_id | text | `padel` (para escalar) |
| created_at | timestamp | Auto |

### Tabla: `disponibilidad`
Un registro por bloque horario disponible del jugador.
| campo | tipo | descripción |
|---|---|---|
| id | uuid | PK |
| jugador_id | uuid | FK → jugadores.id |
| dia_semana | integer | 0=lunes … 6=domingo |
| bloque | text | `manana` (7-12) / `tarde` (12-18) / `noche` (18-23) |
| deporte_id | text | `padel` |

### Tabla: `torneos`
| campo | tipo | descripción |
|---|---|---|
| id | uuid | PK |
| nombre | text | Nombre del torneo |
| descripcion | text | Opcional |
| ambito | text | `interno` / `externo` |
| club_externo | text | Nombre del club anfitrión (si es externo) |
| url_externo | text | Link a info del torneo externo |
| formato | text | `grupos_eliminatoria` / `round_robin` / `eliminacion_directa` |
| estado | text | `borrador` / `inscripcion` / `en_curso` / `finalizado` |
| sistema_ranking | text | `elo` / `puntos` / `wdl` |
| temporada_id | uuid | FK → temporadas.id — a qué temporada pertenece |
| evento_id | uuid | FK → eventos.id — entrada en el calendario |
| fecha_inicio | date | |
| fecha_fin | date | Estimada |
| max_parejas | integer | Límite de inscripciones |
| inscripcion_abierta | boolean | Admin controla |
| deporte_id | text | `padel` |
| created_at | timestamp | Auto |

> Torneos externos: el admin los registra para visibilidad en el calendario,
> pero no tienen fixture ni resultados gestionados en la app.
> Sirven para que el grupo sepa que hay un torneo y quiénes van.

### Tabla: `inscripciones`
| campo | tipo | descripción |
|---|---|---|
| id | uuid | PK |
| torneo_id | uuid | FK → torneos.id |
| jugador1_id | uuid | FK → jugadores.id (quien se inscribe) |
| jugador2_id | uuid | FK → jugadores.id (pareja elegida) |
| estado | text | `pendiente` / `confirmada` / `rechazada` |
| created_at | timestamp | Auto |

> UNIQUE constraint en (torneo_id, jugador1_id) y (torneo_id, jugador2_id)
> para evitar que un jugador aparezca en dos parejas del mismo torneo.

### Tabla: `partidos`
| campo | tipo | descripción |
|---|---|---|
| id | uuid | PK |
| torneo_id | uuid | FK → torneos.id (null si es amistoso) |
| tipo | text | `torneo` / `amistoso` |
| fase | text | `grupo` / `octavos` / `cuartos` / `semifinal` / `tercer_lugar` / `final` (null si amistoso) |
| grupo | text | Ej. "A", "B", "C" (solo fase de grupos) |
| numero_partido | integer | Número correlativo dentro del torneo (para ordenar el fixture) |
| posicion_bracket | text | Ej. "SF1", "SF2", "F1" — para renderizar el bracket visual |
| pareja1_j1 | uuid | FK → jugadores.id |
| pareja1_j2 | uuid | FK → jugadores.id (null si TBD en bracket) |
| pareja2_j1 | uuid | FK → jugadores.id (null si TBD en bracket) |
| pareja2_j2 | uuid | FK → jugadores.id (null si TBD en bracket) |
| sets_pareja1 | integer | Sets ganados por pareja 1 (calculado de detalle_sets) |
| sets_pareja2 | integer | Sets ganados por pareja 2 (calculado de detalle_sets) |
| games_pareja1 | integer | Total games ganados por pareja 1 (calculado de detalle_sets) |
| games_pareja2 | integer | Total games ganados por pareja 2 (calculado de detalle_sets) |
| detalle_sets | text | JSON array: `[{"p1":6,"p2":3},{"p1":4,"p2":6},{"p1":7,"p2":5}]` |
| ganador | integer | `1` o `2` — null hasta que se registre resultado |
| estado | text | `pendiente` / `en_curso` / `jugado` / `walkover` |
| fecha | date | Cuándo se jugó o está programado |
| turno | text | Ej. "Sábado 10:00" — slot del torneo |
| cancha | text | Ej. "Cancha 1" — opcional |
| resultado_bloqueado | boolean | false — admin pone true para cerrar |
| registrado_por | uuid | FK → jugadores.id (quién cargó el resultado) |
| deporte_id | text | `padel` |
| created_at | timestamp | Auto |

> `sets_pareja1`, `sets_pareja2`, `games_pareja1`, `games_pareja2` se calculan
> automáticamente al guardar `detalle_sets`. No se ingresan manualmente.
>
> Fórmula:
> ```javascript
> sets_pareja1 = detalle_sets.filter(s => s.p1 > s.p2).length
> games_pareja1 = detalle_sets.reduce((acc, s) => acc + s.p1, 0)
> // ídem para pareja 2
> ```

### Tabla: `ranking`
Snapshot del ranking por jugador, temporada y sistema. Se recalcula al registrar cada partido.
| campo | tipo | descripción |
|---|---|---|
| id | uuid | PK |
| jugador_id | uuid | FK → jugadores.id |
| temporada_id | uuid | FK → temporadas.id |
| sistema | text | `elo` / `puntos` / `wdl` |
| puntaje | numeric | ELO: ~1200 inicial; puntos: acumulado; wdl: % victorias |
| partidos_jugados | integer | |
| victorias | integer | |
| derrotas | integer | |
| sets_favor | integer | Total sets ganados |
| sets_contra | integer | Total sets perdidos |
| games_favor | integer | Total games ganados |
| games_contra | integer | Total games perdidos |
| diferencial_sets | integer | sets_favor - sets_contra |
| diferencial_games | integer | games_favor - games_contra |
| deporte_id | text | `padel` |
| updated_at | timestamp | Auto |

> UNIQUE constraint en (jugador_id, temporada_id, sistema)
> Desempate estándar en torneos de pádel: puntos → sets → games → sorteo

---

## Roles y permisos

| Acción | Jugador | Admin |
|---|---|---|
| Ver ranking, fixtures, resultados | ✅ | ✅ |
| Editar propio perfil | ✅ | ✅ |
| Editar perfil ajeno | ❌ | ✅ |
| Inscribirse a torneo | ✅ | ✅ |
| Registrar resultado de partido | ✅ (si participa) | ✅ |
| Editar resultado ya cargado | ✅ (si no está bloqueado) | ✅ |
| Bloquear/desbloquear resultado | ❌ | ✅ |
| Crear/editar torneo | ❌ | ✅ |
| Aprobar nuevos usuarios | ❌ | ✅ |
| Cambiar sistema de ranking activo | ❌ | ✅ |
| Corregir nivel de jugador | ❌ | ✅ |

> Implementar con Supabase RLS (Row Level Security) policies.
> Campo `es_admin` en tabla `jugadores` controla el rol.

---

## Flujo de registro de nuevos usuarios

```
1. Usuario llena formulario: nombre, email, teléfono, hijo/curso
2. Estado cuenta = "pendiente" → NO puede acceder a nada
3. Admin recibe notificación (email via Supabase) → panel de aprobación
4. Admin aprueba → estado = "activo" → usuario recibe email de confirmación
5. Usuario completa su perfil: nivel, lado, disponibilidad, intereses
```

---

## Lógica de Temporadas

```
Una temporada = un período de tiempo con su propio ranking y conjunto de torneos.

Ejemplo:
  Temporada 2026     → enero a diciembre 2026
  Primer Semestre    → enero a junio
  Temporada Verano   → enero a marzo
```

### Reglas:
- Solo puede haber **una temporada activa** por deporte a la vez
- El ranking se calcula **dentro de la temporada** — al cambiar de temporada el ranking parte de cero
- El historial de temporadas anteriores se conserva y es consultable
- Al crear una temporada nueva, el admin puede elegir si "hereda" los jugadores del ranking anterior (útil para ELO: que el rating inicial sea el ELO final de la temporada anterior)
- Los partidos amistosos opcionalmente pueden afectar el ranking de la temporada activa (toggle por admin)

### Vista de temporada:
- Ranking de la temporada con filtro por sistema (ELO / puntos / WDL)
- Lista de torneos de la temporada (internos y externos)
- Estadísticas: partidos jugados, jugador más activo, pareja más ganadora
- Comparación con temporada anterior (si existe)

---

## Lógica del Calendario

El calendario centraliza **todos los eventos** de la rama de pádel, independiente de si son torneos, entrenamientos o sociales.

### Vistas del calendario:
- **Mensual** (default): grilla con puntos de color por tipo de evento
- **Lista**: próximos eventos ordenados cronológicamente (más útil en móvil)
- **Por temporada**: todos los eventos de la temporada activa

### Código de colores por tipo:
```
🔵 torneo_interno    → azul
🟣 torneo_externo    → morado
🟢 amistoso          → verde
🟡 entrenamiento     → amarillo
🟠 clase             → naranja
🔴 social            → rojo
⚪ otro              → gris
```

### Creación de eventos:
- Al crear un torneo interno, **se crea automáticamente un evento** en el calendario
- El admin puede crear eventos independientes (entrenamientos, clases, sociales)
- Eventos con `es_publico = true` son visibles sin login → útil para compartir el calendario por link con personas externas al grupo

### Integración con Google Calendar:
- El calendario tiene un endpoint ICS público: `/api/calendario.ics`
- Cualquier miembro puede suscribirse desde Google Calendar / Apple Calendar
- Se actualiza automáticamente cuando se agregan eventos

### Torneos externos en el calendario:
- Se registran como evento tipo `torneo_externo` con `url_externo`
- Opcionalmente, los jugadores se "anotan" para que el grupo sepa quiénes van
- NO generan fixture ni resultados en la app

---

## Sistemas de ranking

### ELO (competitivo)
```javascript
const K = 32  // factor de ajuste (ajustable)
const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
const newRatingA = ratingA + K * (score - expectedA)
// score: 1 = victoria, 0 = derrota
// Rating inicial: 1200 para todos
```

### Puntos acumulados (campeonato)
```
Victoria: +3 puntos
Empate:   +1 punto  (poco común en pádel, pero posible)
Derrota:  +0 puntos
Bonus sets: +0.1 por set ganado (desempate)
```

### Win/Draw/Loss simple
```
% victorias = victorias / partidos_jugados
Desempate: diferencia de sets
```

### Config admin:
- Puede cambiar el sistema de ranking activo para próximos torneos
- Los torneos ya finalizados mantienen el sistema con que fueron creados
- El ranking global visible muestra el sistema que el admin elija como "principal"

---

## Wizard de Creación de Torneo

El admin no crea el torneo llenando un formulario simple — pasa por un wizard de pasos
que guía toda la configuración antes de publicar. Basado en el simulador de campeonatos
ya construido para Saint George (reutilizar esa lógica).

### Paso 1 — Configuración general
```
- Nombre del torneo
- Temporada (selector — usa la activa por defecto)
- Ámbito: interno / externo
- Fecha inicio y fin estimadas
- Descripción opcional
```

### Paso 2 — Capacidad y formato
```
- Número de parejas (mínimo 4, máximo configurable)
- Formato:
    ○ Round Robin (todos vs todos)
    ○ Grupos + eliminatoria  ← más común
    ○ Eliminación directa
- Si grupos + eliminatoria:
    → Tamaño de grupos (3 o 4 parejas)  [auto-calculado según total]
    → Cuántas parejas pasan de cada grupo (1 o 2)
    → ¿Hay partido por 3er/4to lugar?
```

### Paso 3 — Turnos y canchas
```
- Número de canchas disponibles
- Días disponibles (ej. solo sábados)
- Bloques horarios por día (ej. 09:00 a 13:00, cada 45 min)
- El sistema calcula automáticamente cuántos días/turnos necesita el torneo
- Preview: "Con 3 canchas y 4 bloques por día, el torneo dura 2 jornadas"
```

### Paso 4 — Preview del fixture
```
- Muestra el fixture completo generado automáticamente
- Grupos formados (con slots para los nombres que se sortearán)
- Partidos por ronda con turno y cancha asignados
- Admin puede ajustar manualmente turnos o canchas si necesita
- Botón "Regenerar fixture" si quiere otra distribución
```

### Paso 5 — Publicar
```
- Resumen de todo lo configurado
- Opciones:
    ○ Guardar como borrador (invisible para jugadores)
    ○ Abrir inscripciones (visible, jugadores pueden inscribirse)
- Al publicar → se crea automáticamente el evento en el calendario
```

### Flujo post-inscripciones:
```
1. Admin abre inscripciones → jugadores se inscriben eligiendo pareja
2. Admin cierra inscripciones cuando llega al cupo o decide arrancar
3. Admin ejecuta "Sortear grupos" → sistema asigna parejas aleatoriamente a grupos
4. Fixture queda con nombres reales en cada posición
5. Admin publica el fixture → todos lo pueden ver
6. A medida que se juegan partidos → cualquier participante carga el resultado
7. El mapa del torneo se actualiza inmediatamente
```

---

## Lógica de Fixture Automático

### Round Robin:
```javascript
// Para N parejas → N*(N-1)/2 partidos totales
// Algoritmo de rotación circular (polygon method) para distribución equitativa
// Cada pareja juega exactamente N-1 partidos
// Referencia: fixture de 60 partidos ya construido para Saint George — reutilizar
```

### Grupos + eliminatoria:
```
Fase de grupos:
  - Distribuir parejas en grupos de 3 o 4 según configuración
  - Si el número no cuadra exactamente → grupos de tamaños mixtos (ej. 2 grupos de 4 + 1 de 3)
  - Dentro de cada grupo: round robin completo
  - Posiciones por: puntos → diferencial sets → diferencial games → sorteo

Fase eliminatoria:
  - Bracket con las clasificadas de cada grupo
  - Cruces: 1ro grupo A vs 2do grupo B, etc. (evitar enfrentamientos del mismo grupo en semifinales)
  - Si hay 8+ clasificadas: cuartos + semis + final
  - Si hay 4 clasificadas: semis + final (+ 3er/4to si el admin lo activó)
  - Bracket generado con posiciones TBD hasta que avancen las parejas
```

### Eliminación directa:
```
- Bracket estándar, potencia de 2
- Si no cuadra: byes automáticos en primera ronda (las mejor rankeadas de la temporada reciben el bye)
```

---

## Bracket Visual (fases eliminatorias)

Componente `BracketVisual.jsx` — renderiza el cuadro de eliminación directa.

### Estructura visual:
```
Cuartos          Semifinales      Final         Campeón
─────────────────────────────────────────────────────
[Pareja A]  ──┐
              ├──► [Ganador QF1] ──┐
[Pareja B]  ──┘                    ├──► [Ganador SF1] ──┐
                                   │                    ├──► 🏆 CAMPEÓN
[Pareja C]  ──┐                    │                    │
              ├──► [Ganador QF2] ──┘   [Ganador SF2] ──┘
[Pareja D]  ──┘
```

### Comportamiento:
- Partidos **pendientes**: muestra nombres de las parejas, resultado en blanco, botón "Cargar resultado"
- Partidos **jugados**: muestra marcador (ej. 6-3 / 4-6 / 7-5), ganador destacado en verde
- Partidos **TBD**: muestra "Por definir" hasta que avancen las parejas del partido anterior
- Al registrar un resultado → el ganador avanza automáticamente al siguiente slot del bracket
- En móvil: bracket scrolleable horizontalmente

### Tecnología:
- Implementar en React con SVG o con divs + CSS flexbox
- NO usar librerías externas de bracket — construir propio para control total
- Mismo estilo visual que el simulador previo de Saint George

---

---

## Buscador de compañero

Inputs:
- Día(s) de la semana disponible
- Bloque horario (mañana/tarde/noche)
- Nivel deseado del compañero (rango)
- Lado preferido del compañero (opcional)

Output:
- Lista de jugadores que matchean, ordenada por compatibilidad
- Card con: foto, nombre, nivel, lado, disponibilidad común
- Botón "Contactar por WhatsApp" (abre wa.me/ con número)

---

## Carga inicial de jugadores

Al iniciar el proyecto, Pancho proveerá un archivo (Excel o CSV) con la base
de jugadores actuales. El sistema debe:
1. Leer el archivo y crear los registros en `jugadores`
2. Crear cuentas en Supabase Auth con estado `activo` (saltarse flujo de aprobación)
3. Marcar `estado_cuenta = 'activo'` directamente
4. Enviar email de "tu cuenta está lista" con link para setear contraseña

Script de seed: `/scripts/seed-jugadores.js` — ejecutar una sola vez.

---

## Funcionalidades v1 (MVP)

- [ ] Auth completo: registro → pendiente → aprobación admin → activo
- [ ] Carga inicial de jugadores via script seed
- [ ] **Temporadas:** crear, activar, cerrar — una activa a la vez por deporte
- [ ] Perfil de jugador: edición propia, vista pública
- [ ] Disponibilidad horaria por día y bloque
- [ ] Directorio de jugadores (todos los activos)
- [ ] Buscador de compañero por disponibilidad y nivel
- [ ] **Calendario centralizado:**
  - [ ] Vista mensual + vista lista (próximos eventos) — lista prioritaria en móvil
  - [ ] Código de colores por tipo de evento
  - [ ] Admin crea eventos: torneo, entrenamiento, clase, amistoso, social
  - [ ] Endpoint ICS `/api/calendario.ics` para suscribirse desde Google/Apple Calendar
  - [ ] Torneos externos: registro en calendario + quiénes van
- [ ] Crear torneo interno (admin): **wizard de 5 pasos** (configuración → formato → turnos/canchas → preview fixture → publicar)
- [ ] Sorteo de grupos al cerrar inscripciones
- [ ] Fixture generado automáticamente con turnos y canchas asignados
- [ ] Inscripción a torneo: jugador elige pareja
- [ ] Registro de resultado **por sets** (detalle game a game dentro de cada set)
  - [ ] Cálculo automático de sets ganados, games ganados, diferencial
  - [ ] Ganador derivado del marcador — no se ingresa manualmente
- [ ] **Mapa del torneo** — se actualiza automáticamente al registrar cada resultado:
  - [ ] Tabla de posiciones por grupo (puntos → sets → games)
  - [ ] **Bracket visual** para fase eliminatoria (cuadro tipo campeonato)
  - [ ] Ganadores avanzan automáticamente al siguiente slot del bracket
- [ ] Bloqueo/desbloqueo de resultado por admin
- [ ] Ranking por temporada (3 sistemas, admin elige cuál mostrar)
- [ ] Recálculo automático de ranking al registrar resultado
- [ ] Registro de partidos amistosos (con toggle para afectar ranking)
- [ ] Panel admin: usuarios pendientes, eventos, torneos, corrección de nivel
- [ ] Responsive mobile-first (uso principal desde celular en la cancha)

## Funcionalidades v2 (post-MVP)

- [ ] Notificación WhatsApp/email al aprobar usuario o crear evento
- [ ] Historial completo de partidos y eventos por jugador
- [ ] Estadísticas avanzadas: racha, rendimiento por compañero, mejor pareja
- [ ] Exportar fixture como imagen PNG (para compartir en WhatsApp)
- [ ] Modo espectador público: calendario y fixture sin login
- [ ] Comparación de ranking entre temporadas
- [ ] Herencia de ELO entre temporadas (admin elige)
- [ ] Preparar arquitectura para segundo deporte (tenis)

---

## Reglas de desarrollo

- RLS activado en todas las tablas — nunca confiar solo en el frontend
- `es_admin` verificado en RLS policy (backend), no solo en UI
- `resultado_bloqueado = true` → RLS impide UPDATE para no-admins
- Nivel 1-5: mostrar como bolitas de color (1=gris, 5=dorado)
- Fechas DD/MM/YYYY en UI, ISO en DB
- Al crear torneo interno → crear evento en calendario automáticamente
- Mobile-first: S23 Ultra como referencia (uso desde cancha)

---

## Deploy

- **Frontend + API:** Vercel (Free tier suficiente)
- **DB/Auth:** Supabase Pro — schema `padel`
- **Storage:** Supabase Storage — bucket `avatares` (fotos de perfil)
- **Repo:** https://github.com/fjrosselot/padel-sg

---

## Comandos

```bash
npm run dev       # desarrollo local
npm run build     # build producción
node scripts/seed-jugadores.js  # carga inicial (solo una vez)
vercel --prod     # deploy
```

## Variables de entorno (.env.local)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # solo para script seed, NUNCA en frontend
```

---

## Estado actual (al 30-03-2026)

App en producción: **https://padel-sg-omega.vercel.app**

### Implementado y funcionando:
- ✅ Auth completo (registro → pendiente → aprobación → activo) + reset de contraseña
- ✅ 97 jugadores cargados con estado `activo`, niveles y lado_preferido
- ✅ Temporadas: CRUD + activar/cerrar
- ✅ Perfil de jugador + disponibilidad + buscador de compañero
- ✅ Directorio de jugadores con búsqueda y filtros
- ✅ Calendario: vista lista + mensual, creación admin, tipos de evento
- ✅ Wizard de torneo (5 pasos) + fixture automático
- ✅ Registro de resultados por sets, tabla de grupos, bracket eliminatorio
- ✅ Ranking por temporada (puntos / ELO / WDL)
- ✅ Registro de amistosos
- ✅ Panel admin centralizado
- ✅ Diseño rediseñado según referencia visual (screenshots en `~/Pictures/AppPadel/`)

### Pendiente / en progreso:
- ⬜ Toggle `resultado_bloqueado` en TorneoDetalle (admin bloquea/desbloquea resultado)
- ⬜ Recálculo automático de ranking al guardar resultado (actualmente manual desde RankingPage)
- ⬜ Toggle "amistosos afectan ranking" por temporada
- ⬜ Endpoint ICS `/api/calendario.ics` para suscripción externa
- ⬜ Cambio de contraseña desde perfil (los 97 importados tienen `Padel2026!` temporal)

---

## Sistema de diseño (desde 30-03-2026)

Referencia visual: `~/Pictures/AppPadel/` — screenshots de la app de referencia.

```
Navy (header, títulos):   #1B2A4A
Accent (botones, activo): #2563EB  (blue-600)
Background:               bg-gray-100  (#f3f4f6)
Cards:                    bg-white + border-gray-100 + shadow-sm + rounded-2xl
```

### Componentes compartidos — `src/lib/ui.jsx`
- `Avatar` — círculo con iniciales en color determinístico por nombre
- `avatarColor(str)` — color de avatar basado en hash del nombre
- `getInitials(nombre)` — 2 iniciales del nombre
- `Spinner` — spinner centrado azul
- `PageTitle` — `text-2xl font-black text-[#1B2A4A] uppercase tracking-tight`
- `SectionLabel` — label de sección en gris uppercase
- `Pills` — filtros tipo pill con uno activo en azul
- `Card` — wrapper de card estándar

### Convenciones de estilo:
- Títulos de página: uppercase, font-black, color navy
- Botones CTA primarios: `bg-blue-600 text-white font-black uppercase tracking-widest`
- Botones de acción en header/página: `bg-[#1B2A4A]` con texto blanco
- Pills filtro: activo = `bg-blue-600`, inactivo = `bg-white border-gray-200`
- Cards de lista: `bg-white rounded-2xl shadow-sm border border-gray-100`
- `hover:border-blue-200 hover:shadow-md` en cards clickeables

---

## Notas de infraestructura

### Supabase — schema `padel`
- Instancia: `dzxhtvfrvkisrjcicdfo` (Free plan compartido)
- El schema `padel` NO estaba expuesto en PostgREST por defecto
- **Fix aplicado:** `ALTER ROLE authenticator SET pgrst.db_schemas = 'public, americano, padel'` + `NOTIFY pgrst, 'reload schema'`
- Si se agrega una tabla nueva al schema, volver a ejecutar `NOTIFY pgrst, 'reload schema'`
- Grants ya otorgados: `GRANT USAGE ON SCHEMA padel TO anon, authenticated` y SELECT/INSERT/UPDATE/DELETE en todas las tablas

### Columna `nivel` en `jugadores`
- Tipo: **text**, NOT integer
- Valores válidos (CHECK constraint): `'6a','5a','4a','3a','2a','1a','D','C','B','A'`
- Mapeo del formulario original: Avanzado→3a, Intermedio-Avanzado→4a, Intermedio→4a, Principiante-Intermedio→5a, Principiante→6a

### Columna `hijos` en `jugadores`
- Reemplaza a `anio_curso_hijo` (migración 004)
- Tipo: JSON array de strings — ej. `["4°B"]`

### Variables de entorno
- En Vercel: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` ya configuradas
- `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_ACCESS_TOKEN` solo en `.env.local` (nunca en frontend ni Vercel)

- La app está en producción en https://padel-sg-omega.vercel.app
- El trabajo con Stitch es un REDISEÑO visual — la lógica funciona, 
- solo se actualiza la UI componente por componente.
