'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { DuesIncome, DuesExpense } from '@/types'

interface Props {
  clubId: string
  userId: string
  income: (DuesIncome & { payer: { name: string } | null })[]
  expense: DuesExpense[]
  members: { user_id: string; role: string; profile: { name: string } | null }[]
  isTreasurer: boolean
}

export function DuesView({ clubId, income: initIncome, expense: initExpense, members, isTreasurer }: Props) {
  const [income, setIncome] = useState(initIncome)
  const [expense, setExpense] = useState(initExpense)
  const [incomeForm, setIncomeForm] = useState({ payer_id: '', amount: '', paid_at: '', note: '' })
  const [expenseForm, setExpenseForm] = useState({ item: '', amount: '', spent_at: '', receipt_url: '' })
  const [showIncome, setShowIncome] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [loading, setLoading] = useState(false)

  const totalIncome = income.reduce((s, i) => s + i.amount, 0)
  const totalExpense = expense.reduce((s, e) => s + e.amount, 0)
  const balance = totalIncome - totalExpense

  const paidIds = new Set(income.map((i) => i.payer_id))

  const addIncome = async () => {
    if (!incomeForm.payer_id || !incomeForm.amount || !incomeForm.paid_at) { toast.error('필수 항목을 입력해주세요.'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('dues_income')
      .insert({ club_id: clubId, payer_id: incomeForm.payer_id, amount: parseInt(incomeForm.amount), paid_at: incomeForm.paid_at, note: incomeForm.note || null })
      .select('*, payer:profiles(name)')
      .single()
    if (error) { toast.error(error.message) } else {
      setIncome((prev) => [data, ...prev])
      setShowIncome(false)
      toast.success('입금 내역이 등록되었습니다.')
    }
    setLoading(false)
  }

  const addExpense = async () => {
    if (!expenseForm.item || !expenseForm.amount || !expenseForm.spent_at) { toast.error('필수 항목을 입력해주세요.'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('dues_expense')
      .insert({ club_id: clubId, item: expenseForm.item, amount: parseInt(expenseForm.amount), spent_at: expenseForm.spent_at })
      .select()
      .single()
    if (error) { toast.error(error.message) } else {
      setExpense((prev) => [data, ...prev])
      setShowExpense(false)
      toast.success('지출 내역이 등록되었습니다.')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">총 입금</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">+{totalIncome.toLocaleString()}원</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">총 지출</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">-{totalExpense.toLocaleString()}원</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">잔액</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{balance.toLocaleString()}원</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">납부 현황</TabsTrigger>
          <TabsTrigger value="income">입금 내역</TabsTrigger>
          <TabsTrigger value="expense">지출 내역</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-2 mt-4">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">{m.profile?.name ?? '알 수 없음'}</span>
              <Badge variant={paidIds.has(m.user_id) ? 'default' : 'outline'}>
                {paidIds.has(m.user_id) ? '납부 완료' : '미납'}
              </Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="income" className="space-y-2 mt-4">
          {isTreasurer && (
            <Button size="sm" onClick={() => setShowIncome(true)}><Plus className="h-4 w-4 mr-1" />입금 등록</Button>
          )}
          {income.map((i) => (
            <div key={i.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{i.payer?.name ?? '알 수 없음'}</p>
                {i.note && <p className="text-xs text-muted-foreground">{i.note}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />+{i.amount.toLocaleString()}원
                </p>
                <p className="text-xs text-muted-foreground">{i.paid_at}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="expense" className="space-y-2 mt-4">
          {isTreasurer && (
            <Button size="sm" onClick={() => setShowExpense(true)}><Plus className="h-4 w-4 mr-1" />지출 등록</Button>
          )}
          {expense.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
              <p className="text-sm font-medium">{e.item}</p>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />-{e.amount.toLocaleString()}원
                </p>
                <p className="text-xs text-muted-foreground">{e.spent_at}</p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={showIncome} onOpenChange={setShowIncome}>
        <DialogContent>
          <DialogHeader><DialogTitle>입금 등록</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>납부자 *</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={incomeForm.payer_id} onChange={(e) => setIncomeForm({ ...incomeForm, payer_id: e.target.value })}>
                <option value="">선택</option>
                {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.profile?.name ?? '알 수 없음'}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>금액 *</Label><Input type="number" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} /></div>
            <div className="space-y-1"><Label>납부일 *</Label><Input type="date" value={incomeForm.paid_at} onChange={(e) => setIncomeForm({ ...incomeForm, paid_at: e.target.value })} /></div>
            <div className="space-y-1"><Label>비고</Label><Input value={incomeForm.note} onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncome(false)}>취소</Button>
            <Button onClick={addIncome} disabled={loading}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExpense} onOpenChange={setShowExpense}>
        <DialogContent>
          <DialogHeader><DialogTitle>지출 등록</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>항목 *</Label><Input value={expenseForm.item} onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })} /></div>
            <div className="space-y-1"><Label>금액 *</Label><Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} /></div>
            <div className="space-y-1"><Label>지출일 *</Label><Input type="date" value={expenseForm.spent_at} onChange={(e) => setExpenseForm({ ...expenseForm, spent_at: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpense(false)}>취소</Button>
            <Button onClick={addExpense} disabled={loading}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
