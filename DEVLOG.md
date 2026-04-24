# DEVLOG — padel-sg

## [2026-04-24 17:30] — Dashboard widgets + UX tab bar mis partidos + reabrir en modal

**Resumen:** Se reemplazó la sección "Accesos rápidos" del Dashboard por 3 widgets funcionales: sparkline de evolución de ranking (últimos 60 días, SVG puro), resumen de pagos pendientes con link a /finanzas, y lista de novedades admin desde nueva tabla `padel.novedades`. Se movió el pill "Mis partidos" al nivel del tab bar (fuera del contenido) y "Reabrir torneo" se trasladó al modal de edición.

**Archivos:** `src/features/dashboard/Dashboard.tsx`, `src/features/dashboard/DashboardWidgets.tsx` (nuevo), `src/features/torneos/FixtureTab.tsx`, `src/features/torneos/HorarioTab.tsx`, `src/features/torneos/TorneoDetalle.tsx`, `src/features/torneos/EditTorneoModal.tsx`, `package.json`

**Decisiones:**
- Sparkline SVG puro (sin librería externa) — polyline con valores acumulados por categoría, color `#e8c547`
- `soloMis` lifted de FixtureTab/HorarioTab a TabsDetalle — pill en tab bar visible solo en tabs fixture/horario
- `reabrirTorneo` mutation movida a EditTorneoModal (inline, cierra modal al éxito) — elimina botón standalone de acciones admin
- `padel.novedades`: tabla simple con RLS `activo=true`, sin UI admin aún (carga desde Supabase Studio)
- PagosSummary reutiliza patrón fetch+session token de FinanzasPage
- v0.4.55 → v0.4.57

**Pendientes:**
- [ ] UI admin para gestionar novedades (crear/editar/desactivar desde la app)
- [ ] Verificar sparkline ranking con datos reales (la mayoría de jugadores puede no tener eventos en 60 días)
- [ ] Probar PagosSummary con jugadores que tengan cobros activos

---

## [2026-04-24 09:00] — Rediseño unificado fixture/horario + mockups + ProximosPartidos dashboard

**Resumen:** Se reimplementó PartidoRow con formato BracketCard (cabecera tintada por categoría, nombres apilados, score por equipo) para todas las vistas. Se unificaron los pills de filtro de FixtureTab al estilo de JugadoresPage (`overflow-x-auto no-scrollbar`). Se implementaron 3 mockups responsivos (Dashboard, Calendario "Mis partidos", TorneoDetalle "Solo mis partidos"). Se agregó widget ProximosPartidos al Dashboard y modo "Mis partidos" en CalendarioPage.

**Archivos:** `src/features/torneos/PartidoRow.tsx`, `src/features/torneos/FixtureTab.tsx`, `src/features/torneos/HorarioTab.tsx`, `src/features/torneos/BracketTab.tsx`, `src/features/dashboard/Dashboard.tsx`, `src/features/calendario/CalendarioPage.tsx`, `src/features/mockups/DashboardMockup.tsx`, `src/features/mockups/CalendarioMockup.tsx`, `src/features/mockups/TorneoDetalleMockup.tsx`, `src/router.tsx`, `package.json`

**Decisiones:**
- `parseTeamScores()`: 1 set → "6-4" separado por guión; múltiples sets → "6·5·6" / "4·7·4" (punto medio)
- `buildCatColorMap()` index-based produce paleta pastel consistente; header con fondo tintado + color de cabecera
- CalendarioPage usa `fecha_inicio` del torneo como agrupador de fecha (los partidos no tienen fecha individual)
- Rival en ProximosPartidos: pareja cuya ninguna jugador_id coincide con el user
- Mockups en `/mockup/dashboard`, `/mockup/calendario`, `/mockup/torneo-detalle` (lazy-loaded, sin auth)

**Pendientes:**
- [ ] Limpiar archivos mockup antes de release final (son temporales)
- [ ] CalendarioPage: mostrar fecha individual por partido cuando esté disponible en los datos

---

## [2026-04-23 11:00] — Compactar HorarioTab + fix badges VistaAgrupada + torneo Americano Abril 2026 en DB

**Resumen:** Se compactó el grid del HorarioTab (minHeight 90→58px, padding reducido, columnas más angostas, color de score perdedor más legible). En FixtureTab se agregó `abbrevCat()` para que los badges de categoría muestren "MI1"/"MA"/"HA" en lugar del nombre completo, evitando quiebres de línea. Además se insertó el torneo histórico "Americano SG Abril 2026" (ID `76564dcd`) con fixture completo (4 categorías, 24 partidos de grupo, 8 semis, 8 finales) y 24 inscripciones en Supabase; los `puntos_ranking` existentes no se tocaron.

