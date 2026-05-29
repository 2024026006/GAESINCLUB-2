import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Pin, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BoardPage({ params }: Props) {
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
    return (
      <div className="text-center py-20 text-muted-foreground">
        동아리 부원만 게시판을 이용할 수 있습니다.
      </div>
    )
  }

  const isStaff = ['president', 'staff', 'treasurer'].includes(member.role)

  const { data: posts } = await supabase
    .from('posts')
    .select('*, author:profiles(name)')
    .eq('club_id', id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: reads } = await supabase
    .from('post_reads')
    .select('post_id')
    .eq('user_id', user.id)

  const readSet = new Set((reads ?? []).map((r) => r.post_id))

  const pinned = (posts ?? []).filter((p) => p.is_pinned)
  const normal = (posts ?? []).filter((p) => !p.is_pinned)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">게시판</h2>
        {isStaff && (
          <Link href={`/clubs/${id}/board/new`}>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />글쓰기</Button>
          </Link>
        )}
      </div>

      {pinned.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Pin className="h-4 w-4" /> 고정 공지
          </div>
          {pinned.map((post) => (
            <PostRow key={post.id} post={post} clubId={id} isRead={readSet.has(post.id)} pinned />
          ))}
          <Separator />
        </div>
      )}

      <div className="space-y-2">
        {normal.length === 0 && pinned.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">아직 게시글이 없습니다.</div>
        )}
        {normal.map((post) => (
          <PostRow key={post.id} post={post} clubId={id} isRead={readSet.has(post.id)} />
        ))}
      </div>
    </div>
  )
}

function PostRow({
  post,
  clubId,
  isRead,
  pinned,
}: {
  post: { id: string; title: string; author: { name: string } | null; created_at: string; like_count: number }
  clubId: string
  isRead: boolean
  pinned?: boolean
}) {
  return (
    <Link href={`/clubs/${clubId}/board/${post.id}`}>
      <Card className={`hover:shadow-sm transition-shadow cursor-pointer ${pinned ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
        <CardContent className="flex items-center gap-3 py-3 px-4">
          {!isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
          {pinned && <Pin className="h-4 w-4 text-amber-600 shrink-0" />}
          <span className="flex-1 font-medium text-sm truncate">{post.title}</span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            {post.like_count > 0 && <span>❤️ {post.like_count}</span>}
            <span>{post.author?.name ?? '알 수 없음'}</span>
            <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
