'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COLLEGES: Record<string, string[]> = {
  인문대학: ['국어국문학과', '영어영문학과', '프랑스언어문화학과', '철학과', '고고미술사학과', '인문학자율전공학부', '중어중문학과', '독일언어문화학과', '러시아언어문화학과', '사학과', '글로벌K컬처학과'],
  사회과학대학: ['사회학과', '행정학과', '경제학과', '심리학과', '정치외교학과'],
  자연과학대학: ['수학과', '물리학과', '생물학과', '생화학과', '지구환경과학과', '정보통계학과', '화학과', '미생물학과', '천문우주학과'],
  경영대학: ['경영학부', '경영정보학과', '경영학자율전공학부', '국제경영학과'],
  공과대학: ['토목공학부', '화학공학과', '건축공학과', '환경공학과', '도시공학과', '테크노산업공학과', '기계공학부', '신소재공학과', '안전공학과', '공업화학과', '건축학과'],
  전자정보대학: ['전기공학부', '정보통신공학부', '소프트웨어학부', '반도체공학부', '전자공학과', '컴퓨터공학과', '지능로봇공학과'],
  농업생명환경대학: ['산림학과', '바이오시스템공학과', '농업경제학과', '환경생명화학과', '식품생명공학과', '원예과학과', '지역건설공학과', '목재종이과학과', '식물자원학과', '축산학과', '특용식물학과', '식물의학과'],
  사범대학: ['교육학과', '영어교육과', '지리교육과', '윤리교육과', '화학교육과', '지구과학교육과', '체육교육과', '국어교육과', '역사교육과', '사회교육과', '물리교육과', '생물교육과', '수학교육과'],
  생활과학대학: ['식품영양학과', '의류학과', '소비자학과', '아동복지학과', '주거환경학과'],
  수의과대학: ['수의예과', '수의학과'],
  약학대학: ['약학과', '제약학과'],
  의과대학: ['의예과', '의학과'],
  간호대학: ['간호학과'],
  창의융합대학: ['자율전공학부', '바이오헬스학부'],
  예술학과군: ['미술학과', '디자인학과'],
}

export default function SignupCompletePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    student_id: '',
    college: '',
    department: '',
    enrollment_status: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)

  const departments = form.college ? COLLEGES[form.college] ?? [] : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.student_id || !form.college || !form.department || !form.enrollment_status) {
      toast.error('모든 필수 항목을 입력해주세요.')
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

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: form.name,
        student_id: form.student_id,
        college: form.college,
        department: form.department,
        enrollment_status: form.enrollment_status,
        phone: form.phone || null,
      })

    if (error) {
      if (error.code === '23505') {
        toast.error('이미 사용 중인 학번입니다.')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    toast.success('회원가입이 완료되었습니다!')
    router.push('/clubs')
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>추가 정보 입력</CardTitle>
        <CardDescription>동아리 활동에 필요한 정보를 입력해주세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student_id">학번 *</Label>
            <Input id="student_id" placeholder="2024000000" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>단과대학 *</Label>
            <Select onValueChange={(v) => v && setForm({ ...form, college: v, department: '' })} value={form.college}>
              <SelectTrigger><SelectValue placeholder="단과대학 선택" /></SelectTrigger>
              <SelectContent>
                {Object.keys(COLLEGES).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>학과 *</Label>
            <Select onValueChange={(v) => v && setForm({ ...form, department: v })} value={form.department} disabled={!form.college}>
              <SelectTrigger><SelectValue placeholder="학과 선택" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>재학 상태 *</Label>
            <Select onValueChange={(v) => v && setForm({ ...form, enrollment_status: v })} value={form.enrollment_status}>
              <SelectTrigger><SelectValue placeholder="재학 상태 선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="enrolled">재학</SelectItem>
                <SelectItem value="leave">휴학</SelectItem>
                <SelectItem value="graduated">졸업</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">연락처</Label>
            <Input id="phone" type="tel" placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '저장 중...' : '완료'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
