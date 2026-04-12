# Plan 1: Foundation + Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold completo con TypeScript + Tailwind + shadcn/ui, schema Supabase migrado, navigation shell con design tokens, flujo de registro/aprobación/login funcional y desplegado en Vercel.

**Architecture:** React 18 + Vite + TypeScript con feature modules bajo `src/features/`. Supabase Auth maneja sesión; el jugador se crea en `padel.jugadores` con `estado_cuenta='pendiente'` al registrarse. El superadmin aprueba desde el panel, un Edge Function envía el email de bienvenida. Route guards en React Router v6 protegen todas las rutas post-login.

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind CSS 3, shadcn/ui (New York style), Supabase (auth + db + edge functions), TanStack Query 5, Zustand 5, react-hook-form 7 + zod 3, Vitest + @testing-library/react, Vercel.

---

## File Map

```
src/
├── features/
│   ├── auth/
│   │   ├── RegisterForm.tsx          # Wizard 6 pasos (react-hook-form + zod)
│   │   ├── RegisterForm.test.tsx
│   │   ├── LoginForm.tsx
│   │   ├── LoginForm.test.tsx
│   │   ├── PendingApproval.tsx       # Pantalla post-registro
│   │   ├── AuthGuard.tsx             # Wrapper protección de rutas
│   │   ├── AuthGuard.test.tsx
│   │   └── schemas.ts                # Zod schemas del formulario
│   └── admin/
│       ├── PendingUsers.tsx          # Cola de aprobación
│       └── PendingUsers.test.tsx
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx              # Layout root: sidebar + topbar + outlet
│   │   ├── Sidebar.tsx               # Desktop sidebar colapsado/expandido
│   │   ├── Sidebar.test.tsx
│   │   ├── BottomNav.tsx             # Mobile bottom nav fijo
│   │   └── TopBar.tsx                # Season selector + notifs + user menu
│   └── brand/
│       ├── BrandLogo.tsx
│       └── BrandLogo.test.tsx
├── lib/
│   ├── supabase.ts                   # Supabase client tipado
│   └── queryClient.ts                # TanStack Query config
├── hooks/
│   ├── useUser.ts                    # Current jugador hook
│   └── useTemporada.ts               # Active season hook
├── stores/
│   └── appStore.ts                   # Zustand: temporadaId
├── test/
│   └── setup.ts                      # @testing-library/jest-dom setup
├── router.tsx                        # React Router v6 routes
├── App.tsx
└── main.tsx

supabase/
├── migrations/
│   └── 20260413_002_v2_schema.sql    # Alter + nuevas tablas
└── functions/
    ├── approve-user/index.ts         # Edge Function: email aprobación
    └── reject-user/index.ts          # Edge Function: email rechazo
```

---

## Task 1: TypeScript + test toolchain

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`, `tsconfig.node.json`
- Modify: `vite.config.js` → `vite.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Instalar dependencias**

```bash
npm install -D typescript @types/react @types/react-dom @vitejs/plugin-react
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Crear `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Crear `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Reemplazar `vite.config.js` con `vite.config.ts`**

Eliminar `vite.config.js` y crear `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 5: Crear `src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Agregar scripts a `package.json`**

Agregar en la sección `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 7: Verificar que el toolchain funciona**

Crear `src/test/smoke.test.ts` temporal:
```typescript
test('toolchain works', () => {
  expect(1 + 1).toBe(2)
})
```

Ejecutar:
```bash
npm run test:run
```
Expected: `1 passed`

Eliminar `src/test/smoke.test.ts` después.

- [ ] **Step 8: Commit**

```bash
git add tsconfig.json tsconfig.node.json vite.config.ts package.json src/test/setup.ts
git rm vite.config.js
git commit -m "chore: add TypeScript + Vitest toolchain"
```

---

## Task 2: Tailwind design tokens + shadcn/ui

**Files:**
- Modify: `tailwind.config.js` → `tailwind.config.ts`
- Create: `src/index.css` (variables CSS shadcn)
- Modify: `src/main.tsx`

- [ ] **Step 1: Instalar dependencias**

```bash
npm install -D @tailwindcss/forms
npm install class-variance-authority clsx tailwind-merge lucide-react
```

- [ ] **Step 2: Convertir `tailwind.config.js` a `tailwind.config.ts` con tokens padel-sg**

```typescript
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0D1B2A',
        'navy-mid': '#1A2E45',
        gold: '#F5C518',
        'gold-dim': '#F0C110',
        surface: '#F0F4F8',
        'surface-high': '#E4E9ED',
        slate: '#4A6580',
        muted: '#8FA8C8',
        victory: '#006747',
        defeat: '#BA1A1A',
        'warning-bg': '#FFF9E6',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 12px rgba(13,27,42,0.06)',
        'card-hover': '0 12px 32px rgba(13,27,42,0.10)',
        modal: '0 20px 40px rgba(13,27,42,0.14)',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config
```

- [ ] **Step 3: Inicializar shadcn/ui**

```bash
npx shadcn@latest init
```

Cuando pregunte:
- Style: **New York**
- Base color: **Neutral**
- CSS variables: **Yes**

- [ ] **Step 4: Instalar componentes shadcn**

```bash
npx shadcn@latest add button input label form select card badge avatar dialog dropdown-menu tabs scroll-area separator
```

- [ ] **Step 5: Agregar fuentes en `index.html`**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@700;800;900&display=swap" rel="stylesheet">
```

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts src/index.css components.json src/components/ui/ index.html package.json
git rm tailwind.config.js
git commit -m "feat: add design tokens + shadcn/ui (New York style)"
```

---

## Task 3: Supabase schema migration

**Files:**
- Create: `supabase/migrations/20260413_002_v2_schema.sql`

- [ ] **Step 1: Crear el archivo de migración**