**Archivos:** `src/features/torneos/HorarioTab.tsx`, `src/features/torneos/FixtureTab.tsx`, `package.json`

**Decisiones:**
- `abbrevCat()`: toma inicial de cada palabra no-numérica + número al final → "Mujeres Introducción 1" → "MI1". Nombres ≤4 chars se devuelven tal cual ("5a", "Open")
- Score perdedor en HorarioTab: `#94b0cc` → `#64748b` (slate-500) para mejor contraste con fondo blanco
- Torneo histórico insertado con `formato='grupos_eliminatoria'` en columna (constraint DB); `CategoriaFixture.formato='americano_grupos'` vive en JSONB sin restricción
- `puntos_ranking` ya apuntaba correctamente a `eventos_ranking` — no se requirió UPDATE

**Pendientes:**
- [ ] Verificar visualmente HorarioTab en producción (SG vs SSCC 2026)
- [ ] Verificar que badges "MI1"/"HA" se ven bien en Americano Por cancha / Por hora

---

## [2026-04-22 17:00] — Módulo Tesorería: bugs fixes y gestión de cobros

**Resumen:** Se corrigieron varios bugs en el módulo de Tesorería recién lanzado: el join inválido `torneo:torneos(nombre)` que rompía la query de cobros con un `.map is not a function`, y el `order=jugador.apellido.asc` en PostgREST que impedía cargar los jugadores del cobro (retornaba error → guard → `[]`). Se agregaron acciones de gestión de cobros (editar, eliminar, agregar/quitar jugadores). El sidebar desktop ahora se abre expandido por defecto. `PagosJugador` integrado en `JugadorDetalle` para admins.

**Archivos:** `src/features/tesoreria/TesoreriaAdmin.tsx`, `src/features/tesoreria/PagosJugador.tsx` (nuevo), `src/features/finanzas/FinanzasPage.tsx`, `src/features/jugadores/JugadorDetalle.tsx`, `src/components/layout/Sidebar.tsx`, `package.json`

**Decisiones:**
- PostgREST no soporta `order=alias.columna.asc` cuando el join usa alias (`jugador:jugadores`) — se ordena en cliente con `.sort()`
- Join `torneo:torneos` eliminado del query de cobros (sin FK definida en Supabase) — se puede agregar como campo solo si se crea la FK explícitamente
- Acciones de cobro (editar/eliminar/agregar jugadores) implementadas inline en TesoreriaAdmin sin subcomponentes adicionales
- FinanzasPage: filtro explícito `jugador_id=eq.${userId}` evita que RLS de admin exponga filas de otros jugadores

**Pendientes:**
- [ ] Marcar pagos con fecha y método personalizables (hoy hardcodea transferencia + fecha actual)
- [ ] Vista "Mis Pagos" del jugador muestra fechas en formato ISO — formatear a es-CL
- [ ] KPI "Pendientes hoy" en Tesorería muestra "—" siempre (calcular real desde detail queries)

---

## [2026-04-22 00:30] — Fix Copa Plata + motor fixture completo + mobile login UX

**Resumen:** Se completó la extracción del cálculo matemático del repo de referencia. Copa Plata ahora genera un bracket completo (potencia de 2) en vez de siempre 1 partido. La simulación de StepFixture calcula correctamente `silverTeams = grupos × (ppg - apg)`. En mobile, el heading "Bienvenidos" duplicado fue eliminado del form card y el párrafo del hero fue acortado para ganar espacio vertical.

**Archivos:** `src/lib/fixture/engine.ts`, `src/lib/fixture/types.ts`, `src/features/torneos/TorneoWizard/StepFixture.tsx`, `src/features/torneos/TorneoWizard/FixtureGantt.tsx`, `src/features/auth/LoginForm.tsx`, `package.json`

**Decisiones:**
- Se extrajo `buildBracket()` helper reutilizable para gold y silver brackets con nombres de fase configurables
- `buildPlayoffs` recibe `nonClassified?: ParejaFixture[]` — buildFixture los pasa desde `g.parejas.slice(cuantos_avanzan)`
- Mobile login: `formContent` convertido a función `formContent(showHeading)` para reutilizar sin duplicar JSX
- Fase `consolacion_cuartos` agregada al union type para brackets plata de 8+ equipos

