// 歷史記錄頁面（Server Component）
// 由 middleware 保護，未登入者會被重導至 /login
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HistoryList from './HistoryList'

/**
 * 歷史記錄頁面
 * Server Component 負責：
 *   1. 驗證使用者身分
 *   2. 並行 fetch 歷史記錄與所有標籤資料
 *   3. 傳入 HistoryList 做渲染
 */
export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 並行 fetch 所有歷史記錄與標籤對照表
  const [
    { data: records },
    { data: bodyAreaTags },
    { data: sensationTags },
    { data: wellnessTags },
  ] = await Promise.all([
    supabase
      .from('daily_records')
      .select(`
        id,
        record_date,
        sleep_logs(quality_score, duration_hours, sleep_time, wake_time, notes),
        diet_logs(meal_type, description, water_intake_ml, notes),
        body_sensation_logs(
          energy_level, stress_level, mood_score, custom_note,
          body_sensation_area_tags(tag_id),
          body_sensation_type_tags(tag_id)
        ),
        wellness_logs(
          duration_minutes, custom_note,
          wellness_log_tags(tag_id)
        )
      `)
      .eq('user_id', user.id)
      .order('record_date', { ascending: false }),
    supabase.from('body_area_tags').select('id, name').order('created_at'),
    supabase.from('sensation_type_tags').select('id, name').order('created_at'),
    supabase.from('wellness_activity_tags').select('id, name, category').order('category').order('name'),
  ])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 頂部導航列 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">歷史記錄</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← 返回今日記錄
          </Link>
        </div>
      </header>

      {/* 歷史列表 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <HistoryList
          records={records ?? []}
          bodyAreaTags={bodyAreaTags ?? []}
          sensationTags={sensationTags ?? []}
          wellnessTags={wellnessTags ?? []}
        />
      </main>
    </div>
  )
}
