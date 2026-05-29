import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface NotificationPayload {
  type: string
  user_ids: string[]
  payload: Record<string, unknown>
  email?: {
    subject: string
    html: string
  }
}

serve(async (req) => {
  const body: NotificationPayload = await req.json()
  const { type, user_ids, payload, email } = body

  // Insert in-app notifications
  if (user_ids?.length) {
    const notifications = user_ids.map((user_id) => ({
      user_id,
      type,
      payload,
    }))
    await supabase.from('notifications').insert(notifications)

    // Send emails via Resend
    if (email && RESEND_API_KEY) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('id', user_ids)

      if (profiles?.length) {
        const { data: users } = await supabase.auth.admin.listUsers()
        const emailMap = Object.fromEntries(
          (users?.users ?? []).map((u) => [u.id, u.email])
        )

        await Promise.allSettled(
          profiles.map(async (p) => {
            const to = emailMap[p.id]
            if (!to) return
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: '개신클럽 <noreply@gaesinclub.com>',
                to,
                subject: email.subject,
                html: email.html,
              }),
            })
          })
        )
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
