import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const payload = await req.json()
  const email: string = payload?.record?.email ?? ''

  if (!email.endsWith('@chungbuk.ac.kr')) {
    return new Response(
      JSON.stringify({ error: '충북대학교 이메일(@chungbuk.ac.kr)만 가입 가능합니다.' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
