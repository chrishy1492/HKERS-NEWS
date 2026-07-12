'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        // Supabase 對已存在的 email 會回傳明確錯誤，直接顯示給使用者，
        // 避免像舊系統一樣意外建立第二個孤兒帳號
        setMessage(error.message.includes('already registered') ? '這個 Email 已經註冊過了，請改用登入。' : error.message)
      } else {
        setMessage('註冊成功！請檢查信箱完成驗證後即可登入。')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('登入失敗：' + error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-sm p-4 pt-16">
      <div className="mb-6 flex rounded-lg border border-slate-800 p-1">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 rounded py-2 text-sm font-bold ${mode === 'login' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}
        >
          登入
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 rounded py-2 text-sm font-bold ${mode === 'signup' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}
        >
          註冊
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="密碼（至少 6 碼）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-cyan-500 py-2 font-bold text-black hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? '處理中...' : mode === 'login' ? '登入' : '註冊'}
        </button>
      </form>

      {message && <p className="mt-4 text-center text-sm text-amber-400">{message}</p>}
    </div>
  )
}