```sql
-- Migration: v2 schema changes for padel-sg redesign

-- 1. Drop obsolete columns from jugadores
ALTER TABLE padel.jugadores
  DROP COLUMN IF EXISTS es_admin,
  DROP COLUMN IF EXISTS nivel,
  DROP COLUMN IF EXISTS anio_curso_hijo;

-- 2. Add new columns to jugadores
ALTER TABLE padel.jugadores
  ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'jugador'
    CHECK (rol IN ('superadmin', 'admin_torneo', 'jugador')),
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS gradualidad text DEFAULT 'normal'
    CHECK (gradualidad IN ('-', 'normal', '+')),
  ADD COLUMN IF NOT EXISTS sexo text CHECK (sexo IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS mixto text CHECK (mixto IN ('si', 'no', 'a_veces')),
  ADD COLUMN IF NOT EXISTS hijos_sg jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS frecuencia_semanal text,
  ADD COLUMN IF NOT EXISTS comentarios_registro text;

-- 3. Migrate intereses (text) → intereses_actividades (jsonb)
ALTER TABLE padel.jugadores
  RENAME COLUMN intereses TO intereses_actividades;
ALTER TABLE padel.jugadores
  ALTER COLUMN intereses_actividades TYPE jsonb
  USING '[]'::jsonb;

-- 4. Update estado_cuenta constraint
ALTER TABLE padel.jugadores
  DROP CONSTRAINT IF EXISTS jugadores_estado_cuenta_check;
ALTER TABLE padel.jugadores
  ADD CONSTRAINT jugadores_estado_cuenta_check
    CHECK (estado_cuenta IN ('pendiente', 'activo', 'suspendido', 'pendiente_baja', 'inactivo'));

-- 5. Add tipo + colegio_rival to torneos
ALTER TABLE padel.torneos
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'interno'
    CHECK (tipo IN ('interno', 'vs_colegio', 'externo')),
  ADD COLUMN IF NOT EXISTS colegio_rival text;

-- 6. Ligas
CREATE TABLE IF NOT EXISTS padel.ligas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text NOT NULL,
  formato      text NOT NULL CHECK (formato IN ('round_robin', 'escalerilla')),
  temporada_id uuid REFERENCES padel.temporadas(id),
  estado       text NOT NULL DEFAULT 'borrador'
               CHECK (estado IN ('borrador', 'activa', 'finalizada')),
  fecha_inicio date,
  fecha_fin    date,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS padel.liga_participantes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id    uuid NOT NULL REFERENCES padel.ligas(id) ON DELETE CASCADE,
  jugador_id uuid NOT NULL REFERENCES padel.jugadores(id),
  posicion   integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE (liga_id, jugador_id)
);

CREATE TABLE IF NOT EXISTS padel.liga_desafios (
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

-- 7. Pagos inscripción
CREATE TABLE IF NOT EXISTS padel.pagos_inscripcion (
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

-- 8. Movimientos financieros
CREATE TABLE IF NOT EXISTS padel.movimientos_financieros (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  categoria    text,
  monto        numeric NOT NULL,
  descripcion  text NOT NULL,
  fecha        date NOT NULL,
  temporada_id uuid REFERENCES padel.temporadas(id),
  torneo_id    uuid REFERENCES padel.torneos(id),
  creado_por   uuid REFERENCES padel.jugadores(id),
  created_at   timestamptz DEFAULT now()
);

-- 9. Validaciones amistosos
CREATE TABLE IF NOT EXISTS padel.validaciones_partido (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id   uuid NOT NULL REFERENCES padel.partidos(id) ON DELETE CASCADE,
  validado_por uuid REFERENCES padel.jugadores(id),
  estado       text NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente', 'confirmado', 'refutado', 'auto_aprobado')),
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- 10. Tokens ICS personales
CREATE TABLE IF NOT EXISTS padel.ics_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id uuid NOT NULL REFERENCES padel.jugadores(id) ON DELETE CASCADE,
  token      uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- 11. Anuncios
CREATE TABLE IF NOT EXISTS padel.anuncios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     text NOT NULL,
  cuerpo     text NOT NULL,
  activo     boolean NOT NULL DEFAULT true,
  creado_por uuid REFERENCES padel.jugadores(id),
  created_at timestamptz DEFAULT now()
);

-- 12. Partidas abiertas (tablero amistosos)
CREATE TABLE IF NOT EXISTS padel.partidas_abiertas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id    uuid NOT NULL REFERENCES padel.jugadores(id),
  compañero_id  uuid REFERENCES padel.jugadores(id),
  fecha         timestamptz NOT NULL,
  cancha        text,
  categoria     text,
  admite_mixto  boolean DEFAULT false,
  rol_buscado   text NOT NULL CHECK (rol_buscado IN ('busco_compañero', 'busco_rivales', 'abierto')),
  estado        text NOT NULL DEFAULT 'abierta'
                CHECK (estado IN ('abierta', 'confirmada', 'jugada', 'cancelada')),
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS padel.partidas_abiertas_jugadores (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id       uuid NOT NULL REFERENCES padel.partidas_abiertas(id) ON DELETE CASCADE,
  jugador_id       uuid NOT NULL REFERENCES padel.jugadores(id),
  equipo           text NOT NULL CHECK (equipo IN ('local', 'rival')),
  created_at       timestamptz DEFAULT now(),
  UNIQUE (partida_id, jugador_id)
);

-- RLS: habilitar en nuevas tablas
ALTER TABLE padel.ligas ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.liga_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.liga_desafios ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.pagos_inscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.movimientos_financieros ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.validaciones_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.ics_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.anuncios ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.partidas_abiertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.partidas_abiertas_jugadores ENABLE ROW LEVEL SECURITY;

-- RLS policies básicas
CREATE POLICY "Jugadores activos leen anuncios" ON padel.anuncios
  FOR SELECT USING (padel.cuenta_activa());

CREATE POLICY "Superadmin gestiona anuncios" ON padel.anuncios
  FOR ALL USING (padel.es_admin());

CREATE POLICY "Jugadores leen ligas" ON padel.ligas
  FOR SELECT USING (padel.cuenta_activa());

CREATE POLICY "Admin gestiona ligas" ON padel.ligas
  FOR ALL USING (padel.es_admin());

CREATE POLICY "Jugadores leen partidas abiertas" ON padel.partidas_abiertas
  FOR SELECT USING (padel.cuenta_activa());

CREATE POLICY "Jugadores crean partidas abiertas" ON padel.partidas_abiertas
  FOR INSERT WITH CHECK (padel.cuenta_activa() AND creador_id = (
    SELECT id FROM padel.jugadores WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Jugador propio actualiza su partida" ON padel.partidas_abiertas
  FOR UPDATE USING (creador_id = (
    SELECT id FROM padel.jugadores WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "ICS token propio" ON padel.ics_tokens
  FOR ALL USING (jugador_id = (
    SELECT id FROM padel.jugadores WHERE auth_user_id = auth.uid()
  ));
```

