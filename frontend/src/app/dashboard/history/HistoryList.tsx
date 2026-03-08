'use client'

// 歷史記錄列表元件（Client Component）
// 每筆顯示日期與摘要指標，點擊可展開完整內容
import { useState } from 'react'

// ---- 型別定義（對應 Supabase 巢狀查詢回傳格式）----

interface SleepLogRow {
  quality_score: number | null
  duration_hours: number | null
  sleep_time: string | null
  wake_time: string | null
  notes: string | null
}

interface DietLogRow {
  meal_type: string | null
  description: string | null
  water_intake_ml: number | null
  notes: string | null
}

interface BodySensationLogRow {
  energy_level: number | null
  stress_level: number | null
  mood_score: number | null
  custom_note: string | null
  body_sensation_area_tags: { tag_id: string }[]
  body_sensation_type_tags: { tag_id: string }[]
}

interface WellnessLogRow {
  duration_minutes: number | null
  custom_note: string | null
  wellness_log_tags: { tag_id: string }[]
}

interface HistoryRecord {
  id: string
  record_date: string
  sleep_logs: SleepLogRow[]
  diet_logs: DietLogRow[]
  body_sensation_logs: BodySensationLogRow[]
  wellness_logs: WellnessLogRow[]
}

interface TagItem {
  id: string
  name: string
}

interface WellnessTagItem extends TagItem {
  category: string
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records: any[]
  bodyAreaTags: TagItem[]
  sensationTags: TagItem[]
  wellnessTags: WellnessTagItem[]
}

// ---- 輔助函式 ----

/** 依 id 查詢標籤名稱 */
function resolveTagNames(tagIds: string[], tags: TagItem[]): string[] {
  return tagIds
    .map(id => tags.find(t => t.id === id)?.name)
    .filter((n): n is string => !!n)
}

/** 格式化日期為「M/D 星期X」 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
}

/** 餐次標籤對照 */
const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '點心',
}

/** 分數顯示：null 時顯示 "－" */
function Score({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[48px]">
      <span className="text-xs text-gray-400 mb-0.5">{label}</span>
      <span className={`text-sm font-semibold ${value ? 'text-gray-800' : 'text-gray-300'}`}>
        {value ?? '－'}
      </span>
    </div>
  )
}

// ---- 單筆記錄列（摘要 + 展開詳情）----

interface RecordRowProps {
  record: HistoryRecord
  bodyAreaTags: TagItem[]
  sensationTags: TagItem[]
  wellnessTags: WellnessTagItem[]
}

