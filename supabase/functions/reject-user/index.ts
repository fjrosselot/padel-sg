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