- [ ] **Step 2: Aplicar migración en Supabase**

```bash
npx supabase db push
```

Expected: migración aplicada sin errores.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260413_002_v2_schema.sql
git commit -m "feat: apply v2 schema migration (jugadores, torneos, 10 new tables)"
```

---

## Task 4: Supabase client + tipos TypeScript

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/queryClient.ts`
- Create: `src/lib/types/database.types.ts` (generado)
- Modify: `.env.example`

- [ ] **Step 1: Instalar dependencias**

```bash
npm install @tanstack/react-query@5 zustand@5
```

- [ ] **Step 2: Actualizar `.env.example`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Crear `.env.local` con los valores reales (no commitear).

- [ ] **Step 3: Generar tipos TypeScript desde Supabase**

```bash
npx supabase gen types typescript --linked --schema padel > src/lib/types/database.types.ts
```

- [ ] **Step 4: Crear `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export type Jugador = Database['padel']['Tables']['jugadores']['Row']
export type Temporada = Database['padel']['Tables']['temporadas']['Row']
```

- [ ] **Step 5: Crear `src/lib/queryClient.ts`**

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
})
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/ .env.example
git commit -m "feat: add Supabase client + TanStack Query config"
```

---

## Task 5: App store + Router + main.tsx

**Files:**
- Create: `src/stores/appStore.ts`
- Create: `src/hooks/useUser.ts`
- Create: `src/hooks/useTemporada.ts`
- Create: `src/router.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Crear `src/stores/appStore.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  temporadaId: string | null
  setTemporadaId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      temporadaId: null,
      setTemporadaId: (id) => set({ temporadaId: id }),
    }),
    { name: 'padel-sg-app' },
  ),
)
```

- [ ] **Step 2: Crear `src/hooks/useUser.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase, type Jugador } from '@/lib/supabase'

export function useUser() {
  return useQuery<Jugador | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()
      return data ?? null
    },
  })
}
```

- [ ] **Step 3: Crear `src/hooks/useTemporada.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase, type Temporada } from '@/lib/supabase'

export function useTemporadas() {
  return useQuery<Temporada[]>({
    queryKey: ['temporadas'],
    queryFn: async () => {
      const { data } = await supabase
        .schema('padel')
        .from('temporadas')
        .select('*')
        .order('fecha_inicio', { ascending: false })
      return data ?? []
    },
  })
}
```

- [ ] **Step 4: Crear `src/router.tsx`**

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginForm } from '@/features/auth/LoginForm'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { PendingApproval } from '@/features/auth/PendingApproval'
import { PendingUsers } from '@/features/admin/PendingUsers'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/registro',
    element: <RegisterForm />,
  },
  {
    path: '/pendiente',
    element: <PendingApproval />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <div className="p-6 font-manrope text-navy">Dashboard — próximamente</div> },
      { path: 'admin/usuarios', element: <PendingUsers /> },
    ],
  },
])
```

- [ ] **Step 5: Actualizar `src/main.tsx`**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 6: Test del store**

Crear `src/stores/appStore.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from './appStore'

test('setTemporadaId updates store', () => {
  const { result } = renderHook(() => useAppStore())
  act(() => result.current.setTemporadaId('season-123'))
  expect(result.current.temporadaId).toBe('season-123')
})
```

Ejecutar:
```bash
npm run test:run src/stores/appStore.test.ts
```
Expected: 1 passed

- [ ] **Step 7: Commit**

```bash
git add src/stores/ src/hooks/ src/router.tsx src/main.tsx
git commit -m "feat: add Zustand store, hooks, React Router v6 setup"
```

---

## Task 6: BrandLogo + AppShell + Sidebar + BottomNav + TopBar

**Files:**
- Create: `src/components/brand/BrandLogo.tsx`
- Create: `src/components/brand/BrandLogo.test.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Sidebar.test.tsx`
- Create: `src/components/layout/BottomNav.tsx`
- Create: `src/components/layout/TopBar.tsx`

- [ ] **Step 1: Test BrandLogo**

Crear `src/components/brand/BrandLogo.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { BrandLogo } from './BrandLogo'

test('renders logo with accessible label', () => {
  render(<BrandLogo />)
  expect(screen.getByRole('img', { name: /pádel sg/i })).toBeInTheDocument()
})

test('renders compact variant', () => {
  render(<BrandLogo variant="compact" />)
  expect(screen.getByText('P·SG')).toBeInTheDocument()
})
```

Ejecutar → FAIL esperado.

- [ ] **Step 2: Implementar `src/components/brand/BrandLogo.tsx`**

```typescript
interface BrandLogoProps {
  variant?: 'full' | 'compact'
  className?: string
}

