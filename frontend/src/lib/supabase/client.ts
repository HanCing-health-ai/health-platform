import { createBrowserClient } from '@supabase/ssr'

/**
 * 建立前端（瀏覽器端）Supabase 客戶端
 * 用於客戶端元件（Client Components）中的資料操作
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
