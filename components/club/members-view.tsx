'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RoleBadge } from './role-badge'
import type { MemberRole } from '@/types'

interface Member {
  id: string
  user_id: string
  role: MemberRole
  profile: { id: string; name: string | null; student_id: string | null; department: string | null } | null
}

interface Request {
  id: string
  user_id: string
  message: string | null
  status: string
  profile: { id: string; name: string | null; student_id: string | null; department: string | null } | null
}

interface Props {
  clubId: string
  userId: string
  members: Member[]
  requests: Request[]
  isPresident: boolean
}

export function MembersView({ clubId, userId, members: initMembers, requests: initRequests, isPresident }: Props) {
  const [members, setMembers] = useState(initMembers)
  const [requests, setRequests] = useState(initRequests)

  const handleRequest = async (reqId: string, userId: string, action: 'approved' | 'rejected' | 'on_hold') => {
    const supabase = createClient()
    await supabase.from('join_requests').update({ status: action }).eq('id', reqId)

    if (action === 'approved') {
      await supabase.from('club_members').insert({ club_id: clubId, user_id: userId, role: 'member' })
      toast.success('가입을 승인했습니다.')
    } else {
      toast.success(action === 'rejected' ? '가입을 거절했습니다.' : '보류 처리했습니다.')
    }

    setRequests((prev) => prev.filter((r) => r.id !== reqId))
  }

  const changeRole = async (memberId: string, role: MemberRole) => {
    const supabase = createClient()
    await supabase.from('club_members').update({ role }).eq('id', memberId)
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m))
    toast.success('역할이 변경되었습니다.')
  }

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (!confirm('정말 강제 퇴출하시겠습니까?')) return
    const supabase = createClient()
    await supabase.from('club_members').delete().eq('id', memberId)
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    toast.success('부원이 퇴출되었습니다.')
    void memberUserId
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="requests">가입 신청 {requests.length > 0 && `(${requests.length})`}</TabsTrigger>
          <TabsTrigger value="members">현재 부원 ({members.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-3 mt-4">
          {requests.length === 0 && <p className="text-center py-10 text-muted-foreground">대기 중인 신청이 없습니다.</p>}
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{req.profile?.name ?? '알 수 없음'}</p>
                    <p className="text-xs text-muted-foreground">{req.profile?.student_id} · {req.profile?.department}</p>
                    {req.message && <p className="text-xs mt-1 text-muted-foreground">{req.message}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleRequest(req.id, req.user_id, 'approved')}>승인</Button>
                    <Button size="sm" variant="outline" onClick={() => handleRequest(req.id, req.user_id, 'on_hold')}>보류</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRequest(req.id, req.user_id, 'rejected')}>거절</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="members" className="space-y-3 mt-4">
          {members.map((m) => (
            <Card key={m.id}>
              <CardContent className="py-3 px-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm">{m.profile?.name ?? '알 수 없음'}</p>
                  <p className="text-xs text-muted-foreground">{m.profile?.student_id} · {m.profile?.department}</p>
                </div>
                <RoleBadge role={m.role} />
                {isPresident && m.user_id !== userId && (
                  <div className="flex items-center gap-2">
                    <Select value={m.role} onValueChange={(v) => v && changeRole(m.id, v as MemberRole)}>
                      <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="president">방장</SelectItem>
                        <SelectItem value="staff">임원</SelectItem>
                        <SelectItem value="treasurer">총무</SelectItem>
                        <SelectItem value="member">부원</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="destructive" onClick={() => removeMember(m.id, m.user_id)}>퇴출</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
