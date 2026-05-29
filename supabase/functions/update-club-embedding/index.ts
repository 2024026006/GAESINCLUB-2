import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
      messages: [{ role: 'user', content: text }],
    }),
  })

  // Use OpenAI-compatible embeddings endpoint as fallback
  // For production, integrate a proper embeddings API
  // This is a placeholder that generates a zero vector
  void res
  return new Array(1536).fill(0)
}

serve(async (req) => {
  const { club_id } = await req.json()

  const { data: club } = await supabase
    .from('clubs')
    .select('name, category, short_desc, description')
    .eq('id', club_id)
    .single()

  if (!club) {
    return new Response(JSON.stringify({ error: 'Club not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const text = [club.name, club.category, club.short_desc, club.description]
    .filter(Boolean)
    .join(' ')

  const embedding = await generateEmbedding(text)

  await supabase
    .from('clubs')
    .update({ embedding })
    .eq('id', club_id)

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