export function BrandLogo({ variant = 'full', className }: BrandLogoProps) {
  if (variant === 'compact') {
    return (
      <div
        role="img"
        aria-label="Pádel SG"
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-gold font-manrope text-xs font-black text-navy ${className}`}
      >
        P·SG
      </div>
    )
  }
  return (
    <div
      role="img"
      aria-label="Pádel SG"
      className={`flex items-center gap-2 ${className}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-manrope text-xs font-black text-navy">
        P·SG
      </div>
      <span className="font-manrope text-sm font-bold text-gold">Pádel SG</span>
    </div>
  )
}
```

- [ ] **Step 3: Ejecutar test BrandLogo → PASS**

```bash
npm run test:run src/components/brand/BrandLogo.test.tsx
```
Expected: 2 passed

- [ ] **Step 4: Test Sidebar**

Crear `src/components/layout/Sidebar.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'

const wrap = (ui: React.ReactNode) =>
  render(<MemoryRouter initialEntries={['/dashboard']}>{ui}</MemoryRouter>)

test('renders all nav items', () => {
  wrap(<Sidebar />)
  expect(screen.getByLabelText('Dashboard')).toBeInTheDocument()
  expect(screen.getByLabelText('Torneos')).toBeInTheDocument()
  expect(screen.getByLabelText('Calendario')).toBeInTheDocument()
})
```

Ejecutar → FAIL esperado.

- [ ] **Step 5: Implementar `src/components/layout/Sidebar.tsx`**

```typescript
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Trophy, Grid3x3,
  Layers, Handshake, Calendar, Wallet, Settings,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jugadores', icon: Users, label: 'Jugadores' },
  { to: '/rankings', icon: Trophy, label: 'Rankings' },
  { to: '/torneos', icon: Grid3x3, label: 'Torneos' },
  { to: '/ligas', icon: Layers, label: 'Ligas' },
  { to: '/amistosos', icon: Handshake, label: 'Amistosos' },
  { to: '/calendario', icon: Calendar, label: 'Calendario' },
  { to: '/finanzas', icon: Wallet, label: 'Finanzas' },
]

export function Sidebar() {
  return (
    <nav className="group hidden w-12 flex-col bg-navy transition-all duration-200 hover:w-56 md:flex">
      <div className="flex h-14 items-center justify-center px-1.5 group-hover:justify-start group-hover:px-4">
        <BrandLogo variant="compact" className="shrink-0" />
        <span className="ml-2 hidden font-manrope text-sm font-bold text-gold group-hover:block">
          Pádel SG
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-1 px-1.5 py-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                `flex h-9 items-center rounded-md px-2 transition-colors ${
                  isActive
                    ? 'bg-gold text-navy'
                    : 'text-muted hover:bg-navy-mid hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="ml-3 hidden whitespace-nowrap font-inter text-sm font-medium group-hover:block">
                {label}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="border-t border-navy-mid px-1.5 py-3">
        <NavLink
          to="/admin/usuarios"
          aria-label="Admin"
          className={({ isActive }) =>
            `flex h-9 items-center rounded-md px-2 transition-colors ${
              isActive ? 'bg-gold text-navy' : 'text-muted hover:bg-navy-mid hover:text-white'
            }`
          }
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="ml-3 hidden font-inter text-sm font-medium group-hover:block">Admin</span>
        </NavLink>
      </div>
    </nav>
  )
}
```

- [ ] **Step 6: Ejecutar test Sidebar → PASS**

```bash
npm run test:run src/components/layout/Sidebar.test.tsx
```
Expected: 1 passed

- [ ] **Step 7: Implementar `src/components/layout/BottomNav.tsx`**

```typescript
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Grid3x3, Handshake, Calendar, MoreHorizontal } from 'lucide-react'

const BOTTOM_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/jugadores', icon: Users, label: 'Jugadores' },
  { to: '/torneos', icon: Grid3x3, label: 'Torneos' },
  { to: '/amistosos', icon: Handshake, label: 'Amistosos' },
  { to: '/calendario', icon: Calendar, label: 'Calendario' },
  { to: '/mas', icon: MoreHorizontal, label: 'Más' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-surface-high bg-white pb-safe md:hidden">
      {BOTTOM_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 font-inter text-[10px] transition-colors ${
              isActive ? 'text-gold' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              {isActive && <span className="mt-0.5 h-1 w-1 rounded-full bg-gold" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 8: Implementar `src/components/layout/TopBar.tsx`**

```typescript
import { Bell, ChevronDown } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useAppStore } from '@/stores/appStore'
import { useTemporadas } from '@/hooks/useTemporada'
import { Button } from '@/components/ui/button'

export function TopBar() {
  const { data: user } = useUser()
  const { temporadaId, setTemporadaId } = useAppStore()
  const { data: temporadas = [] } = useTemporadas()

  const initials = user?.nombre
    ? user.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface bg-white px-4">
      <div />
      <select
        value={temporadaId ?? ''}
        onChange={(e) => setTemporadaId(e.target.value || null)}
        className="rounded-full border border-navy/20 bg-transparent px-3 py-1 font-inter text-sm font-medium text-navy focus:outline-none"
      >
        <option value="">Temporada</option>
        {temporadas.map((t) => (
          <option key={t.id} value={t.id}>{t.nombre}</option>
        ))}
      </select>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-slate">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-manrope text-xs font-bold text-gold">
            {initials}
          </div>
          <span className="hidden font-inter text-sm text-slate lg:block">
            {user?.apodo ?? user?.nombre ?? ''}
          </span>
          <ChevronDown className="h-4 w-4 text-muted" />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 9: Implementar `src/components/layout/AppShell.tsx`**

```typescript
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add src/components/
git commit -m "feat: add AppShell, Sidebar, BottomNav, TopBar, BrandLogo"
```

---

## Task 7: Auth — formulario de registro (6 pasos)

**Files:**
- Create: `src/features/auth/schemas.ts`
- Create: `src/features/auth/RegisterForm.tsx`
- Create: `src/features/auth/RegisterForm.test.tsx`

- [ ] **Step 1: Instalar dependencias**

```bash
npm install react-hook-form@7 zod@3 @hookform/resolvers
```

- [ ] **Step 2: Crear `src/features/auth/schemas.ts`**

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  // Paso 1: Datos personales
  nombre: z.string().min(2, 'Ingresa tu nombre completo'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  apodo: z.string().optional(),
  sexo: z.enum(['M', 'F'], { required_error: 'Selecciona tu sexo' }),

  // Paso 2: Vinculación SG
  hijos_sg: z.array(z.object({
    curso_ingreso: z.string(),
    anio: z.number(),
  })).optional(),
  anio_egreso: z.number().optional(),

  // Paso 3: Nivel de juego
  categoria: z.string().min(1, 'Selecciona tu categoría'),
  gradualidad: z.enum(['-', 'normal', '+']).default('normal'),
  lado: z.enum(['drive', 'reves', 'ambos']).optional(),
  mixto: z.enum(['si', 'no', 'a_veces']).optional(),

  // Paso 4: Participación
  frecuencia_semanal: z.enum(['menos_1', '1', '2', '3_mas']),
  intereses_actividades: z.array(z.string()).optional(),

  // Paso 5: Comentarios
  comentarios_registro: z.string().optional(),

  // Paso 6: Contraseña
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirm'],
})

export type RegisterFormData = z.infer<typeof registerSchema>
```

- [ ] **Step 3: Test RegisterForm**

Crear `src/features/auth/RegisterForm.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { QueryClient } from '@tanstack/react-query'
import { RegisterForm } from './RegisterForm'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    schema: () => ({
      from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }),
    }),
  },
}))

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )

