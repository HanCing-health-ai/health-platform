// ============================================================
// 健康調理記錄平台 — TypeScript 型別定義
// 對應 Supabase PostgreSQL Schema
// ============================================================

// ---- 標籤資料表型別 ----

/** 調理活動標籤（wellness_activity_tags） */
export interface WellnessActivityTag {
  id: string
  name: string
  category: string      // 分類：整復推拿類、穴位類、民俗調理類、輔助調理類、生活習慣類
  is_custom: boolean    // false = 系統預設；true = 人工審核新增
  created_at: string
}

/** 身體部位標籤（body_area_tags） */
export interface BodyAreaTag {
  id: string
  name: string
  is_custom: boolean
  created_at: string
}

/** 感受類型標籤（sensation_type_tags） */
export interface SensationTypeTag {
  id: string
  name: string
  is_custom: boolean
  created_at: string
}

// ---- 資料表記錄型別 ----

/** 每日記錄主表（daily_records） */
export interface DailyRecord {
  id: string
  user_id: string
  record_date: string   // YYYY-MM-DD
  created_at: string
  updated_at: string
}

/** 睡眠記錄（sleep_logs） */
export interface SleepLog {
  id: string
  record_id: string
  sleep_time: string | null    // HH:MM
  wake_time: string | null
  duration_hours: number | null
  quality_score: number | null // 1-5
  notes: string | null
}

/** 飲食記錄（diet_logs） */
export interface DietLog {
  id: string
  record_id: string
  meal_type: string | null     // breakfast | lunch | dinner | snack
  description: string | null
  water_intake_ml: number | null
  notes: string | null
}

/** 身體感受記錄（body_sensation_logs） */
export interface BodySensationLog {
  id: string
  record_id: string
  energy_level: number | null  // 1-5
  stress_level: number | null  // 1-5
  mood_score: number | null    // 1-5
  custom_note: string | null   // 使用者自述（非診斷性文字）
}

/** 調理項目記錄（wellness_logs） */
export interface WellnessLog {
  id: string
  record_id: string
  duration_minutes: number | null
  custom_note: string | null
}

// ---- 表單資料型別 ----

/** 睡眠區段表單資料 */
export interface SleepFormData {
  sleep_time: string
  wake_time: string
  quality_score: number | null
  notes: string
}

/** 飲食單筆表單資料 */
export interface DietFormData {
  meal_type: string
  description: string
  water_intake_ml: string  // 字串；送出時轉換為整數
  notes: string
}

/** 身體感受區段表單資料 */
export interface BodySensationFormData {
  energy_level: number | null
  stress_level: number | null
  mood_score: number | null
  area_tag_ids: string[]
  sensation_type_tag_ids: string[]
  custom_note: string
}

/** 調理項目單筆表單資料 */
export interface WellnessFormData {
  tag_ids: string[]
  duration_minutes: string  // 字串；送出時轉換為整數
  custom_note: string
}

/** 每日記錄完整表單提交資料（POST /api/daily-record 的 payload） */
export interface DailyRecordPayload {
  record_date: string   // YYYY-MM-DD
  sleep: SleepFormData
  diet: DietFormData[]
  body_sensation: BodySensationFormData
  wellness: WellnessFormData[]
}

// ---- AI 分析結果 ----

/** Ollama AI 行為模式摘要（ai_analysis_results）
 *  注意：summary 欄位內容為行為模式摘要，不得涉及醫療診斷
 */
export interface AiAnalysisResult {
  id: string
  user_id: string
  analysis_date: string       // YYYY-MM-DD
  summary: string             // 行為模式摘要（非診斷文字）
  model_version: string | null
  generated_at: string
}

// ---- 使用者資料 ----

/** 使用者設定檔（不含敏感健康數據，遵循 PDPA） */
export interface UserProfile {
  id: string
  display_name: string | null  // 顯示名稱（非真實姓名）
  timezone: string
  created_at: string
}
