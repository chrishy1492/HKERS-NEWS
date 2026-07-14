'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  email: string
  display_name: string | null
  points: number
  is_admin: boolean
}

type DailyStats = {
  new_signups: number
  visitor_count: number
  news_posted_count: number
}

// 這個元件只應該在確認 profile.is_admin === true 的情況下才 render，
// 判斷邏輯建議放在外層頁面（server component）先檢查一次，避免非管理員看到按鈕。
export default function AdminPanel({ isAdmin }: { isAdmin: boolean }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isAdmin) return null

  async function loadData() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)

    const [{ data: profileRows }, { data: statRow }] = await Promise.all([
      supabase.from('profiles').select('id, email, display_name, points, is_admin').order('created_at', { ascending: false }).limit(50),
      supabase.from('daily_stats').select('*').eq('stat_date', today).maybeSingle(),
    ])

    setProfiles(profileRows ?? [])
    setStats(statRow as DailyStats | null)
    setLoading(false)
  }

  useEffect(() => {
    if (open) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function adjustPoints(userId: string, delta: number) {
    const { data: current } = await supabase.from('profiles').select('points').eq('id', userId).single()
    if (!current) return
    await supabase.from('profiles').update({ points: current.points + delta }).eq('id', userId)
    await supabase.from('points_ledger').insert({ user_id: userId, delta, reason: 'admin:adjust' })
    loadData()
  }

  const filtered = profiles.filter(
    (p) => p.email?.includes(search) || p.display_name?.includes(search)
  )

  return (
    <>
      {/* 只有管理員會看到這顆按鈕 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-black shadow-lg hover:bg-amber-400"
      >
        ⚙ 管理後台
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-slate-900 p-6 text-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">管理後台</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">✕ 關閉</button>
            </div>

            {stats && (
              <div className="mb-6 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-800 p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{stats.new_signups}</div>
                  <div className="text-xs text-slate-400">今日新註冊</div>
                </div>
                <div className="rounded-lg bg-slate-800 p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{stats.visitor_count}</div>
                  <div className="text-xs text-slate-400">今日訪客</div>
                </div>
                <div className="rounded-lg bg-slate-800 p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">{stats.news_posted_count}</div>
                  <div className="text-xs text-slate-400">今日新聞發佈數</div>
                </div>
              </div>
            )}

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋會員 email 或暱稱"
              className="mb-3 w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none"
            />

            {loading ? (
              <p className="text-sm text-slate-400">載入中...</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2">Email</th>
                    <th className="py-2">暱稱</th>
                    <th className="py-2">積分</th>
                    <th className="py-2">調整</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800">
                      <td className="py-2">{p.email}</td>
                      <td className="py-2">{p.display_name ?? '-'}</td>
                      <td className="py-2 font-bold text-amber-400">{p.points}</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <button onClick={() => adjustPoints(p.id, 10)} className="rounded bg-emerald-700 px-2 py-1 text-xs hover:bg-emerald-600">+10</button>
                          <button onClick={() => adjustPoints(p.id, -10)} className="rounded bg-red-700 px-2 py-1 text-xs hover:bg-red-600">-10</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  )
}
