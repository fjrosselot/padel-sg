# App Central de Pádel — Saint George

Aplicación web cerrada para la comunidad de pádel de apoderados del colegio Saint George.
Acceso solo con aprobación manual del admin. Producción: **https://padel-sg-omega.vercel.app**

---

## Versionado — X.Y.Z

```
X → Major: cambio de arquitectura o nuevo deporte
Y → Minor: nuevo módulo o funcionalidad
Z → Patch: bug fix, ajuste menor, mejora de UI — se bumea en CADA commit con código
```

Versión actual: **0.4.116**

---

## Stack

- **Frontend:** React + TypeScript (Vite) + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase Pro — schema `padel` (instancia `dzxhtvfrvkisrjcicdfo`, sa-east-1)
- **Auth:** Supabase Auth (email/password) con aprobación manual
- **Deploy:** Vercel
- **Repo:** https://github.com/fjrosselot/padel-sg
- **Routing:** react-router-dom v6 (lazy imports en `src/router.tsx`)
- **Data fetching:** TanStack React Query
- **API helper:** `padelApi` en `src/lib/api.ts` — wraps fetch con headers Supabase + adminHeaders para service role

---

## Design System

Colores:
```
Navy (sidebar, headers):  #162844
Gold (activo, accent):    #e8c547
Steel Blue (secundario):  #94b0cc
Background:               #f8fafc
Surface (cards):          white + border + shadow-sm + rounded-xl
Muted text:               text-muted (CSS var)
```

Tipografía: Geist Variable (cuerpo), Manrope (marca), Inter (UI)

Referencia visual: `/DESIGN.md` + `/stitch-designs/`

> ⚠️ Los colores `#1B2A4A` y `#2563EB` están OBSOLETOS. Usar navy `#162844` y gold `#e8c547`.

---

## Estructura de carpetas

```
src/
├── features/           ← lógica de dominio
│   ├── torneos/        ← TorneosList, TorneoDetalle, TorneoWizard/, ResultadosModal, BracketTab, FixtureTab, HorarioTab, PartidoRow, etc.
│   ├── admin/          ← AdminJugadores, AdminCategorias, AdminTemporadas, AdminPartidos, PendingUsers
│   ├── jugadores/      ← JugadoresPage, JugadorDetalle, JugadorDetalleSidebar, JugadorPartidos, LadoBadge
│   ├── ranking/        ← RankingPage, etc.
│   ├── amistosos/
│   ├── finanzas/
│   ├── calendario/
│   ├── categorias/
│   ├── perfil/
│   └── dashboard/
├── components/
│   ├── layout/         ← Sidebar.tsx, BottomNav.jsx
│   ├── brand/          ← BrandLogo
│   ├── ui/             ← shadcn components
│   └── ...
├── lib/
│   ├── supabase.ts
│   ├── api.ts          ← padelApi (get/post/patch/delete/rpc) + adminHeaders
│   ├── fixture/        ← types.ts, generarFixture.ts, etc.
│   └── ...
├── hooks/
│   ├── useUser.ts      ← usuario autenticado + rol
│   └── ...
└── router.tsx          ← todas las rutas, lazy imports
```

---

## Modelo de datos (schema `padel`)

### `jugadores`
| campo | tipo | notas |
|---|---|---|
| id | uuid | PK = auth.users UUID |
| nombre | text | |
| apodo | text | Opcional |
| email | text | UNIQUE |
| foto_url | text | Supabase Storage bucket `avatares` |
| nivel | text | CHECK: `'6a','5a','4a','3a','2a','1a','D','C','B','A'` |
| lado_preferido | text | `drive` / `reves` / `ambos` |
| hijos | jsonb | Array strings ej. `["4°B"]` — reemplazó `anio_curso_hijo` |
| rol | text | `superadmin` / `admin_torneo` / `jugador` |
| estado_cuenta | text | `pendiente` / `activo` / `suspendido` |
| elo | numeric | ELO actual del jugador |

### `torneos`
| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| nombre | text | |
| formato | text | `grupos_eliminatoria` / `round_robin` / `eliminacion_directa` / `americano` |
| estado | text | `borrador` / `inscripcion` / `en_curso` / `finalizado` |
| categorias | jsonb | **Fuente de verdad del fixture completo** — ver estructura abajo |
| temporada_id | uuid | FK → temporadas |
| fecha_inicio | date | |
| ambito | text | `interno` / `externo` |

