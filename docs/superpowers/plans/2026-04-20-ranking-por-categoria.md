# Ranking por Categoría Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the global ELO ranking with a points-based ranking per category and sexo, with pill filters and a parallel "all categories" view, seeded with real americano data.

**Architecture:** Three new DB tables (`tabla_puntos`, `eventos_ranking`, `puntos_ranking`) + a view (`ranking_categoria`) provide the data layer. The UI is a rewritten `RankingPage.tsx` that shows either a single-category ranked list or a horizontal grid of all categories in parallel. A shared `RankingCategoriaCard` component renders each category's top players.

**Tech Stack:** React 18 + TypeScript, TanStack Query, Supabase (schema `padel`), Tailwind CSS, Vite/Vitest

---

## Context for implementer

### Categories in play
- **Hombres:** 3a, 4a, 5a, Open
- **Mujeres:** B, C, D, Open

### Points scale (agreed)
```
americano_grupos: campeon=100, finalista=50, semifinalista=26, cuartos=14, octavos=8, no_clasifica=5
americano_rr:     pos_1=80, pos_2=54, pos_3=36, pos_4=24, pos_5=16, pos_6=11, pos_7=7, pos_8_plus=5
externo:          ganado=20, jugado=5
amistoso:         ganado=8, jugado=2
```

### Americano SG Abril 2026 structure
- Format: `americano_grupos` (2 groups of 3 pairs → semis → finals)
- 4 categories: Hombres Avanzado, Mujeres Avanzado, Mujeres Introducción 1, Mujeres Introducción 2
- Mapping to padel categories (all players get points for their OWN padel.jugadores.categoria):
  - Hombres Avanzado → individual jugador.categoria (3a or 4a)
  - Mujeres Avanzado → individual jugador.categoria (B or C)
  - Mujeres Intro 1 → individual jugador.categoria (C or D)
  - Mujeres Intro 2 → individual jugador.categoria (C or D)
- Phase results known:
  - **Semis played:** Lewinsohn/Valdés beat Brunet/Covarrubias 6-1; Rosselot/Calleja beat F.Sanhueza/J.Sanhueza 6-1
  - **Finals not played yet** (score1=null) → assign "finalista" to both finalists, update to campeon/finalista when played
  - **Plata finals not played** → assign "cuartos" to all 4 plata participants
  - **Semi losers** → semifinalista

### Existing supabase client
```typescript
// src/lib/supabase.ts — use this
import { supabase } from '../../lib/supabase'
supabase.schema('padel').from('tabla_nombre').select(...)
```

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/20260420_ranking_sistema.sql` | Create | Tables, view, seed tabla_puntos, temporada 2026 |
| `supabase/migrations/20260420_import_americano.sql` | Create | Import Americano SG Abril 2026 points |
| `src/lib/types/database.types.ts` | Modify | Add new table types |
| `src/features/ranking/RankingCategoriaCard.tsx` | Create | Single-category ranked list card |
| `src/features/ranking/RankingPage.tsx` | Modify | Rewrite: pills + parallel view |
| `src/features/ranking/RankingPage.test.tsx` | Create | Smoke tests |

---

## Task 1: DB Schema — tables, view, seed, temporada

**Files:**
- Create: `supabase/migrations/20260420_ranking_sistema.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260420_ranking_sistema.sql

-- Temporada 2026 (base for all ranking points)
INSERT INTO padel.temporadas (id, nombre, anio, fecha_inicio, amistosos_afectan_ranking)
VALUES (gen_random_uuid(), 'Temporada 2026', 2026, '2026-01-01', true)
ON CONFLICT DO NOTHING;

-- Points scale reference
CREATE TABLE IF NOT EXISTS padel.tabla_puntos (
  tipo_evento text NOT NULL,
  fase        text NOT NULL,
  puntos      integer NOT NULL,
  PRIMARY KEY (tipo_evento, fase)
);