function RecordRow({ record, bodyAreaTags, sensationTags, wellnessTags }: RecordRowProps) {
  const [expanded, setExpanded] = useState(false)

  const sleep = record.sleep_logs?.[0] ?? null
  const body = record.body_sensation_logs?.[0] ?? null
  const areaTagNames = body
    ? resolveTagNames(body.body_sensation_area_tags.map(t => t.tag_id), bodyAreaTags)
    : []

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

      {/* 摘要列（點擊展開/收合）*/}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* 日期 */}
        <span className="text-sm font-medium text-gray-700 min-w-[160px]">
          {formatDate(record.record_date)}
        </span>

        {/* 三項評分 */}
        <div className="flex gap-3">
          <Score value={sleep?.quality_score ?? null} label="睡眠" />
          <Score value={body?.energy_level ?? null} label="精力" />
          <Score value={body?.mood_score ?? null} label="心情" />
        </div>

        {/* 身體部位標籤（最多顯示 3 個）*/}
        <div className="flex flex-wrap gap-1 flex-1">
          {areaTagNames.slice(0, 3).map(name => (
            <span
              key={name}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {name}
            </span>
          ))}
          {areaTagNames.length > 3 && (
            <span className="text-xs text-gray-400">+{areaTagNames.length - 3}</span>
          )}
        </div>

        {/* 展開箭頭 */}
        <span className="text-gray-400 text-sm ml-auto shrink-0">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* 展開詳情 */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-5 text-sm text-gray-700">

          {/* 睡眠詳情 */}
          {sleep && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-2">睡眠記錄</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {sleep.sleep_time && (
                  <div><span className="text-gray-400">入睡：</span>{sleep.sleep_time.slice(0, 5)}</div>
                )}
                {sleep.wake_time && (
                  <div><span className="text-gray-400">起床：</span>{sleep.wake_time.slice(0, 5)}</div>
                )}
                {sleep.duration_hours != null && (
                  <div><span className="text-gray-400">時長：</span>{sleep.duration_hours} 小時</div>
                )}
                {sleep.quality_score != null && (
                  <div><span className="text-gray-400">品質：</span>{sleep.quality_score} / 5</div>
                )}
              </div>
              {sleep.notes && (
                <p className="mt-1 text-gray-500 text-xs">{sleep.notes}</p>
              )}
            </section>
          )}

          {/* 飲食詳情 */}
          {record.diet_logs?.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-2">飲食記錄</h3>
              <ul className="space-y-1">
                {record.diet_logs.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    {d.meal_type && (
                      <span className="text-gray-400 shrink-0">
                        {MEAL_LABELS[d.meal_type] ?? d.meal_type}
                      </span>
                    )}
                    <span>{d.description}</span>
                    {d.water_intake_ml && (
                      <span className="text-gray-400 text-xs">({d.water_intake_ml}ml)</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 身體感受詳情 */}
          {body && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-2">身體感受</h3>
              <div className="flex gap-4 mb-2">
                {body.energy_level != null && (
                  <span><span className="text-gray-400">精力：</span>{body.energy_level}/5</span>
                )}
                {body.stress_level != null && (
                  <span><span className="text-gray-400">壓力：</span>{body.stress_level}/5</span>
                )}
                {body.mood_score != null && (
                  <span><span className="text-gray-400">心情：</span>{body.mood_score}/5</span>
                )}
              </div>
              {areaTagNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  <span className="text-gray-400 text-xs mr-1">部位：</span>
                  {areaTagNames.map(name => (
                    <span key={name} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {name}
                    </span>
                  ))}
                </div>
              )}
              {body.body_sensation_type_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  <span className="text-gray-400 text-xs mr-1">感受：</span>
                  {resolveTagNames(body.body_sensation_type_tags.map(t => t.tag_id), sensationTags).map(name => (
                    <span key={name} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full">
                      {name}
                    </span>
                  ))}
                </div>
              )}
              {body.custom_note && (
                <p className="text-gray-500 text-xs mt-1">{body.custom_note}</p>
              )}
            </section>
          )}

          {/* 調理項目詳情 */}
          {record.wellness_logs?.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-2">調理項目</h3>
              <ul className="space-y-1">
                {record.wellness_logs.map((w, i) => {
                  const tagNames = resolveTagNames(w.wellness_log_tags.map(t => t.tag_id), wellnessTags)
                  return (
                    <li key={i} className="flex flex-wrap items-center gap-1">
                      {tagNames.map(name => (
                        <span key={name} className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">
                          {name}
                        </span>
                      ))}
                      {w.duration_minutes && (
                        <span className="text-gray-400 text-xs">{w.duration_minutes} 分鐘</span>
                      )}
                      {w.custom_note && (
                        <span className="text-gray-500 text-xs">— {w.custom_note}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

// ---- 主元件 ----

/**
 * 歷史記錄列表
 * 每筆顯示日期摘要，點擊展開完整內容
 */
export default function HistoryList({ records, bodyAreaTags, sensationTags, wellnessTags }: Props) {
  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-base">尚無歷史記錄</p>
        <p className="text-sm mt-1">開始填寫每日記錄後，資料會顯示在這裡</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 mb-4">共 {records.length} 筆記錄，點擊可展開完整內容</p>
      {records.map(record => (
        <RecordRow
          key={record.id}
          record={record as HistoryRecord}
          bodyAreaTags={bodyAreaTags}
          sensationTags={sensationTags}
          wellnessTags={wellnessTags}
        />
      ))}
    </div>
  )
}
