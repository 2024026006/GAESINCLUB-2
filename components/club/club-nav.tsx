'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: '소개', path: '' },
  { label: '게시판', path: '/board' },
  { label: '채팅', path: '/chat' },
  { label: '갤러리', path: '/gallery' },
  { label: '캘린더', path: '/calendar' },
  { label: '회비', path: '/dues' },
  { label: '회원', path: '/members' },
]

export function ClubNav({ clubId, isStaff }: { clubId: string; isStaff: boolean }) {
  const pathname = usePathname()
  const base = `/clubs/${clubId}`

  const items = isStaff ? NAV_ITEMS : NAV_ITEMS.filter((i) => i.path !== '/members')

  return (
    <nav className="border-b mb-6">
      <div className="flex gap-1 overflow-x-auto pb-0">
        {items.map(({ label, path }) => {
          const href = base + path
          const isActive = path === '' ? pathname === base : pathname.startsWith(href)
          return (
            <Link
              key={path}
              href={href}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
