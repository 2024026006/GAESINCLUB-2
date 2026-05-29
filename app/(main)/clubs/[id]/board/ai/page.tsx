import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AIAssistant } from '@/components/ai/ai-assistant'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AiAssistantPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', id)
    .eq('user_id', user.id)
    .single()

  if (!member || !['president', 'staff', 'treasurer'].includes(member.role)) {
    return <div className="text-center py-20 text-muted-foreground">운영진만 이용할 수 있습니다.</div>
  }

  const { data: club } = await supabase
    .from('clubs')
    .select('name, category')
    .eq('id', id)
    .single()

  return (
    <AIAssistant
      clubId={id}
      clubName={club?.name ?? ''}
      clubCategory={club?.category ?? ''}
      userRole={member.role}
    />
  )
}
