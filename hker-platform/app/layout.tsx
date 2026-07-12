import './globals.css'
import Image from 'next/image'
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

        <nav className="sticky top-0 z-30 border-b border-hker-gold/30 bg-hker-ink/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="HKER" width={36} height={36} className="rounded-full ring-1 ring-hker-gold/60" />
              <span className="text-lg font-bold tracking-wide text-hker-gold-light">HKER News</span>
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link href="/" className="text-stone-300 transition hover:text-hker-gold-light">新聞</Link>
              <Link href="/games" className="text-stone-300 transition hover:text-hker-gold-light">遊戲</Link>
              {user ? (
                <>
                  <span className="hidden text-stone-400 sm:inline">{displayName}</span>
                  <LogoutButton />
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-hker-red px-4 py-1.5 font-bold text-white shadow shadow-hker-red/30 transition hover:bg-hker-red-dark"
                >
                  登入 / 註冊
                </Link>
              )}
            </div>
          </div>
          <div className="gold-divider" />
        </nav>

        <main className="min-h-screen bg-hker-ink">{children}</main>

        <AdminPanel isAdmin={isAdmin} />
      </body>
    </html>
  )
}
