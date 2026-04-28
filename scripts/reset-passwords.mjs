/**
 * reset-passwords.mjs
 *
 * Establece la contraseña de cada jugador como los últimos 4 dígitos de su teléfono.
 * Usa jugadores.id directamente como auth_id (son el mismo UUID en esta app).
 * Si updateUserById falla (usuario no existe), crea la cuenta.
 *
 * Uso:
 *   node scripts/reset-passwords.mjs          ← DRY RUN por defecto
 *   DRY_RUN=false node scripts/reset-passwords.mjs   ← ejecuta los cambios
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.env.DRY_RUN !== 'false'
const SB_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY

if (!SB_URL || !SERVICE_KEY) {
  console.error('Faltan variables: VITE_SUPABASE_URL y VITE_SUPABASE_SERVICE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SB_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function last4(telefono) {
  return telefono.replace(/\D/g, '').slice(-4)
}

async function main() {
  console.log(`\n${DRY_RUN ? '🔍 DRY RUN — no se hacen cambios' : '🚀 EJECUTANDO cambios reales'}\n`)

  const { data: jugadores, error } = await supabase
    .schema('padel')
    .from('jugadores')
    .select('id, nombre, apellido, email, telefono')
    .order('apellido')

  if (error) { console.error('Error:', error); process.exit(1) }

  let updated = 0, created = 0, errors = 0

  for (const j of jugadores) {
    const password = last4(j.telefono)
    const label = `${j.nombre} <${j.email}> → ${password}`

    if (DRY_RUN) {
      console.log(`  🔑 ${label}`)
      continue
    }

    // Actualizar email + contraseña (jugadores.id == auth.users.id en esta app)
    const { error: ue } = await supabase.auth.admin.updateUserById(j.id, { email: j.email, password })

    if (!ue) {
      console.log(`  ✅ ${label}`)
      updated++
      continue
    }

    // Si no existe el usuario auth, crearlo
    if (ue.message?.includes('not found') || ue.status === 404) {
      console.log(`  ➕ Creando: ${label}`)
      const { error: ce } = await supabase.auth.admin.createUser({
        email: j.email,
        password,
        email_confirm: true,
      })
      if (ce) { console.error(`     ❌ Error al crear: ${ce.message}`); errors++ }
      else { created++ }
    } else {
      console.error(`  ❌ ${label} — ${ue.message}`)
      errors++
    }
  }

  console.log(`\n──────────────────────────────────`)
  if (DRY_RUN) {
    console.log(`Total: ${jugadores.length} jugadores`)
    console.log(`\nPara ejecutar: DRY_RUN=false node scripts/reset-passwords.mjs`)
  } else {
    console.log(`✅ Actualizados: ${updated}`)
    console.log(`➕ Creados:     ${created}`)
    console.log(`❌ Errores:     ${errors}`)
  }
}

main()