**Pendientes:**
- [ ] `fixture_compacto`: el toggle existe pero el scheduler siempre usa modo greedy (no strict-rounds)
- [ ] Vista de fixture real en TorneoDetalle (bracket visual con resultados)
- [ ] Flujo de inscripción de parejas a torneo

---

## [2026-04-21 17:00] — Fix auth + mejoras UX: sort jugadores, rename evento ranking

**Resumen:** Se encontró y eliminó el root cause del bug recurrente "sin jugadores": el flag `psg_emergency_session` en sessionStorage hacía que `useUser()` devolviera un DEV_USER falso, ejecutando todas las queries sin JWT real (RLS retornaba `[]`). Se eliminó el bypass de emergencia de `useUser` y `AuthGuard`. También se ordenó el listado de jugadores por apellido y se renombró el evento de ranking "Torneo Externo Abril 2026" → "OSP Primera Fecha 2026".

**Archivos:** `src/hooks/useUser.ts`, `src/features/auth/AuthGuard.tsx`, `src/features/jugadores/JugadoresPage.tsx`

**Decisiones:**
- `hasEmergencySession()` eliminado de useUser — nunca debió devolver DEV_USER en producción
- `clearEmergencySession()` llamado en AuthGuard cuando no hay user real — limpia flags stale
- Password de fjrosselot@gmail.com reseteado vía SQL directo en `auth.users`
- Listado jugadores: `.order('apellido', { ascending: true })` en lugar de elo

**Pendientes:**
- [ ] Probar wizard de torneos end-to-end: 1 torneo interno (americano) + 1 desafío
- [ ] Actualizar teléfonos faltantes en jugadores (18 sin teléfono) — pendiente MCP Google Contacts o CSV manual
- [ ] Ligas detalle: jornadas, tabla posiciones, resultados
- [ ] Cleanup: eliminar archivos .jsx legacy en components/

---

## [2026-04-20 00:30] — Feature: Desafío por Puntos para torneos vs colegio

**Resumen:** Se implementó el formato `desafio_puntos` para torneos vs_colegio en 8 tareas con subagent-driven development. Cada pareja SG juega un partido (mejor de 3 sets) contra una pareja rival; los ganadores suman 1 punto al marcador escolar y 20 pts de ranking externo. Compatible con torneos mixtos (algunas categorías americano, otras desafío).

**Archivos:** `src/lib/fixture/types.ts`, `src/features/torneos/TorneoWizard/schema.ts`, `src/lib/fixture/engine.ts`, `src/lib/fixture/engine.test.ts`, `src/features/torneos/TorneoWizard/StepCategorias.tsx`, `src/features/torneos/TorneoWizard/StepFixture.tsx`, `src/features/torneos/TorneoWizard/StepConfirmar.tsx`, `src/features/torneos/TorneoDetalle.tsx`, `src/features/torneos/FixtureView.tsx`, `src/features/torneos/ResultadosModal.tsx`

**Decisiones:**
- `formato` opcional en `CategoriaConfig`/`CategoriaFixture` — backward-compatible, default `'americano_grupos'`
- `buildDesafioFixture()` retorna `partidos[]` flat (sin grupos ni eliminatoria); `pareja2: null` porque el rival se asigna después
- Scoreboard SG/Rival cuenta `ganador === 1` vs `ganador === 2` en `DesafioView`
- `upsertRankingPoints` crea/encuentra `eventos_ranking` por nombre del torneo, usa `.maybeSingle()` para evitar PGRST116
- Ranking points: ganador 20pts, perdedor 5pts — mismo modelo que torneos externos

**Pendientes:**
- [ ] Asignar `pareja2` (rival) en partidos desafío desde el roster admin
- [ ] Tests de los componentes auth rotos (BrandLogo, LoginForm, RegisterForm, AuthGuard, Sidebar) — pre-existentes, no relacionados con esta feature
- [ ] Estado `finalizado` y flujo de cierre de torneo
- [ ] Recalcular `posicion_espera` server-side (trigger Postgres)

---

## [2026-04-19 21:00] — Ciclo completo de torneo: sexo en categorías, inscripción por categoría, roster admin, fixture real

**Resumen:** Se implementó el ciclo de vida completo de un torneo en 5 tareas con subagent-driven development. Desde la creación con categorías M/F/Mixto hasta la generación del fixture real desde inscritos confirmados, pasando por lista de espera, roster admin y transiciones de estado.

