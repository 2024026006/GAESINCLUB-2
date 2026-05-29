import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatRoom } from '@/components/chat/chat-room'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return <div className="text-center py-20 text-muted-foreground">동아리 부원만 채팅을 이용할 수 있습니다.</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*, sender:profiles(id, name)')
    .eq('channel', `club:${id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <ChatRoom
      channel={`club:${id}`}
      userId={user.id}
      userName={profile?.name ?? '익명'}
      initialMessages={(initialMessages ?? []).reverse()}
    />
  )
}
