'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  newsId: number
  title: string
  url: string
  initialLikeCount: number
  currentUserId: string | null
}

export default function NewsShareLike({ newsId, title, url, initialLikeCount, currentUserId }: Props) {
  const supabase = createClient()
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)

  async function toggleLike() {
    if (!currentUserId) {
      alert('請先登入才能按讚')
      return
    }
    if (liked) {
      await supabase.from('news_likes').delete().eq('news_id', newsId).eq('user_id', currentUserId)
      setLikeCount((c) => c - 1)
    } else {
      await supabase.from('news_likes').insert({ news_id: newsId, user_id: currentUserId })
      setLikeCount((c) => c + 1)
    }
    setLiked(!liked)
  }

  async function share() {
    const shareData = { title, url }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // 使用者取消分享，不做任何事
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    try {
      await supabase.rpc('increment_share_count', { news_id_input: newsId })
    } catch {}
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        onClick={toggleLike}
        className={`flex items-center gap-1 rounded-full px-3 py-1 transition ${
          liked ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        }`}
      >
        {liked ? '❤️' : '🤍'} {likeCount}
      </button>
      <button
        onClick={share}
        className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-slate-300 hover:bg-slate-700"
      >
        🔗 {copied ? '已複製連結' : '分享'}
      </button>
    </div>
  )
}