**Archivos:** `supabase/migrations/20260419_inscripciones_categoria.sql`, `src/lib/types/database.types.ts`, `src/lib/fixture/types.ts`, `src/features/torneos/TorneoWizard/schema.ts`, `src/features/torneos/TorneoWizard/StepCategorias.tsx`, `src/features/torneos/TorneoWizard/StepConfirmar.tsx`, `src/features/torneos/TorneoWizard/constants.ts`, `src/features/torneos/InscripcionesPanel.tsx`, `src/features/torneos/RosterAdmin.tsx`, `src/features/torneos/RosterRow.tsx`, `src/features/torneos/TorneoDetalle.tsx`, `src/features/auth/LoginForm.tsx`, `src/assets/court-photo.png`

**Decisiones:**
- `sexo` en `CategoriaConfig` como `'M' | 'F' | 'Mixto'` — filtra compañeros en inscripción y admins en roster
- `lista_espera boolean + posicion_espera integer` en DB — posición calculada client-side desde cache (race condition documentada como known limitation para baja concurrencia)
- `InscripcionRow` compartida desde `RosterRow.tsx` — evita divergencia de tipos entre InscripcionesPanel y RosterAdmin
- Early return `if (!isAdmin)` movido después de todos los hooks — corrige Rules of Hooks violation
- Stats del login ahora dinámicos desde Supabase (anon key, sin auth)
- Fixture real: `buildFixture` recibe `ParejaFixture[]` con ELO real de jugadores; se guarda en `torneos.categorias` reemplazando el JSON de config

**Pendientes:**
- [ ] Recalcular `posicion_espera` server-side (trigger Postgres) para eliminar race condition
- [ ] Tests de LoginForm.test.tsx y RegisterForm.test.tsx rotos por cambios de sesiones anteriores — actualizar
- [ ] Probar ciclo completo en producción: crear torneo → abrir inscripciones → roster → generar fixture
- [ ] Estado `finalizado` y cierre de torneos

---

## [2026-04-19 18:30] — Logo Team Dragon + modal edición jugadores mejorado

**Resumen:** Se reemplazó el logo de texto P·SG por la imagen JPEG del Team Dragon Padel. Se rehízo el modal de edición de jugadores con nombre/apellido separados, botones guardar/cancelar en el header, y layout comprimido en grid 2 columnas.

**Archivos:** `src/components/brand/BrandLogo.tsx`, `src/assets/logo.jpeg`, `src/features/admin/AdminJugadores.tsx`

**Decisiones:**
- Logo: `<img>` con `rounded-full object-cover` — misma altura que el texto anterior, no requiere cambios de layout
- Modal: `nombre_pila` + `apellido` como campos separados en estado; se recombina como `"nombre apellido"` al guardar (compatible con DB existente)
- Save/Cancel en header — UX más natural en modales altos; evita scroll para confirmar cambios
- Grid 2 columnas para 10 campos — reduce altura del modal ~40%

**Pendientes:**
- [ ] Verificar AdminJugadores en producción con auth real
- [ ] RUT en registro de jugadores (diferido)

---

## [2026-04-19 16:00] — Polish: sonner, code splitting, migración verificada

**Resumen:** Se instaló sonner para reemplazar los 2 `alert()` de error en mutaciones. Se implementó code splitting con `React.lazy` + `Suspense` reduciendo el bundle de 817kB a chunks de máx 193kB. Se confirmó que la migración `amistosos_afectan_ranking` ya estaba aplicada en Supabase.

**Archivos:** `src/App.jsx`, `src/router.tsx`, `src/features/torneos/FixtureView.tsx`, `src/features/admin/AdminTemporadas.tsx`, `package.json`, `vite.config.ts`

**Decisiones:**
- Sonner v2 con `position="bottom-center" richColors` — mínima config, máximo impacto visual
- Code splitting via `React.lazy` en router — 16 chunks de rutas + 6 vendor, sin cambiar lógica
- `manualChunks` en vite.config.ts para separar react, supabase, tanstack, radix, lucide
- Migración `amistosos_afectan_ranking` confirmada activa en Supabase (proyecto `finanzas-padel-dev`)

**Pendientes:**
- [ ] Verificar AdminJugadores en producción con auth real (Playwright no disponible, verificar manualmente)
- [ ] RUT en registro de jugadores (diferido)

---

## [2026-04-18 13:30] — 5 features pendientes implementados + merge a main

