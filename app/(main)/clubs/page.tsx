import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ClubCard } from '@/components/club/club-card'
import { CategoryTabs } from '@/components/club/category-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Club } from '@/types'

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>
}

async function ClubGrid({ category, q }: { category?: string; q?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('clubs')
    .select('*, member_count:club_members(count)')
    .neq('status', 'deleted')
    .order('name')

  if (category && category !== '전체') {
    query = query.eq('category', category)
  }
  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: clubs } = await query

  const list = (clubs ?? []).map((c) => ({
    ...c,
    member_count: (c.member_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as (Club & { member_count: number })[]

  if (list.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        검색 결과가 없습니다.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {list.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  )
}

export default async function ClubsPage({ searchParams }: PageProps) {
  const { category, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">동아리 탐색</h1>
        {user && (
          <Link href="/clubs/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />동아리 개설
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Suspense>
            <CategoryTabs />
          </Suspense>
        </div>
        <form className="flex gap-2">
          <Input
            name="q"
            defaultValue={q}
            placeholder="동아리 검색..."
            className="w-48"
          />
          <Button type="submit" variant="outline" size="sm">검색</Button>
        </form>
      </div>

      <Suspense fallback={<div className="text-center py-10 text-muted-foreground">로딩 중...</div>}>
        <ClubGrid category={category} q={q} />
      </Suspense>
    </div>
  )
}
