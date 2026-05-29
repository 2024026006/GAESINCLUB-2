import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostDetail } from '@/components/board/post-detail'

interface Props {
  params: Promise<{ id: string; postId: string }>
}

export default async function PostDetailPage({ params }: Props) {
  const { id, postId } = await params
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
    return <div className="text-center py-20 text-muted-foreground">접근 권한이 없습니다.</div>
  }

  const { data: post } = await supabase
    .from('posts')
    .select('*, author:profiles(id, name)')
    .eq('id', postId)
    .eq('club_id', id)
    .single()

  if (!post) notFound()

  // Mark as read
  await supabase
    .from('post_reads')
    .upsert({ post_id: postId, user_id: user.id })

  const { data: liked } = await supabase
    .from('likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  const { data: comments } = await supabase
    .from('comments')
    .select('*, author:profiles(id, name)')
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at')

  const isStaff = ['president', 'staff', 'treasurer'].includes(member.role)
  const isEnrolled = true // Checked via RLS

  return (
    <PostDetail
      post={post}
      comments={comments ?? []}
      clubId={id}
      userId={user.id}
      isStaff={isStaff}
      isEnrolled={isEnrolled}
      initialLiked={!!liked}
    />
  )
}
