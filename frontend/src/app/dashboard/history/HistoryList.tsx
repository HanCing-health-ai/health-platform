'use client'

import { useState } from 'react'

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
  chief_complaint?: string | null
  sleep_logs: SleepLogRow[]
  diet_logs: DietLogRow[]
  body_sensation_logs: BodySensationLogRow[]
  wellness_logs: WellnessLogRow[]
}

interface AiAnalysis {
  record_date: string
  client_output: {
    pattern_type: string
    pattern_description: string
    behavior_suggestions: string[]
  } | null
  practitioner_output: {
    pattern_summary: string
    suggested_sequence: string[]
    sequence_reason: string
    caution_notes: string
    confidence_score: number
  } | null
  confidence_score: number | null
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
  aiAnalyses: AiAnalysis[]
}

function resolveTagNames(tagIds: string[], tags: TagItem[]): string[] {
  return tagIds
    .map(id => tags.find(t => t.id === id)?.name)
    .filter((n): n is string => !!n)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '點心',
}

function Score({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[48px]">
      <span className="text-xs text-gray-400 mb-0.5">{label}</span>
      <span className={`text-sm font-semibold ${value != null ? 'text-gray-800' : 'text-gray-300'}`}>
        {value ?? '－'}
      </span>
    </div>
  )
}

interface RecordRowProps {
  record: HistoryRecord
  bodyAreaTags: TagItem[]
  sensationTags: TagItem[]
  wellnessTags: WellnessTagItem[]
  aiAnalysis: AiAnalysis | null
}

function RecordRow({ record, bodyAreaTags, sensationTags, wellnessTags, aiAnalysis }: RecordRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'client' | 'practitioner'>('client')

  const sleep = record.sleep_logs?.[0] ?? null
  const body = record.body_sensation_logs?.[0] ?? null
  const areaTagNames = body
    ? resolveTagNames(body.body_sensation_area_tags.map(t => t.tag_id), bodyAreaTags)
    : []

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

      {/* 摘要列 */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-700 min-w-[160px]">
          {formatDate(record.record_date)}
        </span>
        <div className="flex gap-3">
          <Score value={sleep?.quality_score ?? null} label="睡眠" />
          <Score value={body?.energy_level ?? null} label="精力" />
          <Score value={body?.mood_score ?? null} label="心情" />
        </div>
        <div className="flex flex-wrap gap-1 flex-1">
          {areaTagNames.slice(0, 3).map(name => (
            <span key={name} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              {name}
            </span>
          ))}
          {areaTagNames.length > 3 && (
            <span className="text-xs text-gray-400">+{areaTagNames.length - 3}</span>
          )}
        </div>
        {/* AI 分析標記 */}
        {aiAnalysis && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
            ✨ 有AI分析
          </span>
        )}
        <span className="text-gray-400 text-sm ml-auto shrink-0">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* 展開詳情 */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-5 text-sm text-gray-700">

          {/* 主訴 */}
          {record.chief_complaint && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-1">主訴</h3>
              <p className="text-gray-600 text-sm">{record.chief_complaint}</p>
            </section>
          )}

          {/* AI 分析區塊 */}
          {aiAnalysis?.client_output && (
            <section>
              <div className="flex border-b border-gray-200 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('client')}
                  className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'client'
                      ? 'border-green-500 text-green-700'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ✨ 行為模式分析
                </button>
                {aiAnalysis.practitioner_output && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('practitioner')}
                    className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === 'practitioner'
                        ? 'border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    🔧 師傅調理建議
                  </button>
                )}
              </div>

              {activeTab === 'client' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-700 font-medium mb-1">
                    {aiAnalysis.client_output.pattern_type}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    {aiAnalysis.client_output.pattern_description}
                  </p>
                  <ul className="space-y-1">
                    {aiAnalysis.client_output.behavior_suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                        <span className="text-green-500 font-bold">•</span>{s}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-gray-400">
                    以上為行為模式調整參考，不構成任何醫療建議
                  </p>
                </div>
              )}

              {activeTab === 'practitioner' && aiAnalysis.practitioner_output && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">模式歸納：</span>
                    {aiAnalysis.practitioner_output.pattern_summary}
                  </p>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">建議調理順序：</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      {aiAnalysis.practitioner_output.suggested_sequence.map((s, i) => (
                        <li key={i} className="text-xs text-gray-600">{s}</li>
                      ))}
                    </ol>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    {aiAnalysis.practitioner_output.sequence_reason}
                  </p>
                  {aiAnalysis.practitioner_output.caution_notes && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg">
                      ⚠️ {aiAnalysis.practitioner_output.caution_notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    信心分數：{((aiAnalysis.practitioner_output.confidence_score ?? 0) * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </section>
          )}

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

export default function HistoryList({ records, bodyAreaTags, sensationTags, wellnessTags, aiAnalyses }: Props) {
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
      {records.map(record => {
        const aiAnalysis = aiAnalyses.find(a => a.record_date === record.record_date) ?? null
        return (
          <RecordRow
            key={record.id}
            record={record as HistoryRecord}
            bodyAreaTags={bodyAreaTags}
            sensationTags={sensationTags}
            wellnessTags={wellnessTags}
            aiAnalysis={aiAnalysis}
          />
        )
      })}
    </div>
  )
}