test('shows step 1 fields initially', () => {
  wrap(<RegisterForm />)
  expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument()
})

test('shows validation error when name is empty', async () => {
  wrap(<RegisterForm />)
  await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
  expect(await screen.findByText(/ingresa tu nombre/i)).toBeInTheDocument()
})
```

Ejecutar → FAIL esperado.

- [ ] **Step 4: Implementar `src/features/auth/RegisterForm.tsx`**

```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { registerSchema, type RegisterFormData } from './schemas'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const STEPS = ['Datos personales', 'Vinculación SG', 'Nivel de juego', 'Participación', 'Comentarios', 'Acceso']

const CURSOS = ['PK', 'KK', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°', '12°', 'Egresado']
const CATEGORIAS_H = ['5a', '4a', '3a', 'Open']
const CATEGORIAS_M = ['D', 'C', 'B', 'Open']
const ACTIVIDADES = [
  { value: 'interescolares', label: 'Torneos interescolares' },
  { value: 'torneos_internos', label: 'Torneos internos' },
  { value: 'amistosos', label: 'Amistosos intercolegiales' },
  { value: 'entrenamientos', label: 'Entrenamientos / clases' },
  { value: 'partidos_semana', label: 'Partidos de semana' },
  { value: 'solo_convenio', label: 'Solo usar el convenio' },
]

export function RegisterForm() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gradualidad: 'normal',
      hijos_sg: [],
      intereses_actividades: [],
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = form
  const sexo = watch('sexo')
  const hijossg = watch('hijos_sg') ?? []

  const STEP_FIELDS: (keyof RegisterFormData)[][] = [
    ['nombre', 'email', 'sexo'],
    [],
    ['categoria'],
    ['frecuencia_semanal'],
    [],
    ['password', 'password_confirm'],
  ]

  const nextStep = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.schema('padel').from('jugadores').insert({
        auth_user_id: user.id,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono ?? null,
        apodo: data.apodo ?? null,
        sexo: data.sexo,
        categoria: data.categoria,
        gradualidad: data.gradualidad,
        lado: data.lado ?? null,
        mixto: data.mixto ?? null,
        hijos_sg: data.hijos_sg ?? [],
        frecuencia_semanal: data.frecuencia_semanal,
        intereses_actividades: data.intereses_actividades ?? [],
        comentarios_registro: data.comentarios_registro ?? null,
        estado_cuenta: 'pendiente',
        rol: 'jugador',
      })
    }
    navigate('/pendiente')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <BrandLogo />
          <span className="font-inter text-xs text-muted">Paso {step + 1} de {STEPS.length}</span>
        </div>

        <div className="mb-2 h-1.5 rounded-full bg-surface-high">
          <div
            className="h-1.5 rounded-full bg-gold transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <h2 className="mb-6 mt-4 font-manrope text-lg font-bold text-navy">{STEPS[step]}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Paso 0: Datos personales */}
          {step === 0 && (
            <>
              <div>
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input id="nombre" {...register('nombre')} className="mt-1" />
                {errors.nombre && <p className="mt-1 font-inter text-xs text-defeat">{errors.nombre.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register('email')} className="mt-1" />
                {errors.email && <p className="mt-1 font-inter text-xs text-defeat">{errors.email.message}</p>}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" {...register('telefono')} placeholder="+56 9 XXXX XXXX" className="mt-1" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="apodo">Apodo</Label>
                  <Input id="apodo" {...register('apodo')} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Sexo *</Label>
                <div className="mt-2 flex gap-3">
                  {[{ v: 'M', l: 'Masculino' }, { v: 'F', l: 'Femenino' }].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValue('sexo', v as 'M' | 'F')}
                      className={`flex-1 rounded-md border py-2 font-inter text-sm font-medium transition-colors ${
                        sexo === v ? 'border-navy bg-navy text-gold' : 'border-surface-high text-slate'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {errors.sexo && <p className="mt-1 font-inter text-xs text-defeat">{errors.sexo.message}</p>}
              </div>
            </>
          )}

          {/* Paso 1: Vinculación SG */}
          {step === 1 && (
            <div>
              <Label className="mb-2 block">Cursos de tus hijos en Saint George's</Label>
              <p className="mb-3 font-inter text-xs text-slate">Selecciona todos los que apliquen</p>
              <div className="flex flex-wrap gap-2">
                {CURSOS.map((curso) => {
                  const selected = hijossg.some((h) => h.curso_ingreso === curso)
                  return (
                    <button
                      key={curso}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setValue('hijos_sg', hijossg.filter((h) => h.curso_ingreso !== curso))
                        } else {
                          setValue('hijos_sg', [...hijossg, { curso_ingreso: curso, anio: new Date().getFullYear() }])
                        }
                      }}
                      className={`rounded-md px-3 py-1.5 font-inter text-xs font-semibold transition-colors ${
                        selected ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {curso}
                    </button>
                  )
                })}
              </div>
              {hijossg.some((h) => h.curso_ingreso === 'Egresado') && (
                <div className="mt-3">
                  <Label htmlFor="anio_egreso">Año de egreso del último hijo</Label>
                  <Input
                    id="anio_egreso"
                    type="number"
                    placeholder="ej: 2022"
                    {...register('anio_egreso', { valueAsNumber: true })}
                    className="mt-1 w-32"
                  />
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Nivel de juego */}
          {step === 2 && (
            <>
              <div>
                <Label className="mb-2 block">Categoría *</Label>
                <div className="flex flex-wrap gap-2">
                  {(sexo === 'F' ? CATEGORIAS_M : CATEGORIAS_H).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setValue('categoria', cat)}
                      className={`rounded-md px-3 py-1.5 font-inter text-sm font-semibold transition-colors ${
                        watch('categoria') === cat ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {errors.categoria && <p className="mt-1 font-inter text-xs text-defeat">{errors.categoria.message}</p>}
              </div>
              <div>
                <Label className="mb-2 block">Gradualidad</Label>
                <div className="flex gap-2">
                  {(['-', 'normal', '+'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setValue('gradualidad', g)}
                      className={`flex-1 rounded-md py-2 font-inter text-sm font-medium transition-colors ${
                        watch('gradualidad') === g ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {g === '-' ? 'Recién llegando (−)' : g === '+' ? 'Subiendo (+)' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Lado preferido</Label>
                <div className="flex gap-2">
                  {(['drive', 'reves', 'ambos'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setValue('lado', l)}
                      className={`flex-1 rounded-md py-2 font-inter text-sm capitalize transition-colors ${
                        watch('lado') === l ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">¿Juegas mixto?</Label>
                <div className="flex gap-2">
                  {[{ v: 'si', l: 'Sí' }, { v: 'no', l: 'No' }, { v: 'a_veces', l: 'A veces' }].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValue('mixto', v as 'si' | 'no' | 'a_veces')}
                      className={`flex-1 rounded-md py-2 font-inter text-sm transition-colors ${
                        watch('mixto') === v ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Paso 3: Participación */}
          {step === 3 && (
            <>
              <div>
                <Label className="mb-2 block">Frecuencia semanal *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'menos_1', l: 'Menos de 1 vez' },
                    { v: '1', l: '1 vez' },
                    { v: '2', l: '2 veces' },
                    { v: '3_mas', l: '3 o más veces' },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValue('frecuencia_semanal', v as any)}
                      className={`rounded-md py-2.5 font-inter text-sm transition-colors ${
                        watch('frecuencia_semanal') === v ? 'bg-navy text-gold' : 'bg-surface text-slate'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {errors.frecuencia_semanal && <p className="mt-1 font-inter text-xs text-defeat">{errors.frecuencia_semanal.message}</p>}
              </div>
              <div>
                <Label className="mb-2 block">Actividades de interés</Label>
                <div className="space-y-2">
                  {ACTIVIDADES.map(({ value, label }) => {
                    const selected = (watch('intereses_actividades') ?? []).includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          const curr = watch('intereses_actividades') ?? []
                          setValue('intereses_actividades', selected ? curr.filter((a) => a !== value) : [...curr, value])
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 font-inter text-sm transition-colors ${
                          selected ? 'bg-navy/10 text-navy' : 'bg-surface text-slate'
                        }`}
                      >
                        <span className={`h-4 w-4 rounded border-2 ${selected ? 'border-navy bg-navy' : 'border-muted'}`} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Paso 4: Comentarios */}
          {step === 4 && (
            <div>
              <Label htmlFor="comentarios">Comentarios adicionales</Label>
              <p className="mb-2 font-inter text-xs text-slate">Horarios preferidos, si buscas pareja, etc.</p>
              <textarea
                id="comentarios"
                {...register('comentarios_registro')}
                rows={4}
                className="w-full rounded-md bg-surface px-3 py-2 font-inter text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                placeholder="Ej: Juego los martes y jueves tarde..."
              />
            </div>
          )}

          {/* Paso 5: Contraseña */}
          {step === 5 && (
            <>
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input id="password" type="password" {...register('password')} className="mt-1" />
                {errors.password && <p className="mt-1 font-inter text-xs text-defeat">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="password_confirm">Confirmar contraseña *</Label>
                <Input id="password_confirm" type="password" {...register('password_confirm')} className="mt-1" />
                {errors.password_confirm && <p className="mt-1 font-inter text-xs text-defeat">{errors.password_confirm.message}</p>}
              </div>
              {error && (
                <div className="rounded-md bg-defeat/10 p-3 font-inter text-sm text-defeat">{error}</div>
              )}
              <div className="rounded-md border-l-2 border-gold bg-warning-bg p-3 font-inter text-xs text-slate">
                Tu solicitud será revisada por el administrador. Recibirás un email cuando tu cuenta sea aprobada.
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            {step > 0 && (
              <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Atrás
              </Button>
            )}
            <div className="ml-auto">
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep} className="bg-gold text-navy hover:bg-gold-dim">
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="bg-gold text-navy hover:bg-gold-dim">
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </Button>
              )}
            </div>
          </div>
        </form>

        <p className="mt-4 text-center font-inter text-xs text-muted">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-navy underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Ejecutar tests RegisterForm → PASS**

```bash
npm run test:run src/features/auth/RegisterForm.test.tsx
```
Expected: 2 passed

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/
git commit -m "feat: add multi-step registration form (6 steps, zod validation)"
```

---

## Task 8: Auth — Login + PendingApproval

**Files:**
- Create: `src/features/auth/LoginForm.tsx`
- Create: `src/features/auth/LoginForm.test.tsx`
- Create: `src/features/auth/PendingApproval.tsx`

- [ ] **Step 1: Test LoginForm**

Crear `src/features/auth/LoginForm.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { LoginForm } from './LoginForm'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      }),
    },
  },
}))

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )

test('shows email and password fields', () => {
  wrap(<LoginForm />)
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
})

test('shows error on failed login', async () => {
  wrap(<LoginForm />)
  await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com')
  await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrongpass')
  await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
})
```

Ejecutar → FAIL esperado.

- [ ] **Step 2: Implementar `src/features/auth/LoginForm.tsx`**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: jugador } = await supabase
      .schema('padel')
      .from('jugadores')
      .select('estado_cuenta')
      .eq('auth_user_id', user.id)
      .single()
    if (jugador?.estado_cuenta === 'pendiente') {
      navigate('/pendiente')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-card">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>
        <h1 className="mb-6 font-manrope text-xl font-bold text-navy">Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          {error && (
            <div className="rounded-md bg-defeat/10 p-3 font-inter text-sm text-defeat">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full bg-gold text-navy hover:bg-gold-dim">
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>
        <p className="mt-4 text-center font-inter text-xs text-muted">
          ¿No tienes cuenta?{' '}
          <a href="/registro" className="text-navy underline">Solicitar acceso</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implementar `src/features/auth/PendingApproval.tsx`**

```typescript
import { BrandLogo } from '@/components/brand/BrandLogo'

export function PendingApproval() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-card">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>
        <div className="mb-4 text-4xl">🎾</div>
        <h1 className="mb-2 font-manrope text-xl font-bold text-navy">¡Solicitud recibida!</h1>
        <p className="mb-6 font-inter text-sm text-slate">
          Tu solicitud de acceso está siendo revisada. Recibirás un email cuando tu cuenta sea aprobada por el administrador.
        </p>
        <div className="rounded-md border-l-2 border-gold bg-warning-bg p-3 font-inter text-xs text-slate">
          Si tienes preguntas, contacta al administrador de la rama.
        </div>
        <a href="/login" className="mt-4 block font-inter text-xs text-muted underline">
          Volver al inicio
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar tests LoginForm → PASS**

```bash
npm run test:run src/features/auth/LoginForm.test.tsx
```
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/LoginForm.tsx src/features/auth/LoginForm.test.tsx src/features/auth/PendingApproval.tsx
git commit -m "feat: add login form + pending approval screen"
```

---

## Task 9: AuthGuard (protección de rutas)

**Files:**
- Create: `src/features/auth/AuthGuard.tsx`
- Create: `src/features/auth/AuthGuard.test.tsx`

- [ ] **Step 1: Test AuthGuard**

Crear `src/features/auth/AuthGuard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { AuthGuard } from './AuthGuard'

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}))

