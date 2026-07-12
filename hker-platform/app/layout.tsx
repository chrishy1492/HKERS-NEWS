import './globals.css'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import AdminPanel from '@/components/AdminPanel'
import LogoutButton from '@/components/LogoutButton'

export const metadata = {
  title: 'HKER News',
  description: 'HKER 社群新聞與娛樂平台',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let displayName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, display_name')
      .eq('id', user.id)
      .maybeSingle()
    isAdmin = profile?.is_admin ?? false
    displayName = profile?.display_name ?? user.email ?? null
  }

  return (
    <html lang="zh-Hant">
      <body>
        <AnnouncementBanner />

        <nav className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <Link href="/" className="text-lg font-bold text-cyan-400">HKER News</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="hover:text-cyan-400">新聞</Link>
            <Link href="/games" className="hover:text-cyan-400">遊戲</Link>
            {user ? (
              <>
                <span className="text-slate-400">{displayName}</span>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="rounded bg-cyan-500 px-3 py-1 font-bold text-black hover:bg-cyan-400">登入 / 註冊</Link>
            )}
          </div>
        </nav>

        <main className="min-h-screen">{children}</main>

        <AdminPanel isAdmin={isAdmin} />
      </body>
    </html>
  )
}
