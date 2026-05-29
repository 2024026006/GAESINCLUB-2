import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NotificationBell } from './notification-bell'
import { UserMenu } from './user-menu'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center gap-4 px-4 max-w-7xl mx-auto">
        <Link href="/clubs" className="font-bold text-lg tracking-tight">
          개신클럽
        </Link>
        <div className="flex-1" />
        {user && (
          <div className="flex items-center gap-2">
            <NotificationBell userId={user.id} />
            <UserMenu userId={user.id} />
          </div>
        )}
      </div>
    </header>
  )
}
