import { Badge } from '@/components/ui/badge'
import type { MemberRole } from '@/types'

const ROLE_MAP: Record<MemberRole, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  president: { label: '방장', variant: 'default' },
  staff: { label: '임원', variant: 'secondary' },
  treasurer: { label: '총무', variant: 'outline' },
  member: { label: '부원', variant: 'outline' },
}

export function RoleBadge({ role }: { role: MemberRole }) {
  const { label, variant } = ROLE_MAP[role]
  return <Badge variant={variant}>{label}</Badge>
}
