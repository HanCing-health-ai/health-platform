'use client'

// 調理項目記錄區段元件（支援多筆動態新增）
import type { WellnessActivityTag, WellnessFormData } from '@/types'

interface Props {
  value: WellnessFormData[]
  onChange: (data: WellnessFormData[]) => void
  wellnessTags: WellnessActivityTag[]
}

/** 空白調理項目預設值 */
const EMPTY_WELLNESS: WellnessFormData = {
  tag_ids: [],
  duration_minutes: '',
  custom_note: '',
}

/**
 * 調理項目記錄區段
 * 使用者可新增多筆調理項目，每筆可選多個活動標籤（按分類分組顯示）
 */
export default function WellnessSection({ value, onChange, wellnessTags }: Props) {
  /** 按 category 分組調理標籤，保留原始排序 */
  const grouped = wellnessTags.reduce<Record<string, WellnessActivityTag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {})

  /** 更新指定索引調理項目的欄位 */
  function updateItem(index: number, field: keyof WellnessFormData, val: string | string[]) {
    const next = [...value]
    next[index] = { ...next[index], [field]: val }
    onChange(next)
  }

  /** 切換指定調理項目的標籤選取狀態 */
  function toggleTag(index: number, tagId: string) {
    const current = value[index].tag_ids
    const next = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId]
    updateItem(index, 'tag_ids', next)
  }

  /** 新增一筆空白調理項目 */
  function addItem() {
    onChange([...value, { ...EMPTY_WELLNESS, tag_ids: [] }])
  }

  /** 移除指定調理項目 */
  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">調理項目</h2>
        <button
          type="button"
          onClick={addItem}
          className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200
                     hover:border-gray-400 px-3 py-1 rounded-lg transition-all"
        >
          ＋ 新增調理
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          點擊「新增調理」開始記錄調理項目
        </p>
      )}

      <div className="space-y-5">
        {value.map((item, index) => (
          <div key={index} className="border border-gray-100 rounded-xl p-4 bg-gray-50">

            {/* 移除按鈕 */}
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                移除
              </button>
            </div>

            {/* 調理標籤選擇，依分類分組顯示 */}
            <div className="space-y-3 mb-4">
              {Object.entries(grouped).map(([category, tags]) => (
                <div key={category}>
                  <p className="text-xs text-gray-500 mb-1.5">{category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(index, tag.id)}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                          item.tag_ids.includes(tag.id)
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 執行時間 */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                value={item.duration_minutes}
                onChange={e => updateItem(index, 'duration_minutes', e.target.value)}
                placeholder="執行時間"
                min={1}
                className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-gray-900
                           bg-white placeholder:text-gray-400"
              />
              <span className="text-sm text-gray-500">分鐘</span>
            </div>

            {/* 補充說明 */}
            <textarea
              value={item.custom_note}
              onChange={e => updateItem(index, 'custom_note', e.target.value)}
              rows={2}
              placeholder="補充說明..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none
                         bg-white placeholder:text-gray-400"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
