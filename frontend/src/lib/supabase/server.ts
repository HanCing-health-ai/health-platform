import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 建立伺服器端 Supabase 客戶端
 * 用於 Server Components、Route Handlers、Server Actions
 */
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
            // Server Component 中呼叫 setAll 可忽略此錯誤
          }
        },
      },
    }
  )
}
