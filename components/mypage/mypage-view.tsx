'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RoleBadge } from '@/components/club/role-badge'
import type { Profile, ActivityLog, MemberRole } from '@/types'

const ACTIVITY_LABELS: Record<string, string> = {
  attendance: '출석',
  post: '게시글 작성',
  comment: '댓글 작성',
  event: '행사 참여',
  vote: '투표 참여',
}

interface Props {
  profile: Profile | null
  clubs: { role: MemberRole; club: { id: string; name: string; category: string } | null }[]
  activityLogs: ActivityLog[]
  userId: string
}

export function MyPageView({ profile, clubs, activityLogs, userId }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
  })
  const [loading, setLoading] = useState(false)

  const saveProfile = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ name: form.name, phone: form.phone || null })
      .eq('id', userId)

    if (error) { toast.error(error.message) } else {
      toast.success('프로필이 저장되었습니다.')
      setEditing(false)
      router.refresh()
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const enrollmentLabels: Record<string, string> = {
    enrolled: '재학',
    leave: '휴학',
    graduated: '졸업',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>프로필</CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>수정</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>이름</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>연락처</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveProfile} disabled={loading}>저장</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">이름</span><p className="font-medium">{profile?.name ?? '-'}</p></div>
              <div><span className="text-muted-foreground">학번</span><p className="font-medium">{profile?.student_id ?? '-'}</p></div>
              <div><span className="text-muted-foreground">단과대학</span><p className="font-medium">{profile?.college ?? '-'}</p></div>
              <div><span className="text-muted-foreground">학과</span><p className="font-medium">{profile?.department ?? '-'}</p></div>
              <div><span className="text-muted-foreground">재학 상태</span><p className="font-medium">{enrollmentLabels[profile?.enrollment_status ?? ''] ?? '-'}</p></div>
              <div><span className="text-muted-foreground">연락처</span><p className="font-medium">{profile?.phone ?? '-'}</p></div>
              <div className="col-span-2"><span className="text-muted-foreground">포인트</span><p className="font-bold text-primary">{profile?.point ?? 0}P</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>소속 동아리 ({clubs.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {clubs.length === 0 && <p className="text-sm text-muted-foreground">소속된 동아리가 없습니다.</p>}
          {clubs.map((cm) => cm.club && (
            <Link key={cm.club.id} href={`/clubs/${cm.club.id}`}>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{cm.club.name}</p>
                  <p className="text-xs text-muted-foreground">{cm.club.category}</p>
                </div>
                <RoleBadge role={cm.role} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>최근 활동</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {activityLogs.length === 0 && <p className="text-sm text-muted-foreground">활동 내역이 없습니다.</p>}
          {activityLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm">{ACTIVITY_LABELS[log.type] ?? log.type}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">+{log.point}P</Badge>
                <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={handleLogout}>로그아웃</Button>
      </div>
    </div>
  )
}
