'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function logout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <button onClick={logout} className="text-slate-400 hover:text-white">
      登出
    </button>
  )
}
