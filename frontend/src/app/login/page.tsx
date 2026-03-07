'use client'

// 登入 / 註冊頁面（Client Component，需要瀏覽器端互動）
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  // 表單模式：login = 登入，register = 註冊
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * 切換表單模式時清除訊息與輸入
   */
  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setError(null)
    setMessage(null)
  }

  /**
   * 處理表單送出：依模式執行登入或註冊
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'login') {
      // 使用 Email + 密碼登入
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('電子郵件或密碼錯誤，請確認後重試。')
      } else {
        // 刷新 Server Component session 後跳轉 Dashboard
        router.refresh()
        router.push('/dashboard')
      }
    } else {
      // 建立新帳號，同時指定驗證信回調網址
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('帳號建立成功！請至信箱點擊驗證連結，再回來登入。')
        setMode('login')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* 平台標題 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            健康調理記錄平台
          </h1>
          <p className="text-sm text-gray-500 mt-1">行為模式導向的健康管理工具</p>
        </div>

        {/* 登入卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* 登入 / 註冊切換 Tab */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              登入
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              註冊帳號
            </button>
          </div>

          {/* 表單 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                電子郵件
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                           placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                密碼
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少 6 個字元' : '請輸入密碼'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                           placeholder:text-gray-400"
              />
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* 成功訊息（例如：註冊後請確認信箱） */}
            {message && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg
                         hover:bg-gray-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '處理中...' : mode === 'login' ? '登入' : '建立帳號'}
            </button>
          </form>
        </div>

        {/* 法規免責說明 */}
        <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
          本平台為行為模式導向的健康管理工具，不提供醫療診斷或治療建議。
        </p>
      </div>
    </div>
  )
}
