'use client'

// 飲食記錄區段元件（支援多筆餐次動態新增）
import type { DietFormData } from '@/types'

interface Props {
  value: DietFormData[]
  onChange: (data: DietFormData[]) => void
}

const MEAL_TYPES = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch',     label: '午餐' },
  { value: 'dinner',    label: '晚餐' },
  { value: 'snack',     label: '點心' },
]

/** 空白餐次預設值 */
const EMPTY_DIET: DietFormData = {
  meal_type: 'breakfast',
  description: '',
  water_intake_ml: '',
  notes: '',
}

/**
 * 飲食記錄區段
 * 使用者可動態新增/移除多筆餐次，每筆包含餐別、飲食描述、飲水量
 */
export default function DietSection({ value, onChange }: Props) {
  /** 更新指定索引的餐次欄位 */
  function updateItem(index: number, field: keyof DietFormData, val: string) {
    const next = [...value]
    next[index] = { ...next[index], [field]: val }
    onChange(next)
  }

  /** 新增一筆空白餐次 */
  function addItem() {
    onChange([...value, { ...EMPTY_DIET }])
  }

  /** 移除指定索引的餐次 */
  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">飲食記錄</h2>
        <button
          type="button"
          onClick={addItem}
          className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200
                     hover:border-gray-400 px-3 py-1 rounded-lg transition-all"
        >
          ＋ 新增餐次
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          點擊「新增餐次」開始記錄飲食
        </p>
      )}

      <div className="space-y-4">
        {value.map((item, index) => (
          <div key={index} className="border border-gray-100 rounded-xl p-4 bg-gray-50">

            {/* 餐別選擇 + 移除按鈕 */}
            <div className="flex items-center justify-between mb-3">
              <select
                value={item.meal_type}
                onChange={e => updateItem(index, 'meal_type', e.target.value)}
                className="text-sm font-medium text-gray-700 bg-transparent border-none
                           focus:outline-none cursor-pointer"
              >
                {MEAL_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                移除
              </button>
            </div>

            {/* 飲食內容描述 */}
            <textarea
              value={item.description}
              onChange={e => updateItem(index, 'description', e.target.value)}
              rows={2}
              placeholder="飲食內容..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none
                         bg-white placeholder:text-gray-400 mb-3"
            />

            {/* 飲水量 */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={item.water_intake_ml}
                onChange={e => updateItem(index, 'water_intake_ml', e.target.value)}
                placeholder="飲水量"
                min={0}
                className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-gray-900
                           bg-white placeholder:text-gray-400"
              />
              <span className="text-sm text-gray-500">ml</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
