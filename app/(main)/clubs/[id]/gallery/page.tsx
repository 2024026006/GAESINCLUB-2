import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GalleryView } from '@/components/gallery/gallery-view'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GalleryPage({ params }: Props) {
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

  if (!member) {
    return <div className="text-center py-20 text-muted-foreground">동아리 부원만 이용할 수 있습니다.</div>
  }

  const isStaff = ['president', 'staff', 'treasurer'].includes(member.role)

  const [{ data: albums }, { data: items }] = await Promise.all([
    supabase.from('albums').select('*').eq('club_id', id).order('created_at', { ascending: false }),
    supabase.from('gallery_items').select('*').eq('club_id', id).order('created_at', { ascending: false }),
  ])

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <GalleryView
      clubId={id}
      userId={user.id}
      albums={albums ?? []}
      items={items ?? []}
      isStaff={isStaff}
      supabaseUrl={supabaseUrl}
    />
  )
}