**Resumen:** Se implementaron los 5 features del backlog via subagent-driven development en worktree aislado (`feat/pendientes-abril`). Varios ya estaban parcialmente implementados de sesiones anteriores; se completaron y verificaron todos con spec review + code quality review por agente.

**Archivos:** `src/lib/fixture/types.ts`, `src/lib/fixture/engine.ts`, `src/features/torneos/FixtureView.tsx`, `src/features/torneos/TorneoDetalle.tsx`, `src/features/torneos/ResultadosModal.tsx`, `src/features/ranking/RankingPage.tsx`, `src/features/admin/AdminTemporadas.tsx`, `src/features/perfil/PerfilPage.tsx`, `src/features/calendario/CalendarioPage.tsx`, `api/calendar.ts`, `src/router.tsx`, `src/lib/types/database.types.ts`, `supabase/migrations/20260414_amistosos_afectan_ranking.sql`

**Decisiones:**
- Toggle `resultado_bloqueado`: usa `alert()` como fallback de error (no hay toast library en el proyecto)
- Worktree global en `~/.config/superpowers/worktrees/` para reutilizar en todos los proyectos
- Endpoint ICS en `api/calendar.ts` (Vercel serverless) con `@vercel/node` ya instalado
- Migración SQL `amistosos_afectan_ranking` creada; verificar si ya fue aplicada en Supabase

**Pendientes:**
- [ ] Verificar migración `amistosos_afectan_ranking` aplicada en Supabase (columna puede no existir aún)
- [ ] Agregar librería toast (sonner) para reemplazar `alert()` en mutaciones
- [ ] Verificar AdminJugadores en producción con auth real
- [ ] Code splitting (>500kB warning en Vercel)
- [ ] RUT en registro de jugadores (diferido)

---

## [2026-04-16 17:00] — Bulk edit + optimistic updates + deploy a producción

**Resumen:** Se agregó edición masiva de jugadores con checkboxes y barra de acción bulk (campo + valor → aplica en paralelo a todos los seleccionados). Se implementaron optimistic updates para que los cambios individuales sean instantáneos. Se corrigió el auth para producción: en dev usa service key, en prod usa JWT del usuario. Deploy a Vercel.

**Archivos:** `src/features/admin/AdminJugadores.tsx`

**Decisiones:**
- Optimistic updates con `qc.setQueryData` en vez de `invalidateQueries` → UI instantánea, revierte en error
- `adminHeaders()` detecta si hay service key (dev) o usa `supabase.auth.getSession()` JWT (prod) — mismo código funciona en ambos entornos
- Bulk save con `Promise.allSettled` en paralelo — no bloquea si alguno falla
- `VITE_SUPABASE_SERVICE_KEY` y `VITE_DEV_BYPASS` NO deben estar en Vercel producción

**Pendientes:**
- [ ] RUT en registro de jugadores (diferido)
- [ ] Verificar AdminJugadores en producción con auth real
- [ ] Toggle `resultado_bloqueado` en TorneoDetalle
- [ ] Recálculo automático de ranking al guardar resultado
- [ ] Code splitting para reducir bundle (>500kB warning en Vercel)

---

## [2026-04-15 16:30] — AdminJugadores editable + fix RLS dev bypass

**Resumen:** Se completó la página Admin Jugadores con tabla editable y se resolvió el problema de datos vacíos causado por RLS bloqueando queries sin sesión real de Supabase. Se migraron todas las queries a fetch directo con service key. Se agregaron columnas separadas Apellido/Nombre ordenables, dropdowns con categorías por género (M: 5a/4a/3a/Open, F: D/C/B/Open), pills de ciclo para Mixto y Estado.

**Archivos:** `src/features/admin/AdminJugadores.tsx`, `src/lib/supabase.ts`, `.env.local`

**Decisiones:**
- Supabase JS client ignora service_role key cuando hay sesión cacheada en localStorage → se migró a fetch directo con headers explícitos para todas las queries de AdminJugadores
- `GRANT USAGE ON SCHEMA padel TO service_role` aplicado en Supabase (schema padel no tenía permisos para service_role)
- `VITE_SUPABASE_SERVICE_KEY` en `.env.local` (git-ignored) para dev bypass
- Mixto y Estado como pill-ciclo (click para rotar valores) en vez de select dropdown

**Pendientes:**
- [ ] RUT en registro de jugadores (decidido diferir)
- [ ] Limpiar logs de debug temporales en AdminJugadores.tsx y supabase.ts
- [ ] Arreglar StepConfirmar.tsx en Ligas y Torneos (cambios no commiteados)
- [ ] Probar edición inline en AdminJugadores (save con fetch PATCH)

