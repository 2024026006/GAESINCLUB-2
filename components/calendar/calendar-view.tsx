'use client'

import { useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Event, EventVote, VoteType } from '@/types'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ko }),
  getDay,
  locales: { ko },
})

interface Props {
  clubId: string
  userId: string
  events: (Event & { votes: EventVote[] })[]
  isStaff: boolean
}

export function CalendarView({ clubId, userId, events: initialEvents, isStaff }: Props) {
  const [events, setEvents] = useState(initialEvents)
  const [selectedEvent, setSelectedEvent] = useState<(Event & { votes: EventVote[] }) | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', start_at: '', end_at: '', location: '' })
  // ko locale for date-fns
  const [loading, setLoading] = useState(false)

  const calEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: new Date(e.start_at),
    end: new Date(e.end_at),
    resource: e,
  }))

  const createEvent = async () => {
    if (!form.title || !form.start_at || !form.end_at) { toast.error('필수 항목을 입력해주세요.'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .insert({ club_id: clubId, title: form.title, description: form.description || null, start_at: form.start_at, end_at: form.end_at, location: form.location || null })
      .select('*, votes:event_votes(*)')
      .single()
    if (error) { toast.error(error.message) } else {
      setEvents((prev) => [...prev, data])
      setShowNewForm(false)
      setForm({ title: '', description: '', start_at: '', end_at: '', location: '' })
      toast.success('행사가 등록되었습니다.')
    }
    setLoading(false)
  }

  const vote = async (eventId: string, voteType: VoteType) => {
    const supabase = createClient()
    await supabase.from('event_votes').upsert({ event_id: eventId, user_id: userId, vote: voteType })
    setEvents((prev) => prev.map((e) => {
      if (e.id !== eventId) return e
      const filtered = e.votes.filter((v) => v.user_id !== userId)
      return { ...e, votes: [...filtered, { event_id: eventId, user_id: userId, vote: voteType }] }
    }))
    if (selectedEvent?.id === eventId) {
      setSelectedEvent((prev) => {
        if (!prev) return null
        const filtered = prev.votes.filter((v) => v.user_id !== userId)
        return { ...prev, votes: [...filtered, { event_id: eventId, user_id: userId, vote: voteType }] }
      })
    }
    toast.success('투표가 완료되었습니다.')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">행사 캘린더</h2>
        {isStaff && (
          <Button size="sm" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-1" />행사 등록
          </Button>
        )}
      </div>

      <div className="h-[600px]">
        <Calendar
          localizer={localizer}
          events={calEvents}
          startAccessor="start"
          endAccessor="end"
          culture="ko"
          messages={{ next: '다음', previous: '이전', today: '오늘', month: '월', week: '주', day: '일', agenda: '목록', noEventsInRange: '행사가 없습니다.' }}
          onSelectEvent={(e) => setSelectedEvent(e.resource)}
        />
      </div>

      {/* Event detail dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">일시: </span>
                {new Date(selectedEvent.start_at).toLocaleString('ko-KR')} ~ {new Date(selectedEvent.end_at).toLocaleString('ko-KR')}
              </div>
              {selectedEvent.location && <div><span className="font-medium">장소: </span>{selectedEvent.location}</div>}
              {selectedEvent.description && <p className="text-muted-foreground">{selectedEvent.description}</p>}

              <div className="space-y-2">
                <p className="font-medium">참석 투표</p>
                <div className="flex gap-2">
                  {(['attend', 'absent', 'undecided'] as VoteType[]).map((v) => {
                    const labels = { attend: '참석', absent: '불참', undecided: '미정' }
                    const count = selectedEvent.votes.filter((vt) => vt.vote === v).length
                    const myVote = selectedEvent.votes.find((vt) => vt.user_id === userId)?.vote
                    return (
                      <Button
                        key={v}
                        size="sm"
                        variant={myVote === v ? 'default' : 'outline'}
                        onClick={() => vote(selectedEvent.id, v)}
                      >
                        {labels[v]} {count}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New event dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>행사 등록</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>제목 *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>시작 *</Label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>종료 *</Label>
                <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>장소</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>설명</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewForm(false)}>취소</Button>
            <Button onClick={createEvent} disabled={loading}>{loading ? '등록 중...' : '등록'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
