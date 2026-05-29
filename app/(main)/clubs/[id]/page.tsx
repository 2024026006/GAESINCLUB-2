import { notFound } from 'next/navigation'
import { Users, Calendar, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { JoinRequestModal } from '@/components/club/join-request-modal'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClubDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: club } = await supabase
    .from('clubs')
    .select('*, member_count:club_members(count)')
    .eq('id', id)
    .neq('status', 'deleted')
    .single()

  if (!club) notFound()

  const memberCount = (club.member_count as unknown as { count: number }[])?.[0]?.count ?? 0

  const { data: { user } } = await supabase.auth.getUser()

  let isMember = false
  let hasPendingRequest = false

  if (user) {
    const { data: member } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', id)
      .eq('user_id', user.id)
      .single()
    isMember = !!member

    if (!isMember) {
      const { data: req } = await supabase
        .from('join_requests')
        .select('id')
        .eq('club_id', id)
        .eq('user_id', user.id)
        .in('status', ['pending', 'on_hold'])
        .single()
      hasPendingRequest = !!req
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{club.category}</Badge>
            <Badge variant={club.recruit_status === 'open' ? 'default' : 'secondary'}>
              {club.recruit_status === 'open' ? '모집 중' : '마감'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {memberCount}명
            </span>
            {club.founded_year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {club.founded_year}년 창설
              </span>
            )}
          </div>
        </div>
        {user && !isMember && !hasPendingRequest && club.recruit_status === 'open' && (
          <JoinRequestModal clubId={id} clubName={club.name} />
        )}
        {hasPendingRequest && (
          <Badge variant="outline">신청 검토 중</Badge>
        )}
        {isMember && (
          <Badge variant="secondary">가입된 동아리</Badge>
        )}
      </div>

      {club.short_desc && (
        <p className="text-muted-foreground">{club.short_desc}</p>
      )}

      {club.description && (
        <div className="prose prose-sm max-w-none">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4" />
            <h2 className="text-base font-semibold m-0">소개</h2>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{club.description}</p>
        </div>
      )}
    </div>
  )
}
