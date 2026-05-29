'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Trash2, Pin } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { Post, Comment } from '@/types'

interface Props {
  post: Post & { author: { id: string; name: string } | null }
  comments: (Comment & { author: { id: string; name: string } | null })[]
  clubId: string
  userId: string
  isStaff: boolean
  isEnrolled: boolean
  initialLiked: boolean
}

export function PostDetail({ post, comments: initialComments, clubId, userId, isStaff, isEnrolled, initialLiked }: Props) {
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [comments, setComments] = useState(initialComments)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleLike = async () => {
    const supabase = createClient()
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', userId)
      setLiked(false)
      setLikeCount((c) => c - 1)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: userId })
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
  }

  const deletePost = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', post.id)
    toast.success('게시글이 삭제되었습니다.')
    router.push(`/clubs/${clubId}/board`)
  }

  const submitComment = async () => {
    if (!commentText.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, author_id: userId, content: commentText })
      .select('*, author:profiles(id, name)')
      .single()

    if (error) {
      toast.error(error.message)
    } else {
      setComments((prev) => [...prev, data])
      setCommentText('')
      await supabase.from('activity_logs').insert({
        user_id: userId, club_id: clubId, type: 'comment', point: 5,
      })
    }
    setSubmitting(false)
  }

  const deleteComment = async (commentId: string) => {
    const supabase = createClient()
    await supabase.from('comments').delete().eq('id', commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  const canEdit = post.author?.id === userId || isStaff

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {post.is_pinned && <Pin className="h-4 w-4 text-amber-600" />}
              <h2 className="text-xl font-bold">{post.title}</h2>
            </div>
            <div className="text-sm text-muted-foreground">
              {post.author?.name ?? '알 수 없음'} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
            </div>
          </div>
          {canEdit && (
            <Button variant="ghost" size="icon" onClick={deletePost}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
        <Separator />
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLike}
            className={liked ? 'text-red-500' : ''}
          >
            <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
            {likeCount}
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold">댓글 {comments.length}개</h3>
        {isEnrolled && (
          <div className="flex gap-2">
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button onClick={submitComment} disabled={submitting || !commentText.trim()}>
              등록
            </Button>
          </div>
        )}
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author?.name ?? '알 수 없음'}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm">{c.content}</p>
              </div>
              {(c.author?.id === userId || isStaff) && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteComment(c.id)}>
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
