import Link from 'next/link'
import { Users, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Club } from '@/types'

export function ClubCard({ club }: { club: Club & { member_count?: number } }) {
  return (
    <Link href={`/clubs/${club.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{club.name}</CardTitle>
            <Badge variant={club.recruit_status === 'open' ? 'default' : 'secondary'} className="shrink-0 text-xs">
              {club.recruit_status === 'open' ? '모집 중' : '마감'}
            </Badge>
          </div>
          <Badge variant="outline" className="w-fit text-xs">{club.category}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {club.short_desc && (
            <p className="text-sm text-muted-foreground line-clamp-2">{club.short_desc}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {club.member_count !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {club.member_count}명
              </span>
            )}
            {club.founded_year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {club.founded_year}년 창설
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
