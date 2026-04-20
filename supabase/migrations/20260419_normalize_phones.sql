-- Normalize Chilean phone numbers to +569XXXXXXXX format
-- Handles: +56912345678, 56912345678, 912345678, 9 1234 5678, 09XXXXXXXX, etc.

UPDATE padel.jugadores
SET telefono = CASE
  -- Already correct: +569XXXXXXXX (12 chars)
  WHEN telefono ~ '^\+569\d{8}$' THEN telefono

  -- +56 9XXXXXXXX with space: +56 912345678
  WHEN telefono ~ '^\+56\s?9\d{8}$' THEN '+56' || regexp_replace(telefono, '[^0-9]', '', 'g')

  -- 569XXXXXXXX (11 digits, no +)
  WHEN regexp_replace(telefono, '[^0-9]', '', 'g') ~ '^569\d{8}$'
    THEN '+' || regexp_replace(telefono, '[^0-9]', '', 'g')

  -- 9XXXXXXXX (9 digits, local mobile)
  WHEN regexp_replace(telefono, '[^0-9]', '', 'g') ~ '^9\d{8}$'
    THEN '+56' || regexp_replace(telefono, '[^0-9]', '', 'g')

  -- 09XXXXXXXX (10 digits, old format with leading 0)
  WHEN regexp_replace(telefono, '[^0-9]', '', 'g') ~ '^09\d{8}$'
    THEN '+56' || substring(regexp_replace(telefono, '[^0-9]', '', 'g') FROM 2)

  -- 56XXXXXXXX (10 digits, missing the 9)
  WHEN regexp_replace(telefono, '[^0-9]', '', 'g') ~ '^56\d{8}$'
    THEN '+' || regexp_replace(telefono, '[^0-9]', '', 'g')

  ELSE telefono
END
WHERE telefono IS NOT NULL AND telefono != '';
