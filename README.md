# ConditionAI — 健康調理行為模式分析與決策支援引擎

AI-powered behavioral pattern analysis and decision support engine for traditional bodywork practitioners in Taiwan.

> **系統定位：行為模式導向的健康管理工具，不涉及醫療診斷或治療**

## 專案簡介

台灣整復推拿產業逾 4,800 家業者、10 萬名從業人員，長期停留在師徒口傳模式，
缺乏系統化資料支撐。ConditionAI 透過五層資料決策引擎與 Structured Output 雙向輸出架構，
同時服務調理師與客戶：

- **調理師**：獲得跨部位連動分析、建議調理順序與可解釋式建議理由，精準定位問題根源
- **客戶**：獲得身體使用模式洞察與可行動的生活習慣調整建議

系統採用 **Human-in-the-loop** 設計原則：AI 負責資料分析與方案生成，師傅保有最終調理決策權。

## 核心架構

### Two-Phase Judgment 兩階段判斷架構

- **Phase 1 — 規則引擎（快速、零成本）**：C 類關鍵字掃描 → B/A 規則分流 → 規則式行為標籤產出。涵蓋 70-80% 常見情境。
- **Phase 2 — Claude API Structured Output（複雜案例）**：自然語言生活習慣深層分析、多部位連動模式識別、建議理由產出。單次 API 呼叫同時產出師傅版＋客戶版＋行為標籤 JSON。

### 五層資料決策引擎

| 層 | 名稱 | 功能 |
|---|---|---|
| 第一層 | 風險分流層 | A 一般型 / B 恢復期 / C 建議就醫，法規合規核心 |
| 第二層 | 背景標記層 | 職業負荷、舊傷史等多因素標記 |
| 第三層 | 行為分群層 | 多部位分布＋行為標籤→分群 |
| 第四層 | 可解釋式排序層 | 建議排序＋信心分數，非黑箱 |
| 第五層 | 驗證優化層 | 每日自動 review → 優化建議 → 人工決策執行 |

## 目前已完成（V1 測試版）

### 前端（Next.js 14，已部署 Vercel）
- 每日記錄表單（睡眠/飲食/壓力/感受）
- 表單驗證與錯誤提示
- 歷史記錄查看（展開/收合）
- 14 天身體趨勢折線圖
- 主訴優先欄位
- 登入/註冊/Email 驗證完整流程
- AI 建議卡片 Tab 切換（客戶版/師傅版分離）

### 後端（Python FastAPI）
- Claude API Structured Output 雙向輸出串接
- AI 分析結果持久化儲存至 Supabase（每日限一次）
- 頁面重新整理自動還原 AI 結果

### 安全模組
- `risk_triage.py` — A/B/C 三類風險分流
- `injection_guard.py` — Prompt Injection 前置掃描（6 案例測試通過）
- `prompt_injection_patterns.json` — 五組注入關鍵字群（角色覆寫/醫療越界/資料探測/身分冒充/邊界試探）
- `triage_keywords.json` — C 類觸發關鍵字庫
- `system_prompt_v1.md` — Claude API System Prompt 含五項核心指令結構＋語言禁區＋行為模式知識庫

### 資料庫（Supabase）
- 12 張資料表（含核心 8 張＋輔助 4 張）
- RLS 資料隔離規則
- injection_attempts 異常記錄表
- ai_analysis_results 雙向輸出持久化

### 文件
- 作品說明書 V4.3（技術架構、商業模式、五層決策引擎、資安五層防護、SWOT 分析、三階段商業規劃）

## 技術棧

| 工具 | 角色 | 說明 |
|---|---|---|
| Next.js 14 | 前端介面 | 已部署 Vercel，問卷前端、客戶端、師傅端 |
| Supabase | 資料庫＋API | 12 張資料表＋RLS 權限隔離 |
| Python FastAPI | 後端 | 風險分流＋Prompt Injection 過濾＋Claude API 串接＋回傳驗證 |
| Claude API | Structured Output 引擎 | 單次呼叫產出師傅版＋客戶版＋行為標籤 JSON |
| n8n | 自動化工作流 | 問卷→分流→寫庫→Line Notify |
| Line Notify | 通知推送 | 師傅端即時通知、客戶回訪提醒 |
| Ollama | 本地 LLM（V2） | 消除雲端 API 費用，資料不離境 |

## AI 輕量化設計

- **規則優先**：V1 以 Python 規則模型實作，無需 GPU、無需訓練資料
- **模型分級**：行為模式分析使用 Sonnet（推理能力），每日摘要使用 Haiku（成本降至 1/10）
- **本地推論**：V2 引入 Ollama，資料不離境，成本趨近 0
- **漸進式演進**：規則分群 → K-means 聚類（資料 ≥500 筆後引入）

## 資安五層防護

| 防護層 | 防範對象 | 可靠度等級 |
|---|---|---|
| Layer 1 Webhook 驗證 | 偽造問卷、惡意觸發 | 程式碼層（硬性阻斷） |
| Layer 2 Prompt Injection | LLM 角色覆寫、醫療越界 | 程式碼層＋Prompt 層（雙重防護） |
| Layer 3 Line 通訊安全 | Token 外洩、身分冒充 | 程式碼層 |
| Layer 4 Supabase RLS | 跨工作室資料存取 | 程式碼層（硬性阻斷） |
| Layer 5 VPS 強化 | 暴力攻擊、連接埠掃描 | 程式碼層 |

## 語言規範

所有系統輸出嚴格遵守非醫療語言規範：
- ✅ 使用：身體使用模式、行為負荷、調理建議、行為調整建議
- ❌ 不使用：診斷、治療、疾病、症狀、風險、處方

## 授權

Private — 智慧創新大賽參賽作品
