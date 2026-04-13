# DEVLOG — padel-sg

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
