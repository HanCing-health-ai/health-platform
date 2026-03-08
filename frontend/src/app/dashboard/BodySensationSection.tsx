'use client'

// 身體感受記錄區段元件
import type { BodyAreaTag, BodySensationFormData, SensationTypeTag } from '@/types'

interface BodyErrors {
  scores?: string
  area_sensation?: string
}

interface Props {
  value: BodySensationFormData
  onChange: (data: BodySensationFormData) => void
  bodyAreaTags: BodyAreaTag[]
  sensationTags: SensationTypeTag[]
  errors?: BodyErrors
}

// 各評分欄位的說明文字（index 對應分數 1-5）
const SCORE_LABELS: Record<string, string[]> = {
  energy_level: ['', '極低', '偏低', '普通', '充沛', '很好'],
  stress_level: ['', '很放鬆', '略有', '普通', '有些緊', '很緊繃'],
  mood_score:   ['', '很差', '較差', '普通', '良好', '很好'],
}

interface ScoreSelectorProps {
  field: keyof typeof SCORE_LABELS
  label: string
  value: number | null
  onChange: (val: number | null) => void
}

/**
 * 1-5 分評分選擇器
 * 再次點擊已選分數可取消選取
 */
function ScoreSelector({ field, label, value, onChange }: ScoreSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(score => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(value === score ? null : score)}
            className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
              value === score
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {score}
            <span className="block text-xs opacity-70 mt-0.5">
              {SCORE_LABELS[field][score]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * 身體感受記錄區段
 * 包含精力/壓力/心情評分、身體部位標籤、感受類型標籤、自述備註
 * 自述欄位提示使用者描述行為感受，避免醫療診斷語言
 */
export default function BodySensationSection({
  value,
  onChange,
  bodyAreaTags,
  sensationTags,
  errors,
}: Props) {
  /** 更新單一評分欄位 */
  function updateScore(
    field: 'energy_level' | 'stress_level' | 'mood_score',
    val: number | null
  ) {
    onChange({ ...value, [field]: val })
  }

  /** 切換標籤選取狀態 */
  function toggleTag(
    field: 'area_tag_ids' | 'sensation_type_tag_ids',
    tagId: string
  ) {
    const current = value[field]
    const next = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId]
    onChange({ ...value, [field]: next })
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-900">身體感受</h2>

      {/* 精力水準 */}
      <ScoreSelector
        field="energy_level"
        label="精力水準"
        value={value.energy_level}
        onChange={v => updateScore('energy_level', v)}
      />

      {/* 壓力感受 */}
      <ScoreSelector
        field="stress_level"
        label="壓力感受"
        value={value.stress_level}
        onChange={v => updateScore('stress_level', v)}
      />

      {/* 心情 */}
      <ScoreSelector
        field="mood_score"
        label="心情"
        value={value.mood_score}
        onChange={v => updateScore('mood_score', v)}
      />
      {errors?.scores && (
        <p className="text-red-500 text-sm font-medium -mt-2">⚠️ {errors.scores}</p>
      )}

      {/* 感受部位標籤（多選） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          感受部位
          <span className="text-gray-400 font-normal ml-1">（可複選）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {bodyAreaTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag('area_tag_ids', tag.id)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                value.area_tag_ids.includes(tag.id)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* 感受類型標籤（多選） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          感受類型
          <span className="text-gray-400 font-normal ml-1">（可複選）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {sensationTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag('sensation_type_tag_ids', tag.id)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                value.sensation_type_tag_ids.includes(tag.id)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
        {errors?.area_sensation && (
          <p className="text-red-500 text-sm font-medium mt-1">⚠️ {errors.area_sensation}</p>
        )}
      </div>

      {/* 自述備註（提示為行為感受，非醫療診斷） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          自述補充
          <span className="text-gray-400 font-normal ml-1 text-xs">
            （請描述行為感受，非醫療症狀）
          </span>
        </label>
        <textarea
          value={value.custom_note}
          onChange={e => onChange({ ...value, custom_note: e.target.value })}
          rows={3}
          placeholder="例如：久坐後起身時肩頸有些僵硬感..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none
                     placeholder:text-gray-400"
        />
      </div>
    </section>
  )
}
