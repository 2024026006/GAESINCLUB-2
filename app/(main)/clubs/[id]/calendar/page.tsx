import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/calendar/calendar-view'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CalendarPage({ params }: Props) {
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
    return <div className="text-center py-20 text-muted-foreground">동아리 부원만 이용할 수 있습니다.</div>
  }

  const isStaff = ['president', 'staff', 'treasurer'].includes(member.role)

  const { data: events } = await supabase
    .from('events')
    .select('*, votes:event_votes(*)')
    .eq('club_id', id)
    .order('start_at')

  return (
    <CalendarView
      clubId={id}
      userId={user.id}
      events={events ?? []}
      isStaff={isStaff}
    />
  )
}
