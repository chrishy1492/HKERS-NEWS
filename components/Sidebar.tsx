'use client'

import { useState } from 'react'
import Link from 'next/link'

const LINKS = [
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
        className="fixed left-3 top-16 z-20 rounded-full bg-hker-charcoal p-2 text-hker-gold-light shadow ring-1 ring-hker-gold/30 md:hidden"
        aria-label="開啟資料選單"
      >
        ☰
      </button>

      {/* 桌面版：固定在左側的欄位 */}
      <aside className="fixed left-0 top-[57px] hidden h-[calc(100vh-57px)] w-48 flex-col gap-1 border-r border-hker-gold/15 bg-hker-ink p-3 md:flex">
        <SidebarLinks />
      </aside>

      {/* 手機版：滑出側邊欄 */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-56 flex-col gap-1 border-r border-hker-gold/20 bg-hker-ink p-3 flex">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-hker-gold-light">網站資料</span>
              <button onClick={() => setOpen(false)} className="text-stone-400">✕</button>
            </div>
            <SidebarLinks onNavigate={() => setOpen(false)} />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-stone-300 transition hover:bg-hker-charcoal hover:text-hker-gold-light"
        >
          <span>{link.emoji}</span>
          <span>{link.label}</span>
        </Link>
      ))}
    </>
  )
}
