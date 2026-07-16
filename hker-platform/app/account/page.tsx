'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [points, setPoints] = useState(0)

  const [nameSaving, setNameSaving] = useState(false)
  const [nameMessage, setNameMessage] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setEmail(user.email ?? '')

      const { data } = await supabase
        .from('profiles')
        .select('display_name, points')
        .eq('id', user.id)
        .single()

      if (data) {
        setDisplayName(data.display_name ?? '')
        setPoints(data.points ?? 0)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setNameSaving(true)
    setNameMessage(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('id', user.id)

    setNameMessage(error ? '更新失敗：' + error.message : '姓名已更新')
    setNameSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPasswordMessage('密碼至少需要 6 個字元')
      return
    }
    setPasswordSaving(true)
    setPasswordMessage(null)

    // Supabase Auth 內建的密碼更新方式，不是寫進 profiles 表，
    // 而是走專門管理帳號密碼的 auth.users 系統。
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setPasswordMessage(error ? '更新失敗：' + error.message : '密碼已更新')
    setPasswordSaving(false)
    setNewPassword('')
  }

  if (loading) {
    return <div className="mx-auto max-w-sm p-4 pt-16 text-sm text-stone-400">載入中...</div>
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 p-4 pt-16">
      <h1 className="font-display text-xl font-bold text-hker-gold-light">個人設定</h1>

      {/* 積分顯示 */}
      <div className="rounded border border-hker-gold/15 bg-hker-charcoal p-4">
        <p className="text-xs text-hker-stone">帳號</p>
        <p className="mb-3 text-sm text-stone-200">{email}</p>
        <p className="text-xs text-hker-stone">目前積分</p>
        <p className="text-2xl font-bold text-hker-gold-light">{points}</p>
      </div>

      {/* 修改姓名 */}
      <form onSubmit={handleSaveName} className="space-y-2 rounded border border-hker-gold/15 bg-hker-charcoal p-4">
        <p className="text-sm font-bold text-stone-200">修改暱稱</p>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="輸入你想顯示的名稱"
          maxLength={30}
          className="w-full rounded bg-hker-ink px-3 py-2 text-sm text-stone-100 outline-none ring-1 ring-hker-gold/10 focus:ring-hker-gold/50"
        />
        <button
          type="submit"
          disabled={nameSaving}
          className="w-full rounded bg-hker-lacquer py-2 text-sm font-bold text-white hover:bg-hker-lacquer-dark disabled:opacity-50"
        >
          {nameSaving ? '儲存中...' : '儲存暱稱'}
        </button>
        {nameMessage && <p className="text-xs text-hker-gold-light">{nameMessage}</p>}
      </form>

      {/* 修改密碼 */}
      <form onSubmit={handleChangePassword} className="space-y-2 rounded border border-hker-gold/15 bg-hker-charcoal p-4">
        <p className="text-sm font-bold text-stone-200">修改密碼</p>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="新密碼（至少 6 碼）"
          minLength={6}
          className="w-full rounded bg-hker-ink px-3 py-2 text-sm text-stone-100 outline-none ring-1 ring-hker-gold/10 focus:ring-hker-gold/50"
        />
        <button
          type="submit"
          disabled={passwordSaving}
          className="w-full rounded bg-hker-lacquer py-2 text-sm font-bold text-white hover:bg-hker-lacquer-dark disabled:opacity-50"
        >
          {passwordSaving ? '更新中...' : '更新密碼'}
        </button>
        {passwordMessage && <p className="text-xs text-hker-gold-light">{passwordMessage}</p>}
      </form>
    </div>
  )
}
