'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewPostPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { router.push('/login'); return }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ club_id: clubId, author_id: user.id, title, content, is_pinned: isPinned })
      .select()
      .single()

    if (error) { toast.error(error.message); setLoading(false); return }

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      club_id: clubId,
      type: 'post',
      point: 10,
    })

    toast.success('게시글이 등록되었습니다.')
    router.push(`/clubs/${clubId}/board/${post.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle>게시글 작성</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea id="content" rows={10} value={content} onChange={(e) => setContent(e.target.value)} required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pinned" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="h-4 w-4" />
              <Label htmlFor="pinned" className="cursor-pointer">중요 공지로 고정</Label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? '등록 중...' : '등록'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
