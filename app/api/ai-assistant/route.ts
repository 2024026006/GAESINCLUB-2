import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_TEMPLATES: Record<string, string> = {
  notice: `당신은 충북대학교 동아리 커뮤니티 앱 '개신클럽'의 AI 도우미입니다.
현재 동아리: {club_name} ({club_category} 분과)
요청자 역할: {user_role}

공지사항 초안을 친근하고 간결한 한국어 문체로 작성해주세요. 마크다운 형식, 최대 500자.`,

  survey: `당신은 충북대학교 동아리 커뮤니티 앱 '개신클럽'의 AI 도우미입니다.
현재 동아리: {club_name} ({club_category} 분과)
요청자 역할: {user_role}

수요조사 문구를 친근하고 간결한 한국어 문체로 작성해주세요. 마크다운 형식, 최대 300자.`,

  dues: `당신은 충북대학교 동아리 커뮤니티 앱 '개신클럽'의 AI 도우미입니다.
현재 동아리: {club_name} ({club_category} 분과)
요청자 역할: {user_role}

회비 납부 안내 메시지를 친근하고 간결한 한국어로 작성해주세요. 최대 200자.`,

  intro: `당신은 충북대학교 동아리 커뮤니티 앱 '개신클럽'의 AI 도우미입니다.
현재 동아리: {club_name} ({club_category} 분과)
요청자 역할: {user_role}

동아리 소개글을 매력적인 한국어로 작성해주세요. 마크다운 형식, 최대 400자.`,
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { feature, clubName, clubCategory, userRole, userMessage } = body

  const template = SYSTEM_TEMPLATES[feature]
  if (!template) {
    return Response.json({ error: 'Invalid feature' }, { status: 400 })
  }

  const systemPrompt = template
    .replace('{club_name}', clubName ?? '')
    .replace('{club_category}', clubCategory ?? '')
    .replace('{user_role}', userRole ?? 'member')

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