import { useUser } from '@/hooks/useUser'

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/dashboard" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

test('redirects to /login when not authenticated', () => {
  vi.mocked(useUser).mockReturnValue({ data: null, isLoading: false } as any)
  wrap(<AuthGuard><div>Protected</div></AuthGuard>)
  expect(screen.getByText('Login page')).toBeInTheDocument()
})

test('renders children when authenticated and active', () => {
  vi.mocked(useUser).mockReturnValue({
    data: { estado_cuenta: 'activo' },
    isLoading: false,
  } as any)
  wrap(<AuthGuard><div>Protected</div></AuthGuard>)
  expect(screen.getByText('Protected')).toBeInTheDocument()
})
```

Ejecutar → FAIL esperado.

- [ ] **Step 2: Implementar `src/features/auth/AuthGuard.tsx`**

```typescript
import { Navigate } from 'react-router-dom'
import { useUser } from '@/hooks/useUser'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: user, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.estado_cuenta === 'pendiente') return <Navigate to="/pendiente" replace />
  if (user.estado_cuenta === 'suspendido' || user.estado_cuenta === 'inactivo') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 3: Ejecutar tests → PASS**

```bash
npm run test:run src/features/auth/AuthGuard.test.tsx
```
Expected: 2 passed

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/AuthGuard.tsx src/features/auth/AuthGuard.test.tsx
git commit -m "feat: add AuthGuard route protection"
```

---

## Task 10: Admin — cola de aprobación de usuarios

**Files:**
- Create: `src/features/admin/PendingUsers.tsx`
- Create: `src/features/admin/PendingUsers.test.tsx`
- Create: `supabase/functions/approve-user/index.ts`
- Create: `supabase/functions/reject-user/index.ts`

- [ ] **Step 1: Test PendingUsers**

Crear `src/features/admin/PendingUsers.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { PendingUsers } from './PendingUsers'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'j1', nombre: 'María González', email: 'mg@test.com', categoria: 'C', sexo: 'F', created_at: '2026-04-12T10:00:00Z' }],
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>)