---

## [2026-04-13 —] — Configuración variables de entorno (consulta)

**Resumen:** Sesión de consulta para configurar las variables de entorno en Vercel y Supabase Edge Functions. Sin cambios de código.

**Archivos:** ninguno

**Decisiones:** Variables `VITE_SUPABASE_*` van solo a Vercel. `SUPABASE_SERVICE_ROLE_KEY` y `RESEND_API_KEY` solo a Supabase Edge Functions secrets.

**Pendientes:**
- [ ] Agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel dashboard
- [ ] Obtener `SUPABASE_SERVICE_ROLE_KEY` desde Supabase Settings → API
- [ ] Crear cuenta Resend y agregar `RESEND_API_KEY` en Supabase secrets
- [ ] Agregar `APP_URL=https://padel-sg.vercel.app` en Supabase secrets
- [ ] Deploy edge functions: `npx supabase functions deploy approve-user reject-user`

---

## [2026-04-14 22:30] — Migraciones SQL + Deploy Vercel

**Resumen:** Se aplicaron las 2 migraciones SQL pendientes en Supabase via MCP, y se hizo deploy a producción en Vercel.

**Migraciones aplicadas (exitosas):**
- `20260414_003_torneos_config` — `jugadores.elo` (int, default 1200), `torneos.categorias` (jsonb), `torneos.config_fixture` (jsonb)
- `20260414_004_ligas_partidos` — `partidos.liga_id` (uuid FK), constraint `tipo` actualizado (`torneo|amistoso|liga`), stats columns en `liga_participantes`

**Deploy:**
- URL producción: `https://padel-sg-omega.vercel.app`
- Build: 529 kB JS bundle (warn: > 500kB — candidato a code splitting futuro)
- Status: ✅ READY

**Pendientes:**
- [ ] Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel dashboard (si no están)
- [ ] Configurar `RESEND_API_KEY` y `APP_URL` en Supabase secrets
- [ ] Deploy edge functions: `npx supabase functions deploy approve-user reject-user`
- [ ] Code splitting para reducir bundle (> 500kB warning)

---

## [2026-04-14 22:00] — Pase de diseño Plan 2 + Plan 3 (Stitch timeout → directo desde DESIGN.md)

**Resumen:** Pase de diseño completo sobre los 17 componentes de Torneos y Ligas. Stitch MCP dio timeout en todos los intentos (10 pantallas), por lo que el diseño se aplicó directamente desde el DESIGN.md. Se reemplazaron todas las clases genéricas de Tailwind por tokens del design system navy/gold. 48 tests verdes, tsc limpio.

**Pantallas con timeout en Stitch (todas):**
- TorneosList, TorneoWizard (4 pasos), TorneoDetalle, FixtureView, InscripcionesPanel, ResultadosModal
- LigasList, LigaWizard (3 pasos), LigaDetalle (RR + Escalerilla), StandingsTable, LadderView, DesafioModal, ResultadoLigaModal

**Archivos actualizados (sólo styling):**
- `src/features/torneos/TorneosList.tsx`, `TorneoDetalle.tsx`, `FixtureView.tsx`, `InscripcionesPanel.tsx`, `ResultadosModal.tsx`
- `src/features/torneos/TorneoWizard/index.tsx`, `StepTipo.tsx`, `StepCategorias.tsx`, `StepFixture.tsx`, `StepConfirmar.tsx`
- `src/features/ligas/LigasList.tsx`, `LigaDetalle.tsx`, `StandingsTable.tsx`, `LadderView.tsx`, `DesafioModal.tsx`, `ResultadoLigaModal.tsx`
- `src/features/ligas/LigaWizard/index.tsx`, `StepConfig.tsx`, `StepParticipantes.tsx`, `StepConfirmar.tsx`

**Decisiones:**
- gray-* → `text-muted` / `text-slate` / `bg-surface` / `bg-surface-high`
- blue-* selection states → `border-gold bg-gold/10`
- Botones primarios: `bg-gold text-navy font-bold`, secundarios: `bg-navy text-white`
- Sombras: `rgba(13,27,42,...)` en todos los cards y modales
- Primera fila standings: `bg-gold/10` (trofeo dorado sutil)
- LadderView usuario actual: `bg-gold/10 border-2 border-gold/30`

