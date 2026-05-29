import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MembersView } from '@/components/club/members-view'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MembersPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: myMember } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', id)
    .eq('user_id', user.id)
    .single()

  if (!myMember || !['president', 'staff', 'treasurer'].includes(myMember.role)) {
    return <div className="text-center py-20 text-muted-foreground">운영진만 접근할 수 있습니다.</div>
  }

  const isPresident = myMember.role === 'president'

  const [{ data: members }, { data: requests }] = await Promise.all([
    supabase.from('club_members').select('*, profile:profiles(id, name, student_id, department)').eq('club_id', id),
    supabase.from('join_requests').select('*, profile:profiles(id, name, student_id, department)').eq('club_id', id).eq('status', 'pending'),
  ])

  return (
    <MembersView
      clubId={id}
      userId={user.id}
      members={members ?? []}
      requests={requests ?? []}
      isPresident={isPresident}
    />
  )
}
