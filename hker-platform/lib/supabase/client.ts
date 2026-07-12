import { createBrowserClient } from '@supabase/ssr'

// 瀏覽器端使用：確保 session 存在 cookie 而非 localStorage，
// 這樣手機瀏覽器與桌面瀏覽器之間才有機會透過同一組 cookie/token 機制保持登入。
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
