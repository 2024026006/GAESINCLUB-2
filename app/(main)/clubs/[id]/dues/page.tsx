import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DuesView } from '@/components/dues/dues-view'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DuesPage({ params }: Props) {
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

  const isTreasurer = ['president', 'treasurer'].includes(member.role)

  const [{ data: income }, { data: expense }, { data: members }] = await Promise.all([
    supabase.from('dues_income').select('*, payer:profiles(name)').eq('club_id', id).order('paid_at', { ascending: false }),
    supabase.from('dues_expense').select('*').eq('club_id', id).order('spent_at', { ascending: false }),
    supabase.from('club_members').select('user_id, role, profile:profiles(name)').eq('club_id', id),
  ])

  const membersList = (members ?? []).map((m) => ({
    user_id: m.user_id as string,
    role: m.role as string,
    profile: Array.isArray(m.profile) ? (m.profile[0] as { name: string } | null) ?? null : m.profile as { name: string } | null,
  }))

  return (
    <DuesView
      clubId={id}
      userId={user.id}
      income={income ?? []}
      expense={expense ?? []}
      members={membersList}
      isTreasurer={isTreasurer}
    />
  )
}
