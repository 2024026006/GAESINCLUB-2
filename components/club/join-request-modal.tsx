'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
  clubId: string
  clubName: string
}

export function JoinRequestModal({ clubId, clubName }: Props) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('로그인이 필요합니다.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('join_requests').insert({
      club_id: clubId,
      user_id: user.id,
      message: message || null,
    })

    if (error) {
      if (error.code === '23505') {
        toast.error('이미 가입 신청한 동아리입니다.')
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('가입 신청이 완료되었습니다!')
      setOpen(false)
      setMessage('')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button>가입 신청</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{clubName} 가입 신청</DialogTitle>
          <DialogDescription>운영진이 신청을 검토한 후 연락드립니다.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>지원 동기 (선택)</Label>
            <Textarea
              placeholder="동아리에 지원하는 동기를 자유롭게 작성하세요."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '신청 중...' : '신청하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
