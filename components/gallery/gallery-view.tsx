'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, FolderPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Album, GalleryItem } from '@/types'

interface Props {
  clubId: string
  userId: string
  albums: Album[]
  items: GalleryItem[]
  isStaff: boolean
  supabaseUrl: string
}

const MAX_SIZE: Record<string, number> = { image: 5 * 1024 * 1024, video: 50 * 1024 * 1024, document: 20 * 1024 * 1024 }

export function GalleryView({ clubId, userId, albums: initAlbums, items: initItems, isStaff, supabaseUrl }: Props) {
  const [albums, setAlbums] = useState(initAlbums)
  const [items, setItems] = useState(initItems)
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [showNewAlbum, setShowNewAlbum] = useState(false)
  const [albumTitle, setAlbumTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const visibleItems = selectedAlbum ? items.filter((i) => i.album_id === selectedAlbum) : items

  const thumbUrl = (path: string) =>
    `${supabaseUrl}/storage/v1/object/public/gallery/${path}?width=300&height=300&resize=cover`

  const fullUrl = (path: string) =>
    `${supabaseUrl}/storage/v1/object/public/gallery/${path}`

  const createAlbum = async () => {
    if (!albumTitle.trim()) return
    const supabase = createClient()
    const { data, error } = await supabase.from('albums').insert({ club_id: clubId, title: albumTitle }).select().single()
    if (error) { toast.error(error.message); return }
    setAlbums((prev) => [data, ...prev])
    setShowNewAlbum(false)
    setAlbumTitle('')
    toast.success('앨범이 생성되었습니다.')
  }

  const uploadFile = async (file: File) => {
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document'
    if (file.size > MAX_SIZE[type]) {
      toast.error(`파일 크기가 초과되었습니다. (${type === 'image' ? '5MB' : type === 'video' ? '50MB' : '20MB'} 제한)`)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const path = `${clubId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file)
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return }

    const { data, error } = await supabase
      .from('gallery_items')
      .insert({ club_id: clubId, album_id: selectedAlbum, uploader_id: userId, storage_path: path, type })
      .select()
      .single()
    if (error) { toast.error(error.message) } else { setItems((prev) => [data, ...prev]); toast.success('업로드 완료!') }
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">갤러리</h2>
        <div className="flex gap-2">
          {isStaff && (
            <Button size="sm" variant="outline" onClick={() => setShowNewAlbum(true)}>
              <FolderPlus className="h-4 w-4 mr-1" />앨범 생성
            </Button>
          )}
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-1" />{uploading ? '업로드 중...' : '파일 업로드'}
          </Button>
          <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
        </div>
      </div>

      {/* Album tabs */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={!selectedAlbum ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedAlbum(null)}
        >
          전체 ({items.length})
        </Badge>
        {albums.map((a) => (
          <Badge
            key={a.id}
            variant={selectedAlbum === a.id ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedAlbum(a.id)}
          >
            {a.title} ({items.filter((i) => i.album_id === a.id).length})
          </Badge>
        ))}
      </div>

      {/* Gallery grid */}
      {visibleItems.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">아직 파일이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {visibleItems.map((item) => (
            <div key={item.id} className="aspect-square relative overflow-hidden rounded-lg bg-muted cursor-pointer hover:opacity-90 transition-opacity" onClick={() => item.type === 'image' && setLightbox(item.storage_path)}>
              {item.type === 'image' ? (
                <Image src={thumbUrl(item.storage_path)} alt={item.caption ?? ''} fill className="object-cover" sizes="200px" />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  {item.type === 'video' ? '🎬' : '📄'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="h-6 w-6" />
          </Button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image src={fullUrl(lightbox)} alt="" fill className="object-contain" sizes="100vw" />
          </div>
        </div>
      )}

      {/* New album dialog */}
      <Dialog open={showNewAlbum} onOpenChange={setShowNewAlbum}>
        <DialogContent>
          <DialogHeader><DialogTitle>앨범 생성</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>앨범 이름</Label>
            <Input value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} placeholder="예: 2024 MT" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAlbum(false)}>취소</Button>
            <Button onClick={createAlbum}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