**Estructura `categorias` JSONB:**
```json
[{
  "id": "cat-uuid",
  "nombre": "Cat 1",
  "grupos": [{
    "nombre": "G1",
    "partidos": [{
      "id": "p-uuid",
      "fase": "grupo",
      "pareja1": { "id": "i1", "nombre": "García / López", "jugador1_id": "uuid", "jugador2_id": "uuid" },
      "pareja2": { ... },
      "ganador": 1,
      "resultado": "6-3 6-4",
      "cancha": 1,
      "turno": "09:00"
    }]
  }],
  "faseEliminatoria": [ /* misma estructura de partidos */ ],
  "consola": [ /* partidos por 3er/4to */ ]
}]
```

### `partidos` (tabla relacional — fuente de verdad para historial y stats)
| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| torneo_id | uuid | FK → torneos (null si amistoso) |
| tipo | text | `torneo` / `amistoso` |
| fase | text | `grupo` / `cuartos` / `semifinal` / `tercer_lugar` / `final` |
| grupo | text | Ej. "G1" (solo fase de grupos) |
| pareja1_j1 | uuid | FK → jugadores |
| pareja1_j2 | uuid | FK → jugadores (null si individual/ext) |
| pareja2_j1 | uuid | FK → jugadores (null si rival externo) |
| pareja2_j2 | uuid | FK → jugadores (null si rival externo) |
| sets_pareja1 | integer | Sets ganados pareja 1 |
| sets_pareja2 | integer | Sets ganados pareja 2 |
| resultado | text | Ej. "6-3 6-4" (texto libre) |
| ganador | integer | `1` o `2` — null hasta registrar resultado |
| estado | text | `pendiente` / `jugado` / `walkover` |
| fecha | date | |

> **Patrón dual-write:** ResultadosModal escribe en AMBOS: `partidos` (relacional) Y `torneos.categorias` (JSONB).
> El JSONB sigue siendo la fuente de verdad para renderizar el fixture. `partidos` es fuente de verdad para historial de jugador, stats y AdminPartidos.

### `inscripciones`
| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| torneo_id | uuid | |
| categoria_id | text | ID de categoría dentro del JSONB |
| jugador1_id | uuid | |
| jugador2_id | uuid | |
| estado | text | `pendiente` / `confirmada` |
| nombre_pareja | text | Nombre visible |

### `categorias` (tabla separada, complementa JSONB)
Existe como tabla relacional para lookup de categorías. Ver `20260426_categorias_table.sql`.

### `puntos_ranking` y VIEW `ranking_categoria`
El ranking se acumula en `puntos_ranking`. La VIEW `ranking_categoria` agrega los puntos por jugador/categoría/temporada.

### `amistosos`
Partidos amistosos registrados por los jugadores.

### `temporadas` / `deportes`
Agrupadores. Solo deporte `padel` en v1.

---

## Roles y permisos

| Rol | Acceso |
|---|---|
| `superadmin` | Todo — incluyendo editar torneos, aprobar usuarios, borrar |
| `admin_torneo` | Gestión de torneos y resultados |
| `jugador` | Solo lectura + inscripción + registrar resultados propios |

> Check en frontend: `user?.rol === 'superadmin' \|\| user?.rol === 'admin_torneo'`
> El admin bypass de RLS usa `adminHeaders` con service role key (solo en páginas admin).

---

## Flujo ResultadosModal (dual-write)

```
1. Admin selecciona ganador y resultado (texto "6-3 6-4")
2. parseResultadoSets() → calcula sets_pareja1/sets_pareja2
3. PATCH partidos/{id} → ganador, resultado, estado, pareja1_j1/j2, pareja2_j1/j2, sets
4. applyResultToCategoria() → deep-map del JSONB para encontrar el partido por id
5. PATCH torneos/{torneoId} → categorias actualizado
6. invalidateQueries(['torneo', torneoId])
```

---

## Navegación (router.tsx)

```
/dashboard
/jugadores
/jugadores/:id       ← JugadorDetalle (sidebar + 3 tabs: Mis partidos / Mis puntos / Mis pagos)
/jugadores/:id/partidos ← JugadorPartidos (historial completo, paginado)
/perfil              ← redirect a /jugadores/:myId (propio perfil = esPropioPeril=true)
/rankings
/torneos
/torneos/:id         ← TorneoDetalle (tabs: Fixture / Bracket / Horario)
/amistosos
/calendario
/finanzas
/admin/usuarios      ← PendingUsers
/admin/jugadores     ← AdminJugadores
/admin/tesoreria
/admin/categorias    ← AdminCategorias
/admin/partidos      ← AdminPartidos (log de partidos + edición inline)
```

---

## RPCs útiles

- `get_player_historial(jugador_id)` → lee tabla `partidos` vía LEFT JOINs en jugadores ×4, retorna historial completo del jugador (incluye torneos externos como OSP)
- `ranking_categoria` VIEW → puntos por jugador/categoría

