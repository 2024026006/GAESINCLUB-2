'use client'

import { useState } from 'react'
import { Copy, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const FEATURES = [
  { value: 'notice', label: '공지 초안 생성', placeholder: '예: MT 공지 써줘 (행사명: 봄 MT, 일시: 5/10 10시, 장소: 속리산)' },
  { value: 'survey', label: '수요조사 문구', placeholder: '예: 체육대회 수요조사 문구 써줘 (행사명: 체육대회, 마감일: 5/5)' },
  { value: 'dues', label: '회비 안내 메시지', placeholder: '예: 미납자에게 보낼 메시지 써줘 (금액: 30,000원, 마감: 5/15)' },
  { value: 'intro', label: '동아리 소개글', placeholder: '예: 소개글 도와줘 (활동 목표: 음악을 통한 친목)' },
] as const

interface Props {
  clubId: string
  clubName: string
  clubCategory: string
  userRole: string
}

export function AIAssistant({ clubName, clubCategory, userRole }: Props) {
  const [feature, setFeature] = useState<string>('notice')
  const [userMessage, setUserMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedFeature = FEATURES.find((f) => f.value === feature)

  const generate = async () => {
    if (!userMessage.trim()) { toast.error('요청 내용을 입력해주세요.'); return }
    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, clubName, clubCategory, userRole, userMessage }),
      })

      if (!res.ok) { toast.error('생성 실패'); setLoading(false); return }

      const reader = res.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setResponse((prev) => prev + decoder.decode(value))
      }
    } catch {
      toast.error('오류가 발생했습니다.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI 동아리 도우미
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>기능 선택</Label>
            <Select value={feature} onValueChange={(v) => { if (v) setFeature(v) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FEATURES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>요청 내용</Label>
            <Textarea
              rows={4}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder={selectedFeature?.placeholder}
            />
          </div>
          <Button onClick={generate} disabled={loading || !userMessage.trim()} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? '생성 중...' : '생성하기'}
          </Button>
        </CardContent>
      </Card>

      {(response || loading) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">생성 결과</CardTitle>
            {response && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { navigator.clipboard.writeText(response); toast.success('복사되었습니다.') }}
              >
                <Copy className="h-4 w-4 mr-1" />복사
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-wrap min-h-[60px]">
              {response || (loading && <span className="text-muted-foreground animate-pulse">생성 중...</span>)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
