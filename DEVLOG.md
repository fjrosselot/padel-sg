# DEVLOG — padel-sg

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
