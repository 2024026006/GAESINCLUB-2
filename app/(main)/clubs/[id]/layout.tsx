import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClubNav } from '@/components/club/club-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function ClubLayout({ children, params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, status')
    .eq('id', id)
    .neq('status', 'deleted')
    .single()

  if (!club) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let isStaff = false
  if (user) {
    const { data: member } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', id)
      .eq('user_id', user.id)
      .single()
    isStaff = member?.role === 'president' || member?.role === 'staff' || member?.role === 'treasurer'
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">{club.name}</h1>
      </div>
      <ClubNav clubId={id} isStaff={isStaff} />
      {children}
    </div>
  )
}
