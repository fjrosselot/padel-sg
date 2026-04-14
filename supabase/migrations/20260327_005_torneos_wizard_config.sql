-- Columna para guardar la configuración del wizard (formato, grupos, turnos, etc.)
ALTER TABLE padel.torneos ADD COLUMN IF NOT EXISTS wizard_config jsonb;