test('shows pending user name', async () => {
  wrap(<PendingUsers />)
  expect(await screen.findByText('María González')).toBeInTheDocument()
})

test('shows approve and reject buttons', async () => {
  wrap(<PendingUsers />)
  expect(await screen.findByRole('button', { name: /aprobar/i })).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: /rechazar/i })).toBeInTheDocument()
})
```

Ejecutar → FAIL esperado.

- [ ] **Step 2: Implementar `src/features/admin/PendingUsers.tsx`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Jugador } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function PendingUsers() {
  const qc = useQueryClient()

  const { data: pending = [], isLoading } = useQuery<Jugador[]>({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('*')
        .eq('estado_cuenta', 'pendiente')
      return data ?? []
    },
  })

  const approve = useMutation({
    mutationFn: async (jugadorId: string) => {
      await supabase
        .schema('padel')
        .from('jugadores')
        .update({ estado_cuenta: 'activo' })
        .eq('id', jugadorId)
      await supabase.functions.invoke('approve-user', { body: { jugadorId } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-users'] }),
  })

  const reject = useMutation({
    mutationFn: async (jugadorId: string) => {
      await supabase
        .schema('padel')
        .from('jugadores')
        .update({ estado_cuenta: 'suspendido' })
        .eq('id', jugadorId)
      await supabase.functions.invoke('reject-user', { body: { jugadorId } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-users'] }),
  })

  if (isLoading) return <div className="p-6 font-inter text-muted">Cargando...</div>

  return (
    <div className="p-6">
      <h1 className="mb-6 font-manrope text-xl font-bold text-navy">
        Solicitudes pendientes
        {pending.length > 0 && (
          <Badge className="ml-2 bg-gold text-navy">{pending.length}</Badge>
        )}
      </h1>

      {pending.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center font-inter text-slate shadow-card">
          No hay solicitudes pendientes
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((jugador) => (
            <div key={jugador.id} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-manrope text-sm font-bold text-gold">
                {jugador.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-inter text-sm font-semibold text-navy truncate">{jugador.nombre}</p>
                <p className="font-inter text-xs text-muted truncate">{jugador.email}</p>
                <div className="mt-1 flex gap-2">
                  {jugador.categoria && (
                    <Badge variant="secondary" className="font-inter text-xs">
                      {jugador.categoria}{jugador.gradualidad !== 'normal' ? jugador.gradualidad : ''}
                    </Badge>
                  )}
                  {jugador.sexo && (
                    <Badge variant="outline" className="font-inter text-xs">
                      {jugador.sexo === 'M' ? 'Masculino' : 'Femenino'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => approve.mutate(jugador.id)}
                  disabled={approve.isPending}
                  className="bg-navy text-gold hover:bg-navy-mid"
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => reject.mutate(jugador.id)}
                  disabled={reject.isPending}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Crear Edge Function `supabase/functions/approve-user/index.ts`**

Instalar Resend primero en el proyecto:
```bash
npm install resend
```

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { jugadorId } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: jugador } = await supabase
    .schema('padel')
    .from('jugadores')
    .select('email, nombre')
    .eq('id', jugadorId)
    .single()

  if (!jugador) return new Response('Not found', { status: 404 })

  const appUrl = Deno.env.get('APP_URL') ?? 'https://padel-sg.vercel.app'

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pádel SG <noreply@padelsg.cl>',
      to: jugador.email,
      subject: '¡Tu cuenta fue aprobada! — Pádel SG',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <div style="background:#0D1B2A;padding:16px 24px;border-radius:8px;margin-bottom:24px;">
            <span style="color:#F5C518;font-weight:900;font-size:14px;">PÁDEL SG</span>
          </div>
          <h1 style="color:#0D1B2A;font-size:20px;margin-bottom:8px;">¡Bienvenido/a, ${jugador.nombre}!</h1>
          <p style="color:#4A6580;font-size:14px;line-height:1.6;">
            Tu solicitud de acceso fue aprobada. Ya puedes ingresar a la plataforma.
          </p>
          <a href="${appUrl}/login" style="display:inline-block;margin-top:24px;background:#F5C518;color:#0D1B2A;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
            Ingresar a Pádel SG
          </a>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 4: Crear Edge Function `supabase/functions/reject-user/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { jugadorId } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: jugador } = await supabase
    .schema('padel')
    .from('jugadores')
    .select('email, nombre')
    .eq('id', jugadorId)
    .single()

  if (!jugador) return new Response('Not found', { status: 404 })

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pádel SG <noreply@padelsg.cl>',
      to: jugador.email,
      subject: 'Tu solicitud de acceso — Pádel SG',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <div style="background:#0D1B2A;padding:16px 24px;border-radius:8px;margin-bottom:24px;">
            <span style="color:#F5C518;font-weight:900;font-size:14px;">PÁDEL SG</span>
          </div>
          <h1 style="color:#0D1B2A;font-size:20px;margin-bottom:8px;">Hola, ${jugador.nombre}</h1>
          <p style="color:#4A6580;font-size:14px;line-height:1.6;">
            Tu solicitud de acceso no pudo ser aprobada en esta oportunidad. Si tienes dudas, contacta al administrador de la Rama Pádel.
          </p>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 5: Ejecutar tests PendingUsers → PASS**

