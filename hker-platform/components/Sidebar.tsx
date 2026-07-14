'use client'

import { useState } from 'react'
import Link from 'next/link'

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

      {/* 桌面版：固定在左側的欄位，印章紅底風格 */}
      <aside className="fixed left-0 top-[57px] hidden h-[calc(100vh-57px)] w-48 flex-col gap-4 border-r border-hker-gold/15 bg-hker-charcoal p-3 md:flex">
        <SidebarSection title="探索" items={NAV} />
        <div className="ridge-divider" />
        <SidebarSection title="網站資料" items={INFO} />
      </aside>

      {/* 手機版：滑出側邊欄 */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex w-56 flex-col gap-4 border-r border-hker-gold/20 bg-hker-charcoal p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-hker-gold-light">HKER News</span>
              <button onClick={() => setOpen(false)} className="text-stone-400">✕</button>
            </div>
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
