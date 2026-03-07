'use client'

// 登出按鈕（Client Component，需要呼叫瀏覽器端 Supabase auth）
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * 登出按鈕元件
 * 呼叫 signOut() 清除 session，並重整頁面後導向登入頁
 */
export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      登出
    </button>
  )
}