INSERT INTO padel.tabla_puntos (tipo_evento, fase, puntos) VALUES
  ('americano_grupos', 'campeon',       100),
  ('americano_grupos', 'finalista',      50),
  ('americano_grupos', 'semifinalista',  26),
  ('americano_grupos', 'cuartos',        14),
  ('americano_grupos', 'octavos',         8),
  ('americano_grupos', 'no_clasifica',    5),
  ('americano_rr',     'pos_1',          80),
  ('americano_rr',     'pos_2',          54),
  ('americano_rr',     'pos_3',          36),
  ('americano_rr',     'pos_4',          24),
  ('americano_rr',     'pos_5',          16),
  ('americano_rr',     'pos_6',          11),
  ('americano_rr',     'pos_7',           7),
  ('americano_rr',     'pos_8_plus',      5),
  ('externo',          'ganado',         20),
  ('externo',          'jugado',          5),
  ('amistoso',         'ganado',          8),
  ('amistoso',         'jugado',          2)
ON CONFLICT DO NOTHING;

-- Events that generate ranking points
CREATE TABLE IF NOT EXISTS padel.eventos_ranking (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre       text NOT NULL,
  tipo         text NOT NULL CHECK (tipo IN ('americano_grupos','americano_rr','externo','amistoso')),
  fecha        date,
  temporada_id uuid REFERENCES padel.temporadas(id),
  created_at   timestamptz DEFAULT now()
);

-- Points earned per player per event
CREATE TABLE IF NOT EXISTS padel.puntos_ranking (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  jugador_id  uuid NOT NULL REFERENCES padel.jugadores(id) ON DELETE CASCADE,
  evento_id   uuid NOT NULL REFERENCES padel.eventos_ranking(id) ON DELETE CASCADE,
  categoria   text NOT NULL,
  sexo        text CHECK (sexo IN ('M','F')),
  puntos      integer NOT NULL,
  fase        text,
  created_at  timestamptz DEFAULT now()
);

-- Aggregated ranking per category per season (read-only view)
CREATE OR REPLACE VIEW padel.ranking_categoria AS
SELECT
  j.id           AS jugador_id,
  j.nombre,
  j.nombre_pila,
  j.apellido,
  j.apodo,
  j.foto_url,
  j.sexo,
  pr.categoria,
  er.temporada_id,
  SUM(pr.puntos)              AS puntos_total,
  COUNT(DISTINCT pr.evento_id) AS eventos_jugados
FROM padel.puntos_ranking pr
JOIN padel.jugadores      j  ON j.id  = pr.jugador_id
JOIN padel.eventos_ranking er ON er.id = pr.evento_id
GROUP BY j.id, j.nombre, j.nombre_pila, j.apellido, j.apodo, j.foto_url, j.sexo, pr.categoria, er.temporada_id;

-- RLS: allow read for authenticated users
ALTER TABLE padel.tabla_puntos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.eventos_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE padel.puntos_ranking  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_tabla_puntos"    ON padel.tabla_puntos    FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_eventos_ranking" ON padel.eventos_ranking FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_puntos_ranking"  ON padel.puntos_ranking  FOR SELECT TO authenticated USING (true);
```

- [ ] **Step 2: Apply via Supabase MCP**

```bash
# Use mcp__plugin_supabase_supabase__apply_migration with:
# project_id: dzxhtvfrvkisrjcicdfo
# name: ranking_sistema
# query: (contents of the SQL above)
```

Expected: `{"success":true}`

- [ ] **Step 3: Verify tables and view exist**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'padel'
AND table_name IN ('tabla_puntos','eventos_ranking','puntos_ranking');

SELECT COUNT(*) FROM padel.tabla_puntos;
-- Expected: 18 rows

SELECT id, nombre FROM padel.temporadas;
-- Expected: 1 row, Temporada 2026
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260420_ranking_sistema.sql
git commit -m "feat: add ranking points schema — tabla_puntos, eventos_ranking, puntos_ranking, view"
```

---

## Task 2: Import Americano SG Abril 2026

**Files:**
- Create: `supabase/migrations/20260420_import_americano.sql`

**Context:** The americano had 4 categories, each with grupos+semis+finals. Finals (final_oro, final_plata) have NULL scores — not played yet. We assign points based on the highest confirmed phase reached. Points go to each player's own `padel.jugadores.categoria`, not the americano category.

Phase assignment logic:
- `final_oro` participants (score1 IS NULL) → `finalista` (50 pts) — update to `campeon`/`finalista` when finals are played
- `semi` losers → `semifinalista` (26 pts)
- `final_plata` participants (score1 IS NULL) → `cuartos` (14 pts)
- Everyone else (only reached groups) → `no_clasifica` (5 pts)

