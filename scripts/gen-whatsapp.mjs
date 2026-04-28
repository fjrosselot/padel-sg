/**
 * gen-whatsapp.mjs
 *
 * Genera un archivo HTML con un link wa.me por jugador.
 * Cada link abre WhatsApp con el mensaje de bienvenida pre-llenado.
 * El admin hace clic en cada uno y presiona "Enviar" manualmente.
 *
 * Uso:
 *   node scripts/gen-whatsapp.mjs
 *   → genera scripts/whatsapp-links.html
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { config } from 'dotenv'
config({ path: '.env.local' })

const SB_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY
const APP_URL = 'https://padelsg.vercel.app'

if (!SB_URL || !SERVICE_KEY) {
  console.error('Faltan variables: VITE_SUPABASE_URL y VITE_SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(SB_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function last4(telefono) {
  return telefono.replace(/\D/g, '').slice(-4)
}

function waLink(telefono, mensaje) {
  const num = telefono.replace(/\D/g, '')
  return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`
}

function mensaje(nombre, email, password) {
  const usaUsername = email.endsWith('@sgpadel.cl')
  const loginId = usaUsername ? email.replace('@sgpadel.cl', '') : email
  const loginLabel = usaUsername ? 'Usuario' : 'Email'
  const extraNote = usaUsername
    ? '\nAl ingresar te pediremos que registres tu correo real para próximos accesos.'
    : ''
  return `Hola ${nombre} 👋

Te damos la bienvenida a la plataforma de Pádel Saint George's.

Puedes ingresar aquí:
${APP_URL}

Tus datos de acceso:
• ${loginLabel}: ${loginId}
• Contraseña temporal: ${password}
${extraNote}
Te recomendamos cambiar la contraseña desde tu perfil una vez que ingreses.

¡Nos vemos en la cancha! 🎾`
}

async function main() {
  const { data: jugadores, error } = await supabase
    .schema('padel')
    .from('jugadores')
    .select('nombre, apellido, email, telefono')
    .order('apellido')

  if (error) { console.error(error); process.exit(1) }

  const rows = jugadores.map((j, i) => {
    const password = last4(j.telefono)
    const msg = mensaje(j.nombre.split(' ')[0], j.email, password)
    const link = waLink(j.telefono, msg)
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${j.apellido}, ${j.nombre.split(' ')[0]}</td>
        <td style="font-size:12px;color:#555">${j.email}</td>
        <td>${j.telefono}</td>
        <td><strong>${password}</strong></td>
        <td><a href="${link}" target="_blank" onclick="this.parentElement.parentElement.style.background='#d4edda'">📲 Enviar</a></td>
      </tr>`
  }).join('\n')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>WhatsApp Bienvenida — Pádel SG</title>
<style>
  body { font-family: sans-serif; padding: 20px; }
  h1 { font-size: 20px; }
  p { color: #555; font-size: 13px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th { background: #071b3b; color: #e8c547; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #eee; }
  tr:hover { background: #f9f9f9; }
  a { color: #16a34a; font-weight: bold; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .badge { background: #071b3b; color: white; border-radius: 99px; padding: 2px 10px; font-size: 11px; }
</style>
</head>
<body>
<h1>Bienvenida Pádel SG <span class="badge">${jugadores.length} jugadores</span></h1>
<p>Haz clic en "📲 Enviar" para abrir WhatsApp con el mensaje pre-llenado. La fila se marca verde cuando lo abres.</p>
<p><strong>Importante:</strong> Ejecuta <code>reset-passwords.mjs</code> antes de enviar estos mensajes.</p>
<table>
  <thead>
    <tr><th>#</th><th>Nombre</th><th>Email (usuario)</th><th>Teléfono</th><th>Contraseña</th><th>Acción</th></tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
</body>
</html>`

  writeFileSync('scripts/whatsapp-links.html', html)
  console.log(`✅ Generado: scripts/whatsapp-links.html (${jugadores.length} jugadores)`)
  console.log(`   Abre el archivo en tu browser y envía 1 a 1.`)
}

main()
