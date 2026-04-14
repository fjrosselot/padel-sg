-- Migration: Plan 2 - Add ELO to jugadores + fixture config to torneos

-- Add ELO to jugadores (individual rating, starts at 1200)
ALTER TABLE padel.jugadores
  ADD COLUMN IF NOT EXISTS elo integer NOT NULL DEFAULT 1200;

-- Add fixture configuration columns to torneos
ALTER TABLE padel.torneos
  ADD COLUMN IF NOT EXISTS categorias jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS config_fixture jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN padel.jugadores.elo IS
  'ELO rating — K=32, starts at 1200, updated after each completed match';
COMMENT ON COLUMN padel.torneos.categorias IS
  'Array of {nombre: string, num_parejas: number}';
COMMENT ON COLUMN padel.torneos.config_fixture IS
  'ConfigFixture: parejas_por_grupo, cuantos_avanzan, con_consolacion, con_tercer_lugar, duracion_partido, pausa_entre_partidos, num_canchas, hora_inicio, fixture_compacto';
