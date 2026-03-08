'use client'

// 每日健康調理記錄表單主控元件
import { useRef, useState } from 'react'
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

// ---- 驗證錯誤型別 ----

interface FormErrors {
  sleep?: {
    time_conflict?: string
    duration?: string
    quality?: string
  }
  body?: {
    scores?: string
    area_sensation?: string
  }
}

// ---- 各區段的初始空值 ----

const DEFAULT_SLEEP: SleepFormData = {
  sleep_time: '',
  wake_time: '',
  quality_score: null,
  notes: '',
}

const DEFAULT_BODY: BodySensationFormData = {
  energy_level: null,
  stress_level: null,
  mood_score: null,
  area_tag_ids: [],
  sensation_type_tag_ids: [],
  custom_note: '',
}

// ---- DB 記錄轉換為表單格式（預填既有資料）----

/** 將 DB 睡眠記錄轉換為表單初始值 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSleepForm(logs: any[]): SleepFormData {
  const log = logs?.[0]
  if (!log) return DEFAULT_SLEEP
  return {
    sleep_time: log.sleep_time ?? '',
    wake_time: log.wake_time ?? '',
    quality_score: log.quality_score ?? null,
    notes: log.notes ?? '',
  }
}

/** 將 DB 飲食記錄轉換為表單初始值 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDietForm(logs: any[]): DietFormData[] {
  if (!logs?.length) return []
  return logs.map(l => ({
    meal_type: l.meal_type ?? 'breakfast',
    description: l.description ?? '',
    water_intake_ml: l.water_intake_ml?.toString() ?? '',
    notes: l.notes ?? '',
  }))
}

/** 將 DB 身體感受記錄轉換為表單初始值 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBodyForm(logs: any[]): BodySensationFormData {
  const log = logs?.[0]
  if (!log) return DEFAULT_BODY
  return {
    energy_level: log.energy_level ?? null,
    stress_level: log.stress_level ?? null,
    mood_score: log.mood_score ?? null,
    area_tag_ids: (log.body_sensation_area_tags ?? []).map((t: { tag_id: string }) => t.tag_id),
    sensation_type_tag_ids: (log.body_sensation_type_tags ?? []).map((t: { tag_id: string }) => t.tag_id),
    custom_note: log.custom_note ?? '',
  }
}

/** 將 DB 調理記錄轉換為表單初始值 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWellnessForm(logs: any[]): WellnessFormData[] {
  if (!logs?.length) return []
  return logs.map(l => ({
    tag_ids: (l.wellness_log_tags ?? []).map((t: { tag_id: string }) => t.tag_id),
    duration_minutes: l.duration_minutes?.toString() ?? '',
    custom_note: l.custom_note ?? '',
  }))
}

// ---- 元件 Props ----

interface ExistingRecord {
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
  today: string                         // YYYY-MM-DD（台灣時區）
  existingRecord: ExistingRecord | null  // 今日已存在的記錄（null 表示今日尚無記錄）
  wellnessTags: WellnessActivityTag[]
  bodyAreaTags: BodyAreaTag[]
  sensationTags: SensationTypeTag[]
}

/**
 * 每日記錄表單主控元件
 * 管理 4 個區段的狀態，統一送出至 /api/daily-record
 */
