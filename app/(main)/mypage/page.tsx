import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MyPageView } from '@/components/mypage/mypage-view'
import type { MemberRole, ActivityLog, Profile } from '@/types'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: clubs }, { data: activityLogs }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('club_members')
      .select('role, club:clubs(id, name, category)')
      .eq('user_id', user.id),
    supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  type ClubEntry = { role: MemberRole; club: { id: string; name: string; category: string } | null }
  const clubList: ClubEntry[] = (clubs ?? []).map((cm) => ({
    role: cm.role as MemberRole,
    club: (Array.isArray(cm.club) ? cm.club[0] : cm.club) as { id: string; name: string; category: string } | null,
  }))

  return (
    <MyPageView
      profile={profile as Profile | null}
      clubs={clubList}
      activityLogs={(activityLogs ?? []) as ActivityLog[]}
      userId={user.id}
    />
  )
}
