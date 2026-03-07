# Database Schema — 健康調理平台

本目錄包含 Supabase（PostgreSQL）的資料庫定義與初始資料。

> **法規提醒**：本系統為行為模式導向的健康管理工具，非醫療器材。所有資料欄位不涉及診斷、治療、病因、處方。

---

## 檔案說明

| 檔案 | 用途 |
|------|------|
| `schema.sql` | 建立所有資料表、觸發器、RLS Policy |
| `seed.sql` | 插入系統預設標籤資料 |

**執行順序**：`schema.sql` → `seed.sql`

---

## 資料表總覽

```
auth.users (Supabase 內建)
    └── profiles               使用者基本資料

profiles
    └── daily_records          每日記錄主表（每人每日唯一）
            ├── sleep_logs          睡眠記錄
            ├── diet_logs           飲食記錄
            ├── body_sensation_logs 身體感受記錄
            │       ├── body_sensation_area_tags  ←→ body_area_tags
            │       └── body_sensation_type_tags  ←→ sensation_type_tags
            └── wellness_logs       調理項目記錄
                    └── wellness_log_tags          ←→ wellness_activity_tags
    └── ai_analysis_results    AI 行為模式摘要（n8n + Ollama 產生）

標籤資料表（系統預設，唯讀）
    ├── wellness_activity_tags
    ├── body_area_tags
    └── sensation_type_tags
```

---

## 資料表詳細說明

### `profiles` — 使用者基本資料

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid PK | 對應 `auth.users.id` |
| `display_name` | text | 顯示名稱（非真實姓名，遵循 PDPA） |
| `timezone` | text | 時區，預設 `Asia/Taipei` |
| `created_at` | timestamptz | 建立時間 |

新使用者註冊後，由觸發器 `on_auth_user_created` 自動建立對應 profile。

---

### `daily_records` — 每日記錄主表

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid PK | |
| `user_id` | uuid FK | 關聯 `profiles.id` |
| `record_date` | date | 記錄日期，每位使用者每天唯一 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | 由觸發器自動更新 |

---

### `sleep_logs` — 睡眠記錄

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid PK | |
| `record_id` | uuid FK | 關聯 `daily_records.id` |
| `sleep_time` | time | 入睡時間 |
| `wake_time` | time | 起床時間 |
| `duration_hours` | numeric(4,2) | 總睡眠時數 |
| `quality_score` | smallint | 主觀品質 1（差）～ 5（優） |
| `notes` | text | 補充備註 |

---

### `diet_logs` — 飲食記錄

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid PK | |
| `record_id` | uuid FK | 關聯 `daily_records.id` |
| `meal_type` | text | `breakfast` / `lunch` / `dinner` / `snack` |
| `description` | text | 飲食內容描述 |
| `water_intake_ml` | integer | 飲水量（ml） |
| `notes` | text | 補充備註 |

一日可有多筆，對應不同餐次。

---

### `body_sensation_logs` — 身體感受記錄

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid PK | |
| `record_id` | uuid FK | 關聯 `daily_records.id` |
| `energy_level` | smallint | 精力水準 1～5 |
| `stress_level` | smallint | 壓力感受 1～5 |
| `mood_score` | smallint | 心情 1～5 |
| `custom_note` | text | 使用者自述（非診斷性文字） |

透過關聯表選擇標籤：
- `body_sensation_area_tags` → `body_area_tags`（身體部位）
- `body_sensation_type_tags` → `sensation_type_tags`（感受類型）

---

### `wellness_logs` — 調理項目記錄

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid PK | |
| `record_id` | uuid FK | 關聯 `daily_records.id` |
| `duration_minutes` | integer | 執行時間（分鐘） |
| `custom_note` | text | 使用者自述補充 |

透過 `wellness_log_tags` → `wellness_activity_tags` 選擇調理類型標籤。

---

### `ai_analysis_results` — AI 行為模式摘要

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid PK | |
| `user_id` | uuid FK | 關聯 `profiles.id` |
| `analysis_date` | date | 分析基準日 |
| `summary` | text | 行為模式摘要（非診斷內容） |
| `model_version` | text | Ollama 模型名稱，例如：`llama3.2` |
| `generated_at` | timestamptz | n8n 觸發時間 |

寫入由 n8n 使用 `service_role` 執行，一般使用者僅有讀取權限。

---

## 標籤資料表

所有標籤表皆有 `is_custom` 欄位：
- `false`：系統預設標籤（由 `seed.sql` 填入）
- `true`：人工審核後新增的自訂標籤

### `wellness_activity_tags` — 調理活動標籤

| 分類 | 標籤 |
|------|------|
| 整復推拿類 | 傳統整復、筋膜放鬆、關節鬆動 |
| 穴位類 | 穴位按壓、經絡疏通 |
| 民俗調理類 | 拔罐、刮痧、筋膜刀、芳療 |
| 輔助調理類 | 熱敷、冰敷、泡澡、伸展、瑜伽 |
| 生活習慣類 | 冥想、呼吸練習、散步、有氧運動 |

### `body_area_tags` — 身體部位標籤

頭部、頸部、後枕部、肩膀、上背、下背、腰部、手臂、手肘、手腕、手掌、胸口、腹部、肋骨側邊、臀部、大腿、膝蓋、小腿、腳踝、足底

### `sensation_type_tags` — 感受類型標籤

緊繃、痠、脹、麻、沉重感、疲勞感、循環不順、關節卡頓、活動受限

---

## Row Level Security（RLS）

| 資料表 | 使用者權限 | 備註 |
|--------|-----------|------|
| `profiles` | 讀取/新增/更新自己的資料 | |
| `daily_records` | 完整 CRUD（僅限自己） | |
| `sleep_logs` | 完整 CRUD（透過 daily_records 驗證） | |
| `diet_logs` | 完整 CRUD（透過 daily_records 驗證） | |
| `body_sensation_logs` | 完整 CRUD（透過 daily_records 驗證） | |
| `wellness_logs` | 完整 CRUD（透過 daily_records 驗證） | |
| `ai_analysis_results` | 唯讀 | 寫入由 n8n service_role 執行 |
| 標籤三表 | 唯讀（所有認證使用者） | 寫入僅限 service_role |

---

## 下一步

- [ ] 在 Supabase Dashboard > SQL Editor 依序執行 `schema.sql`、`seed.sql`
- [ ] 在 Supabase Dashboard > Authentication 啟用 Email/Password 登入
- [ ] 設定 n8n webhook URL 並配置 `service_role` API Key
- [ ] 前端安裝 `@supabase/supabase-js` 並建立 client
