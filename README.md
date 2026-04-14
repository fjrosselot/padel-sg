# Pádel SG — Plataforma de Gestión Pádel Saint George's

Plataforma cerrada de gestión deportiva para el club de pádel Saint George's. Gestiona jugadores, torneos, ligas, y resultados con ELO rating individual.

**Estado:** En desarrollo activo · Branch principal: `v2/redesign` · Deploy: [padel-sg-omega.vercel.app](https://padel-sg-omega.vercel.app)

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript 6 |
| Estilos | Tailwind CSS 3 + shadcn/ui New York |
| Estado | Zustand 5 + TanStack Query 5 |
| Formularios | react-hook-form 7 + zod 3 |
| Backend / DB | Supabase (PostgreSQL, schema `padel`) |
| Auth | Supabase Auth (email/password) |
| Deploy | Vercel |
| Tests | Vitest 4 + @testing-library/react 16 |

---

## Funcionalidades

### Plan 1 — Auth + Foundation
- Registro de usuarios con flujo pendiente → aprobación admin
- Login con guard de rutas
- Cola de aprobación para admins (con notificación email via Resend)
- Navigation shell: sidebar colapsado (desktop) + bottom nav (mobile)

### Plan 2 — Torneos
- Wizard de creación de torneo (4 pasos: tipo, categorías, fixture, confirmar)
- Generación automática de fixture (grupos + eliminatoria)
- Inscripción de parejas + panel de aprobación para admins
- Carga de resultados con actualización de ELO individual (K=32)
- Vista de bracket/llaves por categoría

### Plan 3 — Ligas
- Dos formatos: Round Robin (tabla de posiciones viva) y Escalerilla (desafíos por posición)
- Wizard de creación de liga con selección de participantes
- Generación automática de partidos para round-robin
- Sistema de desafíos: jugadores pueden retar hasta 3 posiciones arriba (escalerilla)
- Standings calculados en tiempo real desde los partidos jugados

---

## Estructura de carpetas

```
padel-sg/
├── src/
│   ├── components/
│   │   ├── brand/          # BrandLogo
│   │   ├── layout/         # AppShell, Sidebar, TopBar, BottomNav
│   │   └── ui/             # shadcn/ui components
│   ├── features/
│   │   ├── auth/           # RegisterForm, LoginForm, PendingApproval, AuthGuard
│   │   ├── admin/          # PendingUsers (aprobación)
│   │   ├── torneos/        # TorneosList, TorneoDetalle, FixtureView, TorneoWizard/
│   │   └── ligas/          # LigasList, LigaDetalle, StandingsTable, LadderView, LigaWizard/
│   ├── hooks/              # useUser, useTemporada
│   ├── lib/
│   │   ├── fixture/        # engine.ts (Berger), elo.ts (K=32), types.ts
│   │   ├── ligas/          # standings.ts
│   │   ├── supabase.ts
│   │   └── types/          # database.types.ts
│   ├── stores/             # appStore (Zustand)
│   └── router.tsx          # React Router v6
├── supabase/
│   ├── functions/          # approve-user, reject-user (Edge Functions + Resend)
│   └── migrations/         # SQL migrations (schema padel)
├── docs/
│   └── superpowers/
│       ├── plans/          # Implementation plans (Plan 1-3)
│       └── specs/          # Design specs
└── stitch-designs/
    └── padel_sg/
        └── DESIGN.md       # Design system: navy/gold, Manrope/Inter
```

---

## Cómo correr en local

### Prerequisitos
- Node.js 18+
- npm
- Cuenta Supabase con proyecto activo

### Instalación

```bash
git clone <repo>
cd padel-sg
npm install
```

### Variables de entorno

Crear `.env.local`:
```
VITE_SUPABASE_URL=https://<tu-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### Base de datos

Aplicar las migraciones en orden en el SQL Editor de Supabase:
1. `supabase/migrations/20260326_001_initial_schema.sql`
2. `supabase/migrations/20260326_002_auth_trigger.sql`
3. `supabase/migrations/20260326_003_temporada_fn.sql`
4. `supabase/migrations/20260326_004_nivel_hijos.sql`
5. `supabase/migrations/20260327_005_torneos_wizard_config.sql`
6. `supabase/migrations/20260327_006_inscripciones_sorteo.sql`
7. `supabase/migrations/20260328_007_extras.sql`
8. `supabase/migrations/20260413_002_v2_schema.sql`
9. `supabase/migrations/20260414_003_torneos_config.sql`
10. `supabase/migrations/20260414_004_ligas_partidos.sql`

### Desarrollo

```bash
npm run dev        # servidor en http://localhost:5173
npm run test:run   # vitest (81 tests)
npm run typecheck  # tsc --noEmit
npm run build      # build de producción
```

---

## Deploy

El proyecto usa **Vercel** con integración de CLI.

```bash
vercel deploy --prod
```

O hacer push a la rama configurada (git integration).

### Edge Functions (Supabase)

Para las notificaciones por email (aprobación/rechazo de usuarios):

```bash
# Configurar secrets en Supabase dashboard:
# RESEND_API_KEY=re_...
# APP_URL=https://padel-sg-omega.vercel.app

npx supabase functions deploy approve-user reject-user
```

---

## Diseño

El sistema de diseño está documentado en [`stitch-designs/padel_sg/DESIGN.md`](stitch-designs/padel_sg/DESIGN.md).

**"The Athletic Editorial"** — Fusión de energía deportiva con sobriedad de club élite.

- **Paleta:** Deep Ink Navy `#0D1B2A` + Championship Gold `#F5C518` + Court Grey `#F0F4F8`
- **Tipografía:** Manrope (headlines) + Inter (body)
- **Principios:** No borders de 1px, sombras siempre navy-tinted, tonal layering

---

## Screenshots

> _Screenshots pendientes — la aplicación está en desarrollo activo._
>
> **Vistas principales:** Login · Panel Admin · Lista de Torneos · Wizard de Torneo · Vista de Fixture · Lista de Ligas · Tabla de Posiciones · Escalerilla

---

## Tests

```bash
npm run test:run
# 81 tests | 17 test files | Vitest 4
```

Cobertura: lógica pura de ELO, fixture engine (Berger rotation), standings calculator, componentes React con mocks de Supabase.

---

## Licencia

Uso interno — Pádel Saint George's. No open source.
