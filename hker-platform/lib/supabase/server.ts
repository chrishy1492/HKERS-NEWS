import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 伺服器端使用：讀取 request 的 cookie 來還原登入狀態，
// 讓 Server Component / API Route 抓到的會員資料跟前端顯示的是同一個人。
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 裡呼叫 setAll 有時會失敗（因為它不能寫 cookie），
            // 只要 middleware.ts 有正確刷新 session，這裡可以安全忽略。
          }
        },
      },
    }
  )
}
