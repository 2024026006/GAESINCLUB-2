'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const CATEGORIES = ['전체', '교양', '학술', '문화', '봉사', '체육', '종교'] as const

export function CategoryTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? '전체'

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '전체') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs value={current} onValueChange={handleChange}>
      <TabsList className="flex flex-wrap h-auto gap-1">
        {CATEGORIES.map((cat) => (
          <TabsTrigger key={cat} value={cat} className="text-sm">
            {cat}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