---

## Comandos

```bash
npm run dev           # desarrollo local
npm run build         # build producción
npm run test          # vitest
npm run typecheck     # tsc --noEmit
```

---

## Infraestructura Supabase

- Instancia: `dzxhtvfrvkisrjcicdfo` (Pro, sa-east-1)
- PostgREST expone schema `padel`: `ALTER ROLE authenticator SET pgrst.db_schemas = 'public, americano, padel'`
- Si se agrega tabla nueva: `NOTIFY pgrst, 'reload schema'`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en Vercel. `SUPABASE_SERVICE_ROLE_KEY` solo en `.env.local`.

---

## Estado actual (al 27-04-2026) — v0.4.116

### Implementado y funcionando:
- ✅ Auth completo (registro → pendiente → aprobación → activo) + reset contraseña
- ✅ ~97 jugadores activos
- ✅ Temporadas: CRUD + activar/cerrar
- ✅ Perfil de jugador + disponibilidad + buscador de compañero
- ✅ Directorio de jugadores + búsqueda + filtros
- ✅ Calendario: vista lista + mensual, creación admin
- ✅ Wizard de torneo (5 pasos) + fixture automático (grupos, round robin, americano)
- ✅ Fixture display: FixtureTab (por grupo / cancha / hora), BracketTab, HorarioTab
- ✅ Registro de resultados (ResultadosModal) — dual-write a partidos + JSONB
- ✅ Tabla de grupos, bracket eliminatorio
- ✅ Ranking por temporada (puntos / ELO / WDL) — VIEW ranking_categoria
- ✅ Registro de amistosos
- ✅ JugadorDetalle rediseñado: sidebar + 3 tabs (Mis partidos / Mis puntos / Mis pagos)
- ✅ JugadorDetalleSidebar: avatar, apodo, lado preferido, ranking ATP, badges, morosidad, editar perfil, cambiar contraseña (solo propio)
- ✅ get_player_historial RPC migrado a leer de tabla `partidos` (incluye torneos externos OSP)
- ✅ JugadorPartidos: página `/jugadores/:id/partidos` con historial completo y sort
- ✅ PerfilPage unificada: redirect a `/jugadores/:id` → esPropioPeril=true muestra edición
- ✅ Badges computados desde historial: 🔥 En racha, 🏆 Campeón, 🥈 Finalista, 💪 Sólido, ⭐ Veterano
- ✅ Panel admin: usuarios, jugadores, categorías, tesorería, partidos (log + sort por fecha/hora)
- ✅ AdminPartidos: log con sort cronológico y edición inline
- ✅ Sembrado (seeding) de bracket (SembradoPanel)
- ✅ Edición y borrado de torneos (EditTorneoModal, DeleteTorneoDialog)
- ✅ Inscripciones con categoría + RosterAdmin
- ✅ OSP Primera Fecha 2026: todos los partidos completos en tabla `partidos`

### Pendiente / deuda técnica:
- ⬜ Toggle `resultado_bloqueado` en TorneoDetalle
- ⬜ Recálculo automático de ranking al guardar resultado
- ⬜ Toggle "amistosos afectan ranking" por temporada
- ⬜ UI admin para novedades/noticias
- ⬜ RLS para jugadores vean sus propios cobros (hoy requiere adminHeaders)
- ⬜ Puntos/historial en sidebar: mostrar puntos a defender reales desde `puntos_por_defender` view

---

## Notas importantes

- **nivel** en `jugadores` es **text**, no integer. Valores: `'6a','5a','4a','3a','2a','1a','D','C','B','A'`
- **hijos** en `jugadores` es jsonb array de strings
- **adminHeaders**: `{ 'apikey': SERVICE_KEY, 'Authorization': 'Bearer SERVICE_KEY' }` — usar en páginas admin para bypass RLS
- La app usa el supabase JS client para auth, pero `padelApi` (fetch directo) para queries con adminHeaders
- PostgREST multi-FK limitation: múltiples FKs de `partidos` a `jugadores` impiden embedded joins → usar two-step queries (fetch partidos, luego fetch jugadores por IDs)
- **esPropioPeril**: `user?.id === id` — determina si JugadorDetalle muestra edición de perfil, contraseña y logout
- **queryKey colisión**: `useMorosidad` usa `['morosidad-jugador', id]`, distinto al de `PagosJugador` `['pagos-jugador', id]`
- Mockups en `/mockup/padel-sg/*` — iteración de diseño antes de implementar en producción
- Diseños en `/stitch-designs/` son la referencia visual definitiva. No usar `~/Pictures/AppPadel/` (obsoleto).