- [ ] **Step 1: Write import migration**

```sql
-- supabase/migrations/20260420_import_americano.sql

DO $$
DECLARE
  v_evento_id   uuid;
  v_temporada_id uuid;

  -- Helper: find jugador id by name (unaccent-safe)
  FUNCTION get_jugador_id(p_firstname text, p_lastname text) RETURNS uuid AS $f$
    SELECT id FROM padel.jugadores
    WHERE unaccent(lower(trim(nombre_pila))) = unaccent(lower(trim(p_firstname)))
      AND unaccent(lower(trim(apellido)))    = unaccent(lower(trim(p_lastname)))
    LIMIT 1;
  $f$ LANGUAGE sql;

BEGIN
  -- Get temporada 2026
  SELECT id INTO v_temporada_id FROM padel.temporadas WHERE anio = 2026 LIMIT 1;

  -- Create the event
  INSERT INTO padel.eventos_ranking (nombre, tipo, fecha, temporada_id)
  VALUES ('Americano SG Abril 2026', 'americano_grupos', '2026-04-08', v_temporada_id)
  RETURNING id INTO v_evento_id;

  -- Helper procedure: insert points for a player by name
  -- Points go to their actual padel.jugadores.categoria
  WITH award AS (
    SELECT id, categoria, sexo FROM padel.jugadores
    WHERE unaccent(lower(trim(nombre_pila))) = unaccent(lower(trim($1)))
      AND unaccent(lower(trim(apellido)))    = unaccent(lower(trim($2)))
    LIMIT 1
  )
  INSERT INTO padel.puntos_ranking (jugador_id, evento_id, categoria, sexo, puntos, fase)
  SELECT id, v_evento_id, COALESCE(categoria, $3), sexo, $4, $5 FROM award;
  ...
```

Actually, the `DO $$` block doesn't support inline function definitions cleanly. Use a CTE-based approach instead:

