// Supabase Auth 回調路由
// 處理 Email 驗證連結點擊後的 code 交換流程
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /auth/callback
 * Supabase 驗證信點擊後導向此路由，將 code 換成 session 後跳轉 Dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 允許自訂驗證後的跳轉目的地，預設為 /dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // code 不存在或交換失敗，導回登入頁並帶錯誤提示
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