**Pendientes:**
- [ ] Rein tentativa de Stitch cuando el servicio esté estable (para mockups de referencia visual)
- [ ] Aplicar migración `20260414_004_ligas_partidos.sql` en Supabase SQL Editor
- [ ] Aplicar migración `20260414_003_torneos_config.sql` si no se hizo aún
- [ ] Configurar env vars en Vercel y Supabase

---

## [2026-04-14 18:30] — Plan 3 completo: Módulo Ligas

**Resumen:** Ejecución completa del Plan 3 (Ligas) mediante subagent-driven development. Se implementó el módulo completo de ligas con dos formatos: Round-Robin (standings vivos desde partidos) y Escalerilla (desafíos por posición). 9 tasks, 48 tests verdes, tsc limpio.

**Archivos:**
- `supabase/migrations/20260414_004_ligas_partidos.sql` — liga_id en partidos, tipo CHECK actualizado, stats en liga_participantes
- `src/lib/types/database.types.ts` — liga_participantes, liga_desafios, liga_id en partidos
- `src/lib/ligas/standings.ts`, `standings.test.ts` — cómputo puro de standings round-robin
- `src/features/ligas/LigasList.tsx`, `LigasList.test.tsx`
- `src/features/ligas/LigaWizard/schema.ts`, `StepConfig.tsx`, `StepParticipantes.tsx`, `StepConfirmar.tsx`, `index.tsx`
- `src/features/ligas/StandingsTable.tsx`, `StandingsTable.test.tsx`
- `src/features/ligas/LadderView.tsx`, `DesafioModal.tsx`
- `src/features/ligas/ResultadoLigaModal.tsx`, `ResultadoLigaModal.test.tsx`
- `src/features/ligas/LigaDetalle.tsx`
- `src/router.tsx` — rutas /ligas + /ligas/:id

**Decisiones:**
- Standings computados vivos desde partidos (no cacheados en liga_participantes) — simplifica consistencia
- ELO solo para el primer jugador de cada pareja en ligas individuales (diseño actual de ligas es 1v1)
- Validación por step en LigaWizard usando `methods.trigger()` antes de avanzar

**Pendientes:**
- [ ] Aplicar migración `20260414_004_ligas_partidos.sql` en Supabase SQL Editor
- [ ] Aplicar migración `20260414_003_torneos_config.sql` si no se hizo aún
- [ ] Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel dashboard
- [ ] Configurar `RESEND_API_KEY` y `APP_URL` en Supabase (secrets para edge functions)
- [ ] Deploy edge functions: `npx supabase functions deploy approve-user reject-user`
- [ ] Pase de diseño visual (Plan 2 + Plan 3): enhance-prompt → Stitch MCP → design-md → react-components

---

## [2026-04-12 20:15] — Plan 1 completo: Foundation + Auth

**Resumen:** Ejecución completa del Plan 1 (Foundation + Auth) mediante subagent-driven development. Se scaffoldeó el stack v2 completo (TypeScript, Tailwind, shadcn/ui New York), se migró el schema de Supabase con 10 tablas nuevas, y se implementó el flujo registro → pendiente → aprobación admin → login, con 12 tests pasando y deploy en Vercel.

**Archivos creados/modificados:**
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` — TypeScript + Vitest toolchain
- `tailwind.config.ts` — design tokens padel-sg (navy/gold palette, Manrope/Inter, sombras navy-tinted)
- `src/index.css`, `components.json` — shadcn/ui New York style con CSS variables
- `src/components/ui/` — 13 componentes shadcn (button, input, label, form, select, card, badge, avatar, dialog, dropdown-menu, tabs, scroll-area, separator)
- `supabase/migrations/20260413_002_v2_schema.sql` — 10 tablas nuevas + ALTER jugadores/torneos + RLS
- `src/lib/supabase.ts`, `src/lib/queryClient.ts`, `src/lib/types/database.types.ts` — cliente Supabase tipado
- `src/stores/appStore.ts`, `src/hooks/useUser.ts`, `src/hooks/useTemporada.ts` — Zustand + hooks TanStack Query
- `src/router.tsx`, `src/main.tsx` — React Router v6 con rutas protegidas
- `src/components/brand/BrandLogo.tsx` — logo P·SG (variante full y compact)
- `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `BottomNav.tsx`, `TopBar.tsx` — navigation shell
- `src/features/auth/schemas.ts`, `RegisterForm.tsx`, `LoginForm.tsx`, `PendingApproval.tsx`, `AuthGuard.tsx` — flujo auth completo
- `src/features/admin/PendingUsers.tsx` — cola de aprobación admin
- `supabase/functions/approve-user/index.ts`, `reject-user/index.ts` — Edge Functions con Resend