```sql
-- supabase/migrations/20260420_import_americano.sql

DO $$
DECLARE
  v_evento_id    uuid;
  v_temporada_id uuid;
BEGIN
  SELECT id INTO v_temporada_id FROM padel.temporadas WHERE anio = 2026 LIMIT 1;

  INSERT INTO padel.eventos_ranking (nombre, tipo, fecha, temporada_id)
  VALUES ('Americano SG Abril 2026', 'americano_grupos', '2026-04-08', v_temporada_id)
  RETURNING id INTO v_evento_id;

  -- Award points: uses a temp table of (firstname, lastname, fase, fallback_categoria)
  -- fallback_categoria only used if jugador.categoria IS NULL
  WITH players(firstname, lastname, fase, fallback_cat) AS (VALUES
    -- HOMBRES AVANZADO
    -- Final oro (no score yet) → finalista
    ('Francisco',  'Rosselot',     'finalista',     '3a'),
    ('Francisco',  'Calleja',      'finalista',     '3a'),
    ('Michael',    'Lewinsohn',    'finalista',     '3a'),
    ('José Joaquín','Valdés',      'finalista',     '3a'),
    -- Semi losers → semifinalista
    ('Cristian',   'Brunet',       'semifinalista', '4a'),
    ('Arturo',     'Covarrubias',  'semifinalista', '3a'),
    ('Felipe',     'Sanhueza',     'semifinalista', '3a'),
    ('Javier',     'Sanhueza',     'semifinalista', '3a'),
    -- Final plata (no score) → cuartos
    ('José Miguel','Kolubakin',    'cuartos',       '4a'),
    ('Manuel',     'Aravena',      'cuartos',       '3a'),
    ('Raul',       'Reyes',        'cuartos',       '3a'),
    ('Sebastián',  'Diaz',         'cuartos',       '3a'),

    -- MUJERES AVANZADO
    -- Final oro → finalista
    ('Sofia',      'Araos',        'finalista',     'C'),
    ('Catalina',   'Pacheco',      'finalista',     'C'),
    ('Carolina',   'Ferrando',     'finalista',     'B'),
    ('Paula',      'Comandari',    'finalista',     'B'),
    -- Semi losers → semifinalista
    ('María Jose', 'Rovira',       'semifinalista', 'B'),
    ('Rosario',    'Rivero',       'semifinalista', 'B'),
    ('Fernanda',   'Goñi',         'semifinalista', 'C'),
    ('Antonia',    'Koster',       'semifinalista', 'C'),
    -- Final plata → cuartos
    ('Carolina',   'Jerez',        'cuartos',       'C'),
    ('Pilar',      'Palma',        'cuartos',       'C'),
    ('Pamela',     'Larraín',      'cuartos',       'C'),
    ('Sofía',      'De Mussy',     'cuartos',       'C'),

    -- MUJERES INTRODUCCIÓN 1
    -- Final oro → finalista
    ('Valentina',  'Geyger',       'finalista',     'C'),
    ('Natalia',    'Kapstein',     'finalista',     'C'),
    ('Melina',     'Pombo',        'finalista',     'C'),
    ('María Patricia','Sotomayor', 'finalista',     'C'),
    -- Semi losers → semifinalista
    ('Camila',     'Bianchi',      'semifinalista', 'D'),
    ('Bernardita', 'Fantuzzi',     'semifinalista', 'D'),
    ('Carolina',   'Hube',         'semifinalista', 'D'),
    ('Lorena',     'Mendez',       'semifinalista', 'D'),
    -- Final plata → cuartos
    ('Catalina',   'Parada',       'cuartos',       'D'),
    ('Rosario',    'Garcia-Huidobro','cuartos',     'D'),
    ('Ivette',     'Wilson',       'cuartos',       'C'),
    ('Loreto',     'Larraín',      'cuartos',       'D'),

    -- MUJERES INTRODUCCIÓN 2
    -- Final oro → finalista
    ('Catalina',   'Ramirez',      'finalista',     'C'),
    ('Macarena',   'Cardone',      'finalista',     'C'),
    ('Alejandra',  'Ovalle',       'finalista',     'C'),
    ('Macarena',   'Barrientos',   'finalista',     'D'),
    -- Semi losers → semifinalista
    ('Cecilia',    'Jadue',        'semifinalista', 'D'),
    ('Trinidad',   'Silberberg',   'semifinalista', 'D'),
    ('Sylvia',     'Torres',       'semifinalista', 'D'),
    ('Carolina',   'Vidal',        'semifinalista', 'D'),
    -- Final plata → cuartos
    ('Alejandra',  'Ojeda',        'cuartos',       'D'),
    ('Carola',     'Merino',       'cuartos',       'D'),
    ('Julieta',    'Di Meglio',    'cuartos',       'D'),
    ('Amparo',     'García',       'cuartos',       'F')
  )
  INSERT INTO padel.puntos_ranking (jugador_id, evento_id, categoria, sexo, puntos, fase)
  SELECT
    j.id,
    v_evento_id,
    COALESCE(j.categoria, p.fallback_cat),
    j.sexo,
    tp.puntos,
    p.fase
  FROM players p
  JOIN padel.jugadores j
    ON unaccent(lower(trim(j.nombre_pila))) = unaccent(lower(trim(p.firstname)))
   AND unaccent(lower(trim(j.apellido)))    = unaccent(lower(trim(p.lastname)))
  JOIN padel.tabla_puntos tp
    ON tp.tipo_evento = 'americano_grupos'
   AND tp.fase = p.fase;

END $$;
```

Note: `Amparo García` has fallback_cat `'F'` which is wrong — it should be her actual category. Since she's new with no category set, it will use `null` → `fallback_cat`. Use `'D'` for her (Mujeres Intro 2). Fix the last row to `'D'`.

- [ ] **Step 2: Apply migration**

Apply via `mcp__plugin_supabase_supabase__apply_migration` with name `import_americano_abril_2026`.

- [ ] **Step 3: Verify import**

```sql
SELECT j.nombre, pr.categoria, pr.fase, pr.puntos
FROM padel.puntos_ranking pr
JOIN padel.jugadores j ON j.id = pr.jugador_id
ORDER BY pr.fase, j.apellido
LIMIT 20;
-- Expected: ~48 rows with campeon/finalista/semifinalista/cuartos phases

SELECT categoria, COUNT(*), SUM(puntos) FROM padel.puntos_ranking GROUP BY categoria ORDER BY categoria;
-- Expected: breakdown by category

SELECT * FROM padel.ranking_categoria ORDER BY categoria, puntos_total DESC;
-- Expected: ranked players per category
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260420_import_americano.sql
git commit -m "feat: import Americano SG Abril 2026 ranking points"
```

