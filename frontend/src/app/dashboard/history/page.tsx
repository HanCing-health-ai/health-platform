// 歷史記錄頁面（Server Component）
// 由 middleware 保護，未登入者會被重導至 /login
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HistoryList from './HistoryList'
import TrendChart, { TrendDataPoint } from './TrendChart'

/**
 * 歷史記錄頁面
 * Server Component 負責：
 *   1. 驗證使用者身分
 *   2. 並行 fetch 歷史記錄與所有標籤資料
 *   3. 計算最近 14 天趨勢資料，傳入 TrendChart
 *   4. 傳入 HistoryList 做渲染
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
    { data: aiAnalyses },
  ] = await Promise.all([
    supabase
      .from('daily_records')
      .select(`
        id,
        record_date,
        chief_complaint,
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
    supabase
      .from('ai_analysis_results')
      .select('record_date, client_output, practitioner_output, confidence_score')
      .eq('user_id', user.id)
      .order('record_date', { ascending: false }),
  ])

  // 計算最近 14 天趨勢資料
  // 以今天為基準，往前推 13 天，每天對應一個資料點
  const today = new Date()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordList: any[] = records ?? []

  const trendData: TrendDataPoint[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 13 + i)

    // 格式化為 "YYYY-MM-DD" 用於比對資料庫 record_date
    const isoDate = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')

    // X 軸顯示標籤：M/D
    const label = `${d.getMonth() + 1}/${d.getDate()}`

    // 找到當天記錄（若無記錄則各值為 null，圖表線段中斷）
    const record = recordList.find(r => r.record_date === isoDate)
    const sleep = record?.sleep_logs?.[0] ?? null
    const body = record?.body_sensation_logs?.[0] ?? null

    return {
      date: label,
      energy: body?.energy_level ?? null,
      sleep: sleep?.quality_score ?? null,
      mood: body?.mood_score ?? null,
    }
  })

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

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* 趨勢折線圖（列表上方）*/}
        <TrendChart data={trendData} />

        {/* 歷史記錄列表 */}
        <HistoryList
          records={recordList}
          bodyAreaTags={bodyAreaTags ?? []}
          sensationTags={sensationTags ?? []}
          wellnessTags={wellnessTags ?? []}
          aiAnalyses={aiAnalyses ?? []}
        />
      </main>
    </div>
  )
}