**Decisiones:**
- `jugadores.id` = auth user id directamente (FK a auth.users), sin columna `auth_user_id` separada
- shadcn/ui v4 con `strategy: 'class'` en @tailwindcss/forms para evitar conflicto de estilos
- `@apply bg-background` reemplazado por CSS nativo por incompatibilidad entre shadcn v4 (oklch) y Tailwind v3
- `allowJs: true` en tsconfig para coexistencia de código v1 (.jsx) y v2 (.tsx)

**Pendientes:**
- [ ] Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel dashboard
- [ ] Configurar `RESEND_API_KEY` y `APP_URL` en Supabase dashboard (secrets para edge functions)
- [ ] Deploy de edge functions: `npx supabase functions deploy approve-user reject-user`
- [ ] Plan 2: Torneos (wizard creación, inscripciones, llaves, resultados)
- [ ] Plan 3: Ligas (round robin, escalerilla, tabla de posiciones)

---

## [2026-04-14 23:00] — Task 1: TypeScript audit Plan 1-2-3

**Resumen:** Auditoría de TypeScript en todos los componentes de Plan 1, 2 y 3. Se encontraron y corrigieron 7 issues de tipado. `tsc --noEmit` limpio, 48 tests verdes.

**Fixes aplicados:**
- `InscripcionesPanel.tsx` — `Props.estado` y `nuevoEstado` tipados como uniones exactas
- `LadderView.tsx` — `Props.estado` tipado como `'borrador' | 'activa' | 'finalizada'`
- `LigaDetalle.tsx` — `PartidoLiga.estado` tipado como unión de estados válidos
- `ResultadoLigaModal.tsx` — mismo fix
- `standings.ts` — `PartidoResult.estado` tipado estrictamente
- Tests — fixtures de test actualizados con `as const` para mantener tipos literales

**Pendientes:** ninguno

---

## [2026-04-14 23:15] — Task 2: Edge case tests ELO + fixture engine + standings

**Resumen:** Se agregaron 33 tests de edge cases distribuidos entre los 3 módulos de lógica pura. Total: 48 → 81 tests.

**Tests agregados:**
- `elo.test.ts` +14: expectedScore (gap 400, extremos), newElo (simetría, favorito vs underdog, draw, K custom), applyEloMatch (ambos jugadores ganan/pierden, ELO promedio)
- `engine.test.ts` +13: generateRoundRobin (2 parejas, no autopartido, apariciones iguales, BYE), buildGroups (2 grupos, snake ELO), buildPlayoffs (vacío, solo final, flags con_consolacion/con_tercer_lugar)
- `standings.test.ts` +7: lista vacía, estado != jugado ignorado, ganador null ignorado, tiebreaker por diff sets, jugador fuera de lista, doble pareja cuenta ambos

---

## [2026-04-14 23:45] — Task 4: Auditoría accesibilidad básica (WCAG AA)

**Resumen:** Revisión de accesibilidad en 23 archivos de Plan 1-2-3. Fixes en 13 archivos. 81 tests verdes, tsc limpio.

**Fixes aplicados:**
- Modales (`ResultadoModal`, `DesafioModal`, `ResultadoLigaModal`): `role="dialog" aria-modal="true" aria-labelledby`
- Cards clickeables (`TorneosList`, `LigasList`): `role="button" tabIndex={0} onKeyDown` para navegación por teclado
- Botones selector/toggle: `aria-pressed` en todos los estados binarios
- Inputs de formulario: `id` + `htmlFor` en wizard steps (Step 1-4 torneos, Step 1-3 ligas)
- Elementos decorativos: `aria-hidden="true"` en iconos/spans decorativos
- Focus rings: `focus:ring-2 focus:ring-gold/50` en botones interactivos
- Contraste WCAG AA verificado por cálculo de luminancia — los 5 colores de badge pasan 4.5:1 sin cambios

**Pendientes:** ninguno

---

## [2026-04-14 23:30] — Task 3: README.md completo

**Resumen:** Se generó el README.md completo con descripción, stack, estructura de carpetas, instrucciones de local, deploy, diseño, y screenshots placeholder.

**Secciones:** Descripción + estado · Stack (tabla) · Funcionalidades Plan 1-3 · Estructura de carpetas · Cómo correr en local · Deploy (Vercel + Edge Functions) · Diseño · Screenshots placeholder · Tests · Licencia

---