export default function DailyRecordForm({
  today,
  existingRecord,
  wellnessTags,
  bodyAreaTags,
  sensationTags,
}: Props) {
  const ex = existingRecord

  // 各區段狀態，若今日已有記錄則預填既有資料
  const [sleep, setSleep] = useState<SleepFormData>(() =>
    ex ? toSleepForm(ex.sleep_logs) : DEFAULT_SLEEP
  )
  const [diet, setDiet] = useState<DietFormData[]>(() =>
    ex ? toDietForm(ex.diet_logs) : []
  )
  const [body, setBody] = useState<BodySensationFormData>(() =>
    ex ? toBodyForm(ex.body_sensation_logs) : DEFAULT_BODY
  )
  const [wellness, setWellness] = useState<WellnessFormData[]>(() =>
    ex ? toWellnessForm(ex.wellness_logs) : []
  )

  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<FormErrors>({})

  // 用於滾動到第一個錯誤區段
  const sleepRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  /**
   * 計算睡眠時長（分鐘），支援跨日
   */
  function calcDurationMinutes(sleepTime: string, wakeTime: string): number {
    const [sh, sm] = sleepTime.split(':').map(Number)
    const [wh, wm] = wakeTime.split(':').map(Number)
    let minutes = (wh * 60 + wm) - (sh * 60 + sm)
    if (minutes < 0) minutes += 24 * 60
    return minutes
  }

  /**
   * 表單驗證：回傳錯誤物件，無錯誤時為空物件
   */
  function validate(): FormErrors {
    const errs: FormErrors = {}

    // 睡眠驗證
    const { sleep_time, wake_time, quality_score } = sleep
    if (sleep_time && wake_time) {
      if (sleep_time === wake_time) {
        errs.sleep = { ...errs.sleep, time_conflict: '入睡時間與起床時間不能相同' }
      } else if (calcDurationMinutes(sleep_time, wake_time) > 16 * 60) {
        errs.sleep = { ...errs.sleep, duration: '睡眠時間不能超過 16 小時' }
      }
    }
    if (quality_score !== null && (quality_score < 1 || quality_score > 10)) {
      errs.sleep = { ...errs.sleep, quality: '睡眠品質評分必須在 1-10 之間' }
    }

    // 身體感受驗證
    const { energy_level, stress_level, mood_score, area_tag_ids, sensation_type_tag_ids } = body
    const scores = [energy_level, stress_level, mood_score].filter(s => s !== null)
    if (scores.some(s => s! < 1 || s! > 10)) {
      errs.body = { ...errs.body, scores: '精力、壓力、心情評分必須在 1-10 之間' }
    }
    if (area_tag_ids.length > 0 && sensation_type_tag_ids.length === 0) {
      errs.body = { ...errs.body, area_sensation: '選擇感受部位後，請至少選擇一個感受類型' }
    }

    return errs
  }

  /**
   * 送出表單：POST 完整記錄至 API
   * 採用 upsert 策略，可重複儲存（更新既有記錄）
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // 驗證失敗則中止送出，並滾動至第一個錯誤區段
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setTimeout(() => {
        if (validationErrors.sleep) {
          sleepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (validationErrors.body) {
          bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 50)
      return
    }
    setErrors({})

    setSaving(true)
    setSaveStatus('idle')

    const payload: DailyRecordPayload = {
      record_date: today,
      sleep,
      diet,
      body_sensation: body,
      wellness,
    }

    try {
      const res = await fetch('/api/daily-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setSaveStatus(res.ok ? 'success' : 'error')
    } catch {
      setSaveStatus('error')
    }

    setSaving(false)
    // 3 秒後清除狀態提示
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  // 格式化今日日期供顯示（手動格式化確保 server/client 渲染一致，避免 hydration error）
  const displayDate = (() => {
    const d = new Date(today + 'T00:00:00')
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
  })()

  // 收集所有錯誤訊息供摘要框顯示
  const allErrorMessages: string[] = [
    errors.sleep?.time_conflict,
    errors.sleep?.duration,
    errors.sleep?.quality,
    errors.body?.scores,
    errors.body?.area_sensation,
  ].filter((msg): msg is string => !!msg)

  return (
    <>
      {/* 儲存成功：畫面正中央彈出視窗，3 秒後消失 */}
      {saveStatus === 'success' && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-green-500 text-white text-base font-semibold px-8 py-4 rounded-2xl shadow-xl">
            ✅ 記錄已儲存成功！
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* 日期標題 */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500">{displayDate}</h2>
        </div>

        {/* 驗證錯誤摘要框：有錯誤時顯示，全部修正後消失 */}
        {allErrorMessages.length > 0 && (
          <div
            ref={errorSummaryRef}
            className="px-4 py-3 bg-red-50 border border-red-400 rounded-lg"
          >
            <p className="text-red-700 font-semibold text-sm mb-1">請修正以下錯誤後再儲存</p>
            <ul className="list-disc list-inside space-y-0.5">
              {allErrorMessages.map((msg, i) => (
                <li key={i} className="text-red-600 text-sm">{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 四個記錄區段 */}
        <div ref={sleepRef}>
          <SleepSection value={sleep} onChange={setSleep} errors={errors.sleep} />
        </div>
        <DietSection value={diet} onChange={setDiet} />
        <div ref={bodyRef}>
          <BodySensationSection
            value={body}
            onChange={setBody}
            bodyAreaTags={bodyAreaTags}
            sensationTags={sensationTags}
            errors={errors.body}
          />
        </div>
        <WellnessSection
          value={wellness}
          onChange={setWellness}
          wellnessTags={wellnessTags}
        />

        {/* 儲存按鈕 + API 失敗提示 */}
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
            className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg
                       hover:bg-gray-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '儲存中...' : '儲存記錄'}
          </button>
        </div>
      </form>
    </>
  )
}