---

## Task 3: RankingCategoriaCard component

**Files:**
- Create: `src/features/ranking/RankingCategoriaCard.tsx`

This component renders one category's ranked list as a card. Used in both single-category view (full width) and parallel "all categories" grid.

- [ ] **Step 1: Create component**

```tsx
// src/features/ranking/RankingCategoriaCard.tsx
import { useNavigate } from 'react-router-dom'

export interface RankingEntry {
  jugador_id: string
  nombre: string
  nombre_pila: string | null
  apellido: string | null
  apodo: string | null
  foto_url: string | null
  sexo: string | null
  categoria: string
  puntos_total: number
  eventos_jugados: number
}

interface Props {
  categoria: string
  sexo: 'M' | 'F'
  entries: RankingEntry[]
  compact?: boolean   // true in parallel grid (limits to top 8, smaller rows)
}

export default function RankingCategoriaCard({ categoria, sexo, entries, compact = false }: Props) {
  const navigate = useNavigate()
  const display = compact ? entries.slice(0, 8) : entries

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      <div className={`px-4 py-3 flex items-center gap-2 ${sexo === 'M' ? 'bg-blue-50' : 'bg-pink-50'}`}>
        <span className="font-manrope text-sm font-extrabold text-navy uppercase tracking-tight">
          Cat. {categoria}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          sexo === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
        }`}>
          {sexo === 'M' ? 'Hombres' : 'Damas'}
        </span>
        <span className="ml-auto font-inter text-[10px] text-muted">{entries.length} jugadores</span>
      </div>

      {display.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted text-center">Sin datos aún.</p>
      ) : (
        <div className="divide-y divide-surface-high">
          {display.map((entry, idx) => {
            const initials = [entry.nombre_pila, entry.apellido]
              .filter(Boolean).map(n => n![0]).join('').toUpperCase() || '??'
            const displayName = entry.apellido
              ? `${entry.apellido}${entry.nombre_pila ? `, ${entry.nombre_pila}` : ''}`
              : entry.nombre

            return (
              <button
                key={entry.jugador_id}
                type="button"
                onClick={() => navigate(`/jugadores/${entry.jugador_id}`)}
                className={`w-full flex items-center gap-3 text-left hover:bg-surface transition-colors ${
                  compact ? 'px-3 py-2' : 'px-4 py-3'
                }`}
              >
                <span className={`w-5 shrink-0 font-manrope text-xs font-bold text-center ${
                  idx === 0 ? 'text-gold' : idx === 1 ? 'text-slate' : idx === 2 ? 'text-[#CD7F32]' : 'text-muted'
                }`}>
                  {idx + 1}
                </span>

                <div className={`shrink-0 rounded-full bg-navy flex items-center justify-center overflow-hidden ${
                  compact ? 'h-7 w-7' : 'h-9 w-9'
                }`}>
                  {entry.foto_url
                    ? <img src={entry.foto_url} alt={entry.nombre} className="h-full w-full object-cover" />
                    : <span className={`font-manrope font-bold text-gold ${compact ? 'text-[9px]' : 'text-xs'}`}>
                        {initials}
                      </span>
                  }
                </div>

                <span className={`flex-1 min-w-0 font-manrope font-bold text-navy truncate ${
                  compact ? 'text-xs' : 'text-sm'
                }`}>
                  {displayName}
                  {entry.apodo && !compact && (
                    <span className="font-normal text-muted"> "{entry.apodo}"</span>
                  )}
                </span>

                <span className={`shrink-0 font-manrope font-extrabold text-navy ${
                  compact ? 'text-sm' : 'text-lg'
                }`}>
                  {entry.puntos_total}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {compact && entries.length > 8 && (
        <p className="px-4 py-2 text-center font-inter text-[10px] text-muted border-t border-surface-high">
          +{entries.length - 8} más
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/ranking/RankingCategoriaCard.tsx
git commit -m "feat: RankingCategoriaCard — ranked list card per category"
```

---

## Task 4: Rewrite RankingPage

**Files:**
- Modify: `src/features/ranking/RankingPage.tsx`

Pill options:
- `Todas` → parallel grid of all categories
- `H: 3a` `H: 4a` `H: 5a` `H: Open` → single category, men
- `M: B` `M: C` `M: D` `M: Open` → single category, women

The data comes from the `ranking_categoria` view grouped by temporada. Use the active temporada (most recent).

- [ ] **Step 1: Rewrite RankingPage**

```tsx
// src/features/ranking/RankingPage.tsx
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import RankingCategoriaCard, { type RankingEntry } from './RankingCategoriaCard'

const CATS_HOMBRES = ['3a', '4a', '5a', 'Open']
const CATS_MUJERES = ['B', 'C', 'D', 'Open']

type Filtro = 'todas' | string  // 'todas' or a categoria value

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-1.5 rounded-full font-inter text-xs font-semibold transition-colors focus:outline-none ${
        active
          ? 'bg-navy text-gold'
          : 'bg-white border border-navy/20 text-slate hover:border-navy/40 hover:text-navy'
      }`}
    >
      {label}
    </button>
  )
}

export default function RankingPage() {
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ranking-categoria'],
    queryFn: async () => {
      // Get most recent temporada
      const { data: temps } = await supabase
        .schema('padel')
        .from('temporadas')
        .select('id')
        .order('anio', { ascending: false })
        .limit(1)
      const temporadaId = temps?.[0]?.id
      if (!temporadaId) return []

      const { data, error } = await supabase
        .schema('padel')
        .from('ranking_categoria')
        .select('jugador_id, nombre, nombre_pila, apellido, apodo, foto_url, sexo, categoria, temporada_id, puntos_total, eventos_jugados')
        .eq('temporada_id', temporadaId)
      if (error) throw error
      return data as RankingEntry[]
    },
  })

  // Group by category, sorted by puntos_total desc
  const byCategoria = useMemo(() => {
    const map = new Map<string, { sexo: 'M' | 'F'; entries: RankingEntry[] }>()
    for (const e of entries) {
      if (!map.has(e.categoria)) {
        map.set(e.categoria, { sexo: (e.sexo as 'M' | 'F') ?? 'M', entries: [] })
      }
      map.get(e.categoria)!.entries.push(e)
    }
    // Sort entries within each category
    for (const v of map.values()) {
      v.entries.sort((a, b) => b.puntos_total - a.puntos_total)
    }
    return map
  }, [entries])

  // Pills: only show categories that have data
  const hombresConDatos = CATS_HOMBRES.filter(c => byCategoria.has(c))
  const mujeresConDatos = CATS_MUJERES.filter(c => byCategoria.has(c))

  // Ordered list of all categories for parallel view (H first, then F)
  const todasCats = [
    ...CATS_HOMBRES.filter(c => byCategoria.has(c)).map(c => ({ cat: c, sexo: 'M' as const })),
    ...CATS_MUJERES.filter(c => byCategoria.has(c)).map(c => ({ cat: c, sexo: 'F' as const })),
  ]

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando ranking…</div>

  const catData = filtro !== 'todas' ? byCategoria.get(filtro) : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy uppercase tracking-tight">Ranking</h1>
      </div>

      {/* Pills */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterPill label="Todas" active={filtro === 'todas'} onClick={() => setFiltro('todas')} />
          {hombresConDatos.length > 0 && (
            <>
              <div className="w-px bg-navy/10 shrink-0" />
              {hombresConDatos.map(c => (
                <FilterPill key={c} label={`H: ${c}`} active={filtro === c} onClick={() => setFiltro(filtro === c ? 'todas' : c)} />
              ))}
            </>
          )}
          {mujeresConDatos.length > 0 && (
            <>
              <div className="w-px bg-navy/10 shrink-0" />
              {mujeresConDatos.map(c => (
                <FilterPill key={c} label={`M: ${c}`} active={filtro === c} onClick={() => setFiltro(filtro === c ? 'todas' : c)} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {entries.length === 0 ? (
        <div className="rounded-xl bg-white shadow-card p-8 text-center">
          <p className="font-inter text-sm text-muted">Sin puntos de ranking registrados aún.</p>
        </div>
      ) : filtro === 'todas' ? (
        /* Parallel grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {todasCats.map(({ cat, sexo }) => (
            <RankingCategoriaCard
              key={cat}
              categoria={cat}
              sexo={sexo}
              entries={byCategoria.get(cat)?.entries ?? []}
              compact
            />
          ))}
        </div>
      ) : catData ? (
        /* Single category — full width */
        <RankingCategoriaCard
          categoria={filtro}
          sexo={catData.sexo}
          entries={catData.entries}
          compact={false}
        />
      ) : (
        <div className="rounded-xl bg-white shadow-card p-8 text-center">
          <p className="font-inter text-sm text-muted">Sin datos para esta categoría.</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to RankingPage or RankingCategoriaCard.

- [ ] **Step 3: Commit**

```bash
git add src/features/ranking/RankingPage.tsx
git commit -m "feat: rewrite RankingPage — per-category pills + parallel grid view"
```

---

## Task 5: Update database.types.ts

**Files:**
- Modify: `src/lib/types/database.types.ts`

- [ ] **Step 1: Add new table types**

Add to the `padel` schema section of `database.types.ts`:

```typescript
tabla_puntos: {
  Row: { tipo_evento: string; fase: string; puntos: number }
  Insert: { tipo_evento: string; fase: string; puntos: number }
  Update: { tipo_evento?: string; fase?: string; puntos?: number }
}
eventos_ranking: {
  Row: {
    id: string; nombre: string; tipo: string
    fecha: string | null; temporada_id: string | null; created_at: string
  }
  Insert: {
    id?: string; nombre: string; tipo: string
    fecha?: string | null; temporada_id?: string | null; created_at?: string
  }
  Update: {
    id?: string; nombre?: string; tipo?: string
    fecha?: string | null; temporada_id?: string | null
  }
}
puntos_ranking: {
  Row: {
    id: string; jugador_id: string; evento_id: string
    categoria: string; sexo: string | null; puntos: number
    fase: string | null; created_at: string
  }
  Insert: {
    id?: string; jugador_id: string; evento_id: string
    categoria: string; sexo?: string | null; puntos: number
    fase?: string | null; created_at?: string
  }
  Update: {
    categoria?: string; sexo?: string | null; puntos?: number; fase?: string | null
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types/database.types.ts
git commit -m "chore: add tabla_puntos, eventos_ranking, puntos_ranking types"
```

---

## Task 6: Smoke tests

**Files:**
- Create: `src/features/ranking/RankingPage.test.tsx`

- [ ] **Step 1: Write tests**

```tsx
// src/features/ranking/RankingPage.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RankingPage from './RankingPage'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: (table: string) => ({
        select: () => ({
          order: () => ({ limit: () => Promise.resolve({ data: table === 'temporadas' ? [{ id: 'temp-1' }] : [], error: null }) }),
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
}

describe('RankingPage', () => {
  it('renders the Ranking header', async () => {
    render(<RankingPage />, { wrapper })
    expect(await screen.findByText('RANKING')).toBeTruthy()
  })

  it('shows empty state when no data', async () => {
    render(<RankingPage />, { wrapper })
    expect(await screen.findByText(/Sin puntos de ranking/i)).toBeTruthy()
  })

  it('shows Todas pill active by default', async () => {
    render(<RankingPage />, { wrapper })
    const pill = await screen.findByRole('button', { name: 'Todas' })
    expect(pill.className).toContain('bg-navy')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/features/ranking/RankingPage.test.tsx
```

Expected: 3 passing.

- [ ] **Step 3: Commit**

```bash
git add src/features/ranking/RankingPage.test.tsx
git commit -m "test: smoke tests for RankingPage"
```

---

## Self-Review

**Spec coverage:**
- ✅ Points tables per event type (tabla_puntos with 4 tipos)
- ✅ Ranking per category and sexo (ranking_categoria view + pills split by H/M)
- ✅ Pill filters per category
- ✅ Parallel "all categories" grid view
- ✅ Import americano abril 2026 as first data
- ✅ Temporada 2026 created

**Notes:**
- The americano finals (final_oro, final_plata) had NULL scores at time of import. Finalists are awarded `finalista` (50pts). Once finals are played, run a follow-up UPDATE on `puntos_ranking` to set the winner to `campeon` (100pts) and losers stay at `finalista` (50pts).
- The `ranking_categoria` is a view — no RLS needed on the view itself, only on underlying tables.
- Players with `categoria = NULL` (the new 18 players) get their fallback_cat from the import migration. Once you assign their categories in AdminJugadores, re-run a corrective UPDATE on `puntos_ranking`.
