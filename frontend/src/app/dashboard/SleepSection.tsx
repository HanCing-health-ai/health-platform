'use client'

// 睡眠記錄區段元件
import type { SleepFormData } from '@/types'

interface SleepErrors {
  time_conflict?: string
  duration?: string
  quality?: string
}

interface Props {
  value: SleepFormData
  onChange: (data: SleepFormData) => void
  errors?: SleepErrors
}

// 睡眠品質對應說明文字
const QUALITY_LABELS = ['', '很差', '較差', '普通', '良好', '很好']

/**
 * 睡眠記錄區段
 * 包含入睡時間、起床時間、品質評分、備註
 */
export default function SleepSection({ value, onChange, errors }: Props) {
  /** 更新單一欄位並回傳完整資料 */
  function update(field: keyof SleepFormData, val: string | number | null) {
    onChange({ ...value, [field]: val })
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-5">睡眠記錄</h2>

      {/* 入睡 / 起床時間 */}
      <div className="grid grid-cols-2 gap-4 mb-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">入睡時間</label>
          <input
            type="time"
            value={value.sleep_time}
            onChange={e => update('sleep_time', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                         errors?.time_conflict || errors?.duration
                           ? 'border-red-400'
                           : 'border-gray-300'
                       }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">起床時間</label>
          <input
            type="time"
            value={value.wake_time}
            onChange={e => update('wake_time', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                         errors?.time_conflict || errors?.duration
                           ? 'border-red-400'
                           : 'border-gray-300'
                       }`}
          />
        </div>
      </div>
      {(errors?.time_conflict || errors?.duration) && (
        <p className="text-red-500 text-xs mb-4">{errors.time_conflict ?? errors.duration}</p>
      )}

      {/* 睡眠品質評分 1-5 */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          睡眠品質
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              type="button"
              onClick={() => update('quality_score', value.quality_score === score ? null : score)}
              className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                value.quality_score === score
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {score}
              <span className="block text-xs opacity-70 mt-0.5">{QUALITY_LABELS[score]}</span>
            </button>
          ))}
        </div>
        {errors?.quality && (
          <p className="text-red-500 text-xs mt-1">{errors.quality}</p>
        )}
      </div>

      {/* 備註 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
        <textarea
          value={value.notes}
          onChange={e => update('notes', e.target.value)}
          rows={2}
          placeholder="例如：失眠、多夢、早醒..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none
                     placeholder:text-gray-400"
        />
      </div>
    </section>
  )
}