```bash
npm run test:run src/features/admin/PendingUsers.test.tsx
```
Expected: 2 passed

- [ ] **Step 6: Deploy Edge Functions**

```bash
npx supabase functions deploy approve-user
npx supabase functions deploy reject-user
```

Configurar secrets en Supabase dashboard:
```
RESEND_API_KEY=re_xxxxx
APP_URL=https://padel-sg.vercel.app
```

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/ supabase/functions/
git commit -m "feat: add pending users approval queue + email edge functions"
```

---

## Task 11: Deploy a Vercel

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Verificar `vercel.json`**

El archivo ya existe. Confirmar que tiene SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Configurar variables de entorno en Vercel**

En Vercel dashboard → proyecto → Settings → Environment Variables:
```
VITE_SUPABASE_URL         = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY    = eyJxxx...
```

- [ ] **Step 3: Deploy**

```bash
npx vercel --prod
```

Expected: URL de producción activa.

- [ ] **Step 4: Verificar flujo completo**

1. Abrir URL de producción → redirige a `/login` ✓
2. Ir a `/registro` → formulario de 6 pasos funciona ✓
3. Completar registro → redirige a `/pendiente` ✓
4. En Supabase: jugador aparece con `estado_cuenta = 'pendiente'` ✓
5. En `/admin/usuarios` (como superadmin): aparece el jugador pendiente ✓
6. Aprobar → jugador recibe email + estado cambia a `activo` ✓
7. Login con credenciales → redirige a `/dashboard` ✓

- [ ] **Step 5: Commit final**

```bash
git add vercel.json
git commit -m "chore: verify Vercel deploy config for SPA routing"
```

---

## Resumen de tests

```bash
npm run test:run
```

Esperado al final del Plan 1:
- `src/stores/appStore.test.ts` — 1 test
- `src/components/brand/BrandLogo.test.tsx` — 2 tests
- `src/components/layout/Sidebar.test.tsx` — 1 test
- `src/features/auth/RegisterForm.test.tsx` — 2 tests
- `src/features/auth/LoginForm.test.tsx` — 2 tests
- `src/features/auth/AuthGuard.test.tsx` — 2 tests
- `src/features/admin/PendingUsers.test.tsx` — 2 tests

**Total: 12 tests passing**
