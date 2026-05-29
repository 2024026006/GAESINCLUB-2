'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Message } from '@/types'

interface Props {
  channel: string
  userId: string
  userName: string
  initialMessages: (Message & { sender: { id: string; name: string } | null })[]
}

export function ChatRoom({ channel, userId, userName, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [text, setText] = useState('')
  const [presenceCount, setPresenceCount] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()

    const rt = supabase.channel(`realtime:${channel}`, {
      config: { presence: { key: userId } },
    })

    rt.on('broadcast', { event: 'message' }, ({ payload }) => {
      setMessages((prev) => [...prev, payload as Message & { sender: { id: string; name: string } | null }])
    })

    rt.on('presence', { event: 'sync' }, () => {
      const state = rt.presenceState()
      setPresenceCount(Object.keys(state).length)
    })

    rt.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await rt.track({ user_id: userId, name: userName })
      }
    })

    return () => { supabase.removeChannel(rt) }
  }, [channel, userId, userName])

  const sendMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed) return

    const supabase = createClient()
    const optimistic = {
      id: crypto.randomUUID(),
      channel,
      sender_id: userId,
      content: trimmed,
      image_url: null,
      created_at: new Date().toISOString(),
      sender: { id: userId, name: userName },
    }

    const rt = supabase.channel(`realtime:${channel}`)
    await rt.send({ type: 'broadcast', event: 'message', payload: optimistic })

    await supabase.from('messages').insert({
      channel,
      sender_id: userId,
      content: trimmed,
    })

    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      <div className="text-xs text-muted-foreground mb-2">
        지금 {presenceCount}명이 보는 중
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMe && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {msg.sender?.name ?? '알 수 없음'}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력..."
          className="flex-1"
        />
        <Button size="icon" onClick={sendMessage} disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
