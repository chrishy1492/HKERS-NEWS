'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/games', label: '遊戲', emoji: '🎮' },
  { href: '/fortune', label: '算命風水', emoji: '☯' },
]

const INFO = [
  { href: '/disclaimer', label: '免責聲明', emoji: '📜' },
  { href: '/about', label: '關於我們', emoji: 'ℹ️' },
  { href: '/contact', label: '聯絡方式', emoji: '✉️' },
  { href: '/terms', label: '使用條款', emoji: '📄' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* 手機版：左上角按鈕打開側邊欄 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-16 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-hker-lacquer text-sm text-white shadow-lg ring-1 ring-hker-gold/40 md:hidden"
        aria-label="開啟資料選單"
      >
        印
      </button>

      {/* 桌面版：固定在左側的欄位 */}
      <aside className="fixed left-0 top-[57px] hidden h-[calc(100vh-57px)] w-48 flex-col gap-4 overflow-y-auto border-r border-hker-gold/15 bg-hker-charcoal p-3 md:flex">
        <SearchBox />
        <AccountBox />
        <SidebarSection title="探索" items={NAV} />
        <div className="ridge-divider" />
        <SidebarSection title="網站資料" items={INFO} />
      </aside>

      {/* 手機版：滑出側邊欄 */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex w-56 flex-col gap-4 overflow-y-auto border-r border-hker-gold/20 bg-hker-charcoal p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-hker-gold-light">HKER News</span>
              <button onClick={() => setOpen(false)} className="text-stone-400">✕</button>
            </div>
            <SearchBox onNavigate={() => setOpen(false)} />
            <AccountBox onNavigate={() => setOpen(false)} />
            <SidebarSection title="探索" items={NAV} onNavigate={() => setOpen(false)} />
            <div className="ridge-divider" />
            <SidebarSection title="網站資料" items={INFO} onNavigate={() => setOpen(false)} />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}

// ============================================================
// 【新增】帳戶資訊區塊：顯示登入狀態、姓名、積分，
// 以及進入「個人設定」頁面的連結。
// ============================================================
function AccountBox({ onNavigate }: { onNavigate?: () => void }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ display_name: string | null; points: number; email: string | null } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (active) {
          setProfile(null)
          setLoading(false)
        }
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('display_name, points, email')
        .eq('id', user.id)
        .single()

      if (active) {
        setProfile(data ?? { display_name: null, points: 0, email: user.email ?? null })
        setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  if (loading) return null

  if (!profile) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 rounded bg-hker-lacquer px-3 py-2 text-sm font-bold text-white hover:bg-hker-lacquer-dark"
      >
        登入 / 註冊
      </Link>
    )
  }

  return (
    <Link
      href="/account"
      onClick={onNavigate}
      className="flex flex-col gap-1 rounded border border-hker-gold/15 bg-hker-ink px-3 py-2 transition hover:border-hker-gold/40"
    >
      <span className="truncate text-sm font-bold text-hker-gold-light">
        {profile.display_name || profile.email || '會員'}
      </span>
      <span className="flex items-center justify-between text-xs text-hker-stone">
        <span>積分：{profile.points}</span>
        <span>⚙️ 設定</span>
      </span>
    </Link>
  )
}

function SearchBox({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const [value, setValue] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/')
    onNavigate?.()
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="尋找新聞..."
        className="w-full rounded bg-hker-ink px-2.5 py-1.5 text-xs text-stone-200 outline-none ring-1 ring-hker-gold/15 focus:ring-hker-gold/50"
      />
      <button
        type="submit"
        aria-label="搜尋"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-hker-lacquer text-xs text-white"
      >
        🔍
      </button>
    </form>
  )
}

function SidebarSection({
  title,
  items,
  onNavigate,
}: {
  title: string
  items: { href: string; label: string; emoji: string }[]
  onNavigate?: () => void
}) {
  return (
    <div>
      <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-hker-stone">{title}</p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded px-3 py-2 text-sm text-stone-300 transition hover:bg-hker-ink hover:text-hker-gold-light"
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
