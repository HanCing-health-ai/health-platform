'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  BodyAreaTag,
  BodySensationFormData,
  DailyRecordPayload,
  DietFormData,
  SensationTypeTag,
  SleepFormData,
  WellnessActivityTag,
  WellnessFormData,
} from '@/types'
import SleepSection from './SleepSection'
import DietSection from './DietSection'
import BodySensationSection from './BodySensationSection'
import WellnessSection from './WellnessSection'

interface FormErrors {
  sleep?: { time_conflict?: string; duration?: string; quality?: string }
  body?: { scores?: string; area_sensation?: string }
}

const DEFAULT_SLEEP: SleepFormData = { sleep_time: '', wake_time: '', quality_score: null, notes: '' }
const DEFAULT_BODY: BodySensationFormData = {
  energy_level: null, stress_level: null, mood_score: null,
  area_tag_ids: [], sensation_type_tag_ids: [], custom_note: '',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSleepForm(logs: any[]): SleepFormData {
  const log = logs?.[0]
  if (!log) return DEFAULT_SLEEP
  return { sleep_time: log.sleep_time ?? '', wake_time: log.wake_time ?? '', quality_score: log.quality_score ?? null, notes: log.notes ?? '' }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDietForm(logs: any[]): DietFormData[] {
  if (!logs?.length) return []
  return logs.map(l => ({ meal_type: l.meal_type ?? 'breakfast', description: l.description ?? '', water_intake_ml: l.water_intake_ml?.toString() ?? '', notes: l.notes ?? '' }))
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBodyForm(logs: any[]): BodySensationFormData {
  const log = logs?.[0]
  if (!log) return DEFAULT_BODY
  return {
    energy_level: log.energy_level ?? null, stress_level: log.stress_level ?? null, mood_score: log.mood_score ?? null,
    area_tag_ids: (log.body_sensation_area_tags ?? []).map((t: { tag_id: string }) => t.tag_id),
    sensation_type_tag_ids: (log.body_sensation_type_tags ?? []).map((t: { tag_id: string }) => t.tag_id),
    custom_note: log.custom_note ?? '',
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWellnessForm(logs: any[]): WellnessFormData[] {
  if (!logs?.length) return []
  return logs.map(l => ({ tag_ids: (l.wellness_log_tags ?? []).map((t: { tag_id: string }) => t.tag_id), duration_minutes: l.duration_minutes?.toString() ?? '', custom_note: l.custom_note ?? '' }))
}

interface ExistingRecord {
  chief_complaint?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sleep_logs: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  diet_logs: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body_sensation_logs: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wellness_logs: any[]
}

interface Props {
  today: string
  userId: string
  existingRecord: ExistingRecord | null
  wellnessTags: WellnessActivityTag[]
  bodyAreaTags: BodyAreaTag[]
  sensationTags: SensationTypeTag[]
}

interface AiAnalysis {
  practitioner_output: {
    pattern_summary: string
    suggested_sequence: string[]
    sequence_reason: string
    caution_notes: string
    confidence_score: number
  }
  client_output: {
    pattern_type: string
    pattern_description: string
    behavior_suggestions: string[]
  }
  behavior_tags: {
    pattern_type: string
    primary_load_source: string
    lifestyle_tags: string[]
    discomfort_areas: string[]
  }
}

// 師傅端 AI 建議採納回饋元件
function AdoptionButtons({ recordDate }: { recordDate: string }) {
  const [status, setStatus] = useState<'idle' | 'adopted' | 'skipped' | 'saving'>('idle')

  async function handleAdoption(adopted: boolean) {
    setStatus('saving')
    try {
      await fetch('/api/ai-analysis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_date: recordDate,
          practitioner_adopted: adopted,
          adoption_note: adopted ? '師傅已參考此建議' : '師傅本次未使用',
        }),
      })
      setStatus(adopted ? 'adopted' : 'skipped')
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'adopted') {
    return <p className="text-xs text-green-600 mt-2">✅ 已記錄：您參考了此建議</p>
  }
  if (status === 'skipped') {
    return <p className="text-xs text-gray-400 mt-2">已記錄：本次未使用</p>
  }

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-blue-100">
      <button
        type="button"
        onClick={() => handleAdoption(true)}
        disabled={status === 'saving'}
        className="flex-1 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {status === 'saving' ? '記錄中...' : '✅ 已參考此建議'}
      </button>
      <button
        type="button"
        onClick={() => handleAdoption(false)}
        disabled={status === 'saving'}
        className="flex-1 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
      >
        ⏭ 本次未使用
      </button>
    </div>
  )
}
export default function DailyRecordForm({ today, userId, existingRecord, wellnessTags, bodyAreaTags, sensationTags }: Props) {
  const ex = existingRecord
  const [chiefComplaint, setChiefComplaint] = useState(ex?.chief_complaint ?? '')
  const [sleep, setSleep] = useState<SleepFormData>(() => ex ? toSleepForm(ex.sleep_logs) : DEFAULT_SLEEP)
  const [diet, setDiet] = useState<DietFormData[]>(() => ex ? toDietForm(ex.diet_logs) : [])
  const [body, setBody] = useState<BodySensationFormData>(() => ex ? toBodyForm(ex.body_sensation_logs) : DEFAULT_BODY)
  const [wellness, setWellness] = useState<WellnessFormData[]>(() => ex ? toWellnessForm(ex.wellness_logs) : [])
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<FormErrors>({})
  const [formCollapsed, setFormCollapsed] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AiAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'client' | 'practitioner'>('client')

  const sleepRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const aiSuggestionRef = useRef<HTMLDivElement>(null)

  // 頁面載入時，讀取今日已存的 AI 分析結果
  // 載入時從 localStorage 還原表單暫存
  useEffect(() => {
    const saved = localStorage.getItem(`daily_form_${today}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.chiefComplaint) setChiefComplaint(parsed.chiefComplaint)
        if (parsed.sleep) setSleep(parsed.sleep)
        if (parsed.diet) setDiet(parsed.diet)
        if (parsed.body) setBody(parsed.body)
        if (parsed.wellness) setWellness(parsed.wellness)
      } catch { /* 解析失敗忽略 */ }
    }
  }, [today])

  // 表單任何欄位改變時，自動暫存到 localStorage
  useEffect(() => {
    const data = { chiefComplaint, sleep, diet, body, wellness }
    localStorage.setItem(`daily_form_${today}`, JSON.stringify(data))
  }, [today, chiefComplaint, sleep, diet, body, wellness])
  useEffect(() => {
    async function loadExistingAnalysis() {
      const res = await fetch(`/api/ai-analysis?date=${today}`)
      const json = await res.json()
      if (json.data) {
        setAiSuggestion({
          practitioner_output: json.data.practitioner_output,
          client_output: json.data.client_output,
          behavior_tags: json.data.behavior_tags,
        })
        setFormCollapsed(true)
      }
    }
    loadExistingAnalysis()
  }, [today])

  function calcDurationMinutes(sleepTime: string, wakeTime: string): number {
    const [sh, sm] = sleepTime.split(':').map(Number)
    const [wh, wm] = wakeTime.split(':').map(Number)
    let minutes = (wh * 60 + wm) - (sh * 60 + sm)
    if (minutes < 0) minutes += 24 * 60
    return minutes
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    const { sleep_time, wake_time, quality_score } = sleep
    if (sleep_time && wake_time) {
      if (sleep_time === wake_time) errs.sleep = { ...errs.sleep, time_conflict: '入睡時間與起床時間不能相同' }
      else if (calcDurationMinutes(sleep_time, wake_time) > 16 * 60) errs.sleep = { ...errs.sleep, duration: '睡眠時間不能超過 16 小時' }
    }
    if (quality_score !== null && (quality_score < 1 || quality_score > 10)) errs.sleep = { ...errs.sleep, quality: '睡眠品質評分必須在 1-10 之間' }
    const { energy_level, stress_level, mood_score, area_tag_ids, sensation_type_tag_ids } = body
    const scores = [energy_level, stress_level, mood_score].filter(s => s !== null)
    if (scores.some(s => s! < 1 || s! > 10)) errs.body = { ...errs.body, scores: '精力、壓力、心情評分必須在 1-10 之間' }
    if (area_tag_ids.length > 0 && sensation_type_tag_ids.length === 0) errs.body = { ...errs.body, area_sensation: '選擇感受部位後，請至少選擇一個感受類型' }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // 今日已有記錄，不重複送出 AI 分析
if (existingRecord && aiSuggestion) return
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setTimeout(() => {
        if (validationErrors.sleep) sleepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else if (validationErrors.body) bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
      return
    }
    setErrors({})
    setSaving(true)
    setSaveStatus('idle')

    const payload: DailyRecordPayload = { record_date: today, chief_complaint: chiefComplaint, sleep, diet, body_sensation: body, wellness }

    try {
      const res = await fetch('/api/daily-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSaveStatus('success')
        localStorage.removeItem(`daily_form_${today}`)
        setFormCollapsed(true)

        // 若今日已有 AI 分析，不重複呼叫
        if (aiSuggestion) {
          setSaving(false)
          setTimeout(() => setSaveStatus('idle'), 3000)
          return
        }

        // 呼叫 FastAPI AI 分析
        setIsAnalyzing(true)
        setTimeout(() => aiSuggestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)

        try {
          const aiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: userId,
              occupation_type: '一般用戶',
              discomfort_areas: body.area_tag_ids.length > 0 ? body.area_tag_ids : ['未指定'],
              primary_complaint: chiefComplaint || '無特定主訴',
              duration_type: '一週以內',
              is_on_medication: false,
              special_notes: body.custom_note || '',
              lifestyle_description: chiefComplaint
                ? chiefComplaint + '。' + (body.custom_note || '')
                : (body.custom_note || '用戶填寫了今日健康記錄。'),
            }),
          })

          if (aiRes.ok) {
            const aiData = await aiRes.json()
            if (aiData.success) {
              setAiSuggestion(aiData.analysis)
              // 存入 Supabase
              await fetch('/api/ai-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  record_date: today,
                  analysis: aiData.analysis,
                  triage_class: aiData.triage_class,
                }),
              })
              setTimeout(() => aiSuggestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
            }
          }
        } catch {
          // AI 分析失敗不影響主要儲存功能
        }
        setIsAnalyzing(false)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }

    setSaving(false)
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  const displayDate = (() => {
    const d = new Date(today + 'T00:00:00')
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
  })()

  const allErrorMessages: string[] = [
    errors.sleep?.time_conflict, errors.sleep?.duration, errors.sleep?.quality,
    errors.body?.scores, errors.body?.area_sensation,
  ].filter((msg): msg is string => !!msg)

  return (
    <>
      {saveStatus === 'success' && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-green-500 text-white text-base font-semibold px-8 py-4 rounded-2xl shadow-xl">
            ✅ 記錄已儲存成功！
          </div>
        </div>
      )}

      {/* AI 分析載入中 */}
      {isAnalyzing && (
        <div ref={aiSuggestionRef} className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center text-blue-600 text-sm">
          ✨ AI 正在分析您的行為模式，請稍候...
        </div>
      )}

      {/* AI 建議卡片（Tab 切換）*/}
      {aiSuggestion && !isAnalyzing && (
        <div ref={aiSuggestionRef} className="mb-4">
          {/* Tab 標籤 */}
          <div className="flex border-b border-gray-200 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('client')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'client'
                  ? 'border-green-500 text-green-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              ✨ 我的行為模式
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('practitioner')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'practitioner'
                  ? 'border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              🔧 師傅調理建議
            </button>
          </div>

          {/* 客戶版 Tab */}
          {activeTab === 'client' && (
            <div className="p-5 bg-green-50 border border-green-200 rounded-2xl">
              <p className="text-xs text-green-700 font-medium mb-2">
                {aiSuggestion.client_output.pattern_type}
              </p>
              <p className="text-sm text-gray-700 mb-3">
                {aiSuggestion.client_output.pattern_description}
              </p>
              <ul className="space-y-1">
                {aiSuggestion.client_output.behavior_suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-green-500 font-bold">•</span>{s}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-400">
                以上為行為模式調整參考，不構成任何醫療建議
              </p>
            </div>
          )}

          {/* 師傅版 Tab */}
          {activeTab === 'practitioner' && (
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
              <p className="text-xs text-gray-600">
                <span className="font-medium">模式歸納：</span>
                {aiSuggestion.practitioner_output.pattern_summary}
              </p>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">建議調理順序：</p>
                <ol className="list-decimal list-inside space-y-1">
                  {aiSuggestion.practitioner_output.suggested_sequence.map((s, i) => (
                    <li key={i} className="text-xs text-gray-600">{s}</li>
                  ))}
                </ol>
              </div>
              <p className="text-xs text-gray-500 italic">
                {aiSuggestion.practitioner_output.sequence_reason}
              </p>
              {aiSuggestion.practitioner_output.caution_notes && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  ⚠️ {aiSuggestion.practitioner_output.caution_notes}
                </p>
              )}
              {/* 採納回饋按鈕 */}
              <AdoptionButtons recordDate={today} />
              
            </div>
          )}
        </div>
      )}

      {/* 表單區塊 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500">{displayDate}</h2>
          {(saveStatus === 'success' || aiSuggestion) && (
            <button
              type="button"
              onClick={() => setFormCollapsed(prev => !prev)}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {formCollapsed ? '▶ 展開記錄內容' : '▼ 收合記錄內容'}
            </button>
          )}
        </div>

        {!formCollapsed && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
              <label htmlFor="chief-complaint" className="block text-sm font-semibold text-gray-800 mb-2">
                今天最困擾你的是什麼？
                <span className="ml-1 text-xs font-normal text-gray-400">選填</span>
              </label>
              <textarea
                id="chief-complaint"
                value={chiefComplaint}
                onChange={e => setChiefComplaint(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="例如：右肩最近特別緊繃，睡覺翻身會不舒服..."
                className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-300"
              />
              <p className="text-right text-xs text-gray-300 mt-1">{chiefComplaint.length} / 200</p>
            </div>

            {allErrorMessages.length > 0 && (
              <div ref={errorSummaryRef} className="px-4 py-3 bg-red-50 border border-red-400 rounded-lg">
                <p className="text-red-700 font-semibold text-sm mb-1">請修正以下錯誤後再儲存</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {allErrorMessages.map((msg, i) => <li key={i} className="text-red-600 text-sm">{msg}</li>)}
                </ul>
              </div>
            )}

            <div ref={sleepRef}><SleepSection value={sleep} onChange={setSleep} errors={errors.sleep} /></div>
            <DietSection value={diet} onChange={setDiet} />
            <div ref={bodyRef}>
              <BodySensationSection value={body} onChange={setBody} bodyAreaTags={bodyAreaTags} sensationTags={sensationTags} errors={errors.body} />
            </div>
            <WellnessSection value={wellness} onChange={setWellness} wellnessTags={wellnessTags} />

            <div className="flex flex-col items-end gap-3 pt-2">
              {saveStatus === 'error' && (
                <div className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-400 rounded-lg">
                  <span className="text-red-500 font-bold text-lg">✗</span>
                  <span className="text-red-600 font-semibold text-sm">儲存失敗，請重試</span>
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '儲存中...' : aiSuggestion ? '更新記錄' : '儲存記錄'}
              </button>
            </div>
          </>
        )}

        {formCollapsed && (
          <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
            今日記錄已儲存　·　點擊「展開記錄內容」可查看或修改
          </div>
        )}
      </form>
    </>
  )
}