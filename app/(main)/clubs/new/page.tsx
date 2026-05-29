'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CATEGORIES = ['교양', '학술', '문화', '봉사', '체육', '종교'] as const

export default function NewClubPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    category: '',
    short_desc: '',
    description: '',
    recruit_status: 'open',
    founded_year: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.category) {
      toast.error('동아리 이름과 분야는 필수입니다.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    const { data: club, error } = await supabase
      .from('clubs')
      .insert({
        name: form.name,
        category: form.category,
        short_desc: form.short_desc || null,
        description: form.description || null,
        recruit_status: form.recruit_status,
        founded_year: form.founded_year ? parseInt(form.founded_year) : null,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    await supabase.from('club_members').insert({
      club_id: club.id,
      user_id: user.id,
      role: 'president',
    })

    toast.success('동아리가 개설되었습니다!')
    router.push(`/clubs/${club.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>동아리 개설</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">동아리 이름 *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>분과 *</Label>
              <Select onValueChange={(v) => v && setForm({ ...form, category: v })} value={form.category}>
                <SelectTrigger><SelectValue placeholder="분과 선택" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_desc">한 줄 소개</Label>
              <Input id="short_desc" maxLength={100} value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">상세 소개</Label>
              <Textarea id="description" rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>모집 상태</Label>
                <Select onValueChange={(v) => v && setForm({ ...form, recruit_status: v })} value={form.recruit_status}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">모집 중</SelectItem>
                    <SelectItem value="closed">마감</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="founded_year">창설연도</Label>
                <Input id="founded_year" type="number" min="1900" max="2100" value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '개설 중...' : '동아리 개설'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
