// Dashboard 頁面（Server Component）
// 由 middleware 保護，未登入者會被重導至 /login
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'
import DailyRecordForm from './DailyRecordForm'

/**
 * Dashboard 頁面
 * Server Component 負責：
 *   1. 驗證使用者身分
 *   2. 取得台灣今日日期
 *   3. 並行 fetch 標籤資料 + 今日既有記錄
 *   4. 傳入 DailyRecordForm 做初始值預填
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  // 防禦性驗證（middleware 已保護，此處為雙重確認）
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 取得台灣時區的今日日期（YYYY-MM-DD）
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })

  // 並行 fetch 標籤資料與今日記錄，減少等待時間
  const [
    { data: wellnessTags },
    { data: bodyAreaTags },
    { data: sensationTags },
    { data: existingRecord },
  ] = await Promise.all([
    supabase
      .from('wellness_activity_tags')
      .select('*')
      .order('category')
      .order('name'),
    supabase
      .from('body_area_tags')
      .select('*')
      .order('created_at'),
    supabase
      .from('sensation_type_tags')
      .select('*')
      .order('created_at'),
    supabase
      .from('daily_records')
      .select(`
        id,
        sleep_logs(*),
        diet_logs(*),
        body_sensation_logs(
          *,
          body_sensation_area_tags(tag_id),
          body_sensation_type_tags(tag_id)
        ),
        wellness_logs(
          *,
          wellness_log_tags(tag_id)
        )
      `)
      .eq('user_id', user.id)
      .eq('record_date', today)
      .maybeSingle(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 頂部導航列 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">健康調理記錄</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <Link
              href="/dashboard/history"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              歷史記錄
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 每日記錄表單 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <DailyRecordForm
          today={today}
          existingRecord={existingRecord}
          wellnessTags={wellnessTags ?? []}
          bodyAreaTags={bodyAreaTags ?? []}
          sensationTags={sensationTags ?? []}
        />
      </main>
    </div>
  )
}
