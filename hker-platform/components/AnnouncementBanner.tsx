'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Announcement = { id: number; message: string }

// 放在網站最上方（layout.tsx 裡，navbar 上方）。
// 會即時訂閱 announcements 表的變化，管理員一發新公告，所有已開啟網站的會員畫面都會馬上更新。
export default function AnnouncementBanner() {
  const supabase = createClient()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      const { data } = await supabase
        .from('announcements')
        .select('id, message')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (active) setAnnouncement(data)
    }
    load()

    const channel = supabase
      .channel('announcements-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, load)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!announcement || dismissed) return null

  return (
    <div className="flex items-center justify-between gap-3 bg-hker-gold px-4 py-2 text-sm font-medium text-hker-ink">
      <span>📢 {announcement.message}</span>
      <button onClick={() => setDismissed(true)} className="shrink-0 opacity-70 hover:opacity-100">✕</button>
    </div>
  )
}
