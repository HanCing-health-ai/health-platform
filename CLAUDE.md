# ConditionAI — 開發工作區設定
跨技術健康調理資料整合與決策支援引擎

---

## 一、專案定位（AI 行為硬性邊界）

本系統為「行為模式導向的健康管理工具」，非醫療器材。

⛔ **絕對禁止** 產生任何涉及以下詞彙的程式碼或輸出文字：
診斷、確診、病因、病症、症狀、疾病、病變、治療、療效、醫治、
處方、藥物、痊癒、康康復、治癒、風險、併發症、惡化、緊急、危險

✅ **允許**：記錄、統計、趨勢視覺化、行為提醒、調理建議（非醫療性質）

違反此規範的任何修改，Antigravity 必須主動拒絕並說明原因。
師傅保有最終調理決策權，AI 輸出是建議不是指令。

---

## 二、技術架構（目前真實狀態）

| 層級 | 技術 | 說明 |
|------|------|------|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS | Vercel 部署 |
| 後端 | Python 3.11 + FastAPI | VPS 部署 |
| AI | Claude API (claude-sonnet-4-6) | Structured Output |
| 資料庫 | Supabase (PostgreSQL + Auth + RLS) | 15 張資料表 |
| 工作流 | n8n Cloud | https://hancing.app.n8n.cloud |
| 版本控制 | Git + GitHub | 主分支：**master**（非 main） |

**重要：主分支是 `master`，不是 `main`，所有 push/pull 請確認分支名稱。**

---

## 三、目錄結構

```
/src/app              → Next.js App Router 頁面
/src/app/actions.ts   → Server Actions（主要業務邏輯）
/src/components       → UI 元件
/backend              → FastAPI（main.py / risk_triage.py / injection_guard.py）
/backend/docs         → system_prompt_v2.1.md
/workflows            → n8n 工作流匯出 JSON
/database             → schema.sql（含 V1.5 B組三張新表）
/docs                 → 企劃書、規格文件
/.claude/commands/    → Slash Commands 指令集
/.claude/skills/      → 自訂 Skills
```

---

## 四、資料庫（15 張資料表）

### V1 核心表（12 張）
- `studios` — 工作室主體
- `profiles` — 師傅資料（注意：不是 practitioners）
- `clients` — 客戶基本資料
- `questionnaire_responses` — 問卷每次一筆
- `triage_results` — 風險分流結果
- `behavior_tags` — 行為模式標籤
- `follow_up_responses` — 定期回訪資料
- `insight_reports` — AI 雙向輸出（注意：不是 ai_analysis_results）
- `treatment_records` — 調理記錄
- `injection_attempts` — 注入嘗試記錄
- `blocked_clients` — 封鎖記錄
- `body_sensation_logs` — 身體感受記錄

### V1.5 B組新增（3 張）
- `knowledge_base` — 知識管理 Agent 主表（5 筆種子資料已種入）
- `tag_library` — 動態標籤庫（5 筆初始標籤已種入）
- `credits` — 師傅點數系統

---

## 五、版本進度

### ✅ V1 已完成（最終驗收通過）
- FastAPI 後端 + Claude API Structured Output 雙向輸出
- Tab 切換介面（師傅版/客戶版）
- AI 採納按鈕 Toast 回饋
- 風險分流規則模型（A/B/C）+ Input Quality Gate
- RWD 響應式設計（44px 熱區，390px 驗證）
- System Prompt V2.1
- Supabase 15 張資料表 + RLS
- Git 建立，commit 流程確立

### ✅ V1.5 A組已完成
- 師傅登入（`?role=staff` Session 驗證）
- 角色分流
- `is_test` 旗標（四表覆蓋）

### ✅ V1.5 B組 Wave 1 已完成
- `knowledge_base` / `tag_library` / `credits` 三張資料表建立
- RLS 啟用，GIN 索引建立
- `tag_library` 五筆初始標籤種入

### ✅ V1.5 B組 Wave 2 已完成
- `get_relevant_knowledge()` 函數實作
- 個體適用性過濾邏輯（七層過濾）
- Prompt 知識注入（師傅最終決策優先）
- `insight_reports.metadata` JSONB 欄位新增
- `knowledge_base` 五筆種子資料種入
- Prompt 合規語言修正（移除「必須採納」）

### 🔜 V1.5 B組 Wave 3（進行中）
- n8n Cloud 工作流四：Multi-Agent 知識審核流水線
  - 工作流 A：知識提交 → 四 Agent 處理 → 寫入 `pending_review` → LINE 通知審核者
  - 工作流 B：審核決策 → 更新 status → 通知師傅 → 更新 `credits`

### ⏳ V1 遺留（另排時間，不阻擋 V1.5）
- VPS 安全強化（UFW / SSH Key / fail2ban）
- 電話號碼 OTP 驗證漏洞（Gate 3 bypass）
- n8n 三條核心工作流串接（client_intake / follow_up / daily_summary）
- 筆電 git pull 同步 + `.env.local` 補 `N8N_WEBHOOK_URL`

---

## 六、絕對禁止事項

- 不可讀取或修改 `.env` 與 `.env.local`
- 不可修改 `venv/` 資料夾內容
- 不可升級 Next.js 版本（維持 14）
- 不可修改 Supabase RLS 設定（需先確認）
- 不可刪除任何資料庫資料表
- 不可修改 `risk_triage.py` 的 C 類阻斷邏輯（需先說明理由）
- 不可修改 `injection_guard.py` 的阻斷機制（需先說明理由）
- 不可修改 System Prompt（只有 Claude 策略端輸出新版本才能更新）
- 不可將任何金鑰寫入程式碼

---

## 七、高風險檔案（修改前必須說明理由並等待確認）

- `backend/risk_triage.py`
- `backend/injection_guard.py`
- `backend/docs/system_prompt_v2.1.md`
- `src/lib/supabase/server.ts`
- `src/middleware.ts`
- `src/app/actions.ts`（核心業務邏輯）

---

## 八、三方協作架構

| 角色 | 工具 | 職責 |
|------|------|------|
| **Claude（策略端）** | claude.ai 瀏覽器 | 規格定義、任務單產出、合規審查、商業決策 |
| **Antigravity（執行端）** | 獨立 IDE | 程式碼實作、測試、部署 |
| **Claude Code（測試端）** | VS Code terminal | npx tsc 驗證、RWD 測試，不負責寫程式 |
| **創辦人** | 傳遞者 | 任務傳遞、決策確認、最終驗收 |

**重要對應（永遠不要搞錯）：**
- 師傅資料表 = `profiles`（不是 practitioners）
- AI 分析資料表 = `insight_reports`（不是 ai_analysis_results）
- 主分支 = `master`（不是 main）
- n8n = Cloud 版（不是 VPS 自架）

---

## 九、Agent 角色框架

| 角色 | 前綴 | 負責範圍 |
|------|------|---------|
| 開發 Agent | `[開發]` | 程式碼實作、測試、部署 |
| 知識庫 Agent | `[知識庫]` | 穴位知識審核、合規語言、RAG 邏輯 |
| 架構審查 Agent | `[架構]` | 技術債評估、整體架構健診、優化建議 |
| 設計 Agent | `[設計]` | UI/UX 審查、RWD 驗證、視覺一致性 |

---

## 十、開發規範

- 語言：TypeScript 優先（前端）、Python（後端）
- 所有函式必須加繁體中文註解說明用途
- 資料庫欄位命名：英文蛇底線（snake_case）
- 元件命名：大寫駝峰（PascalCase）
- 使用者健康資料：不得明文儲存姓名+健康數據組合（PDPA）
- API 路由統一放在 `/app/api/` 目錄下
- 環境變數一律用 `os.getenv()`（Python）或 `process.env`（TypeScript）

---

## 十一、標準開發流程

1. 修改前先讀取相關檔案確認現有邏輯
2. 高風險檔案修改前先說明理由，等待確認
3. 前端修改後執行 `npx tsc --noEmit` 確認無 TypeScript 錯誤
4. 後端修改後確認 uvicorn 能正常啟動
5. 確認無誤後 `git add . → git commit → git push`
6. commit message 格式：`feat/fix/refactor: 說明（Wave/組別）`

---

## 十二、每次完成功能模組後，主動提示

1. 這個模組有哪些邊界條件（edge case）需要處理？
2. 這個功能是否觸碰「非醫療器材」的法規紅線？
3. 是否需要同步更新 `CLAUDE.md` 的版本進度？

---

## 十三、gstack 指令（已安裝）

| 指令 | 時機 |
|------|------|
| `/office-hours` | 每個 Wave 開始前確認方向 |
| `/cso` | 每次部署前資安掃描 |
| `/qa` + `/browse` | 功能完成後測試 + RWD 驗證 |
| `/guard` | 正式環境作業時開啟 |
| `/investigate` | 遇到 bug（未調查不修復） |
| `/validate-output` | AI 輸出合規驗證 |
| `/check-env` | 環境變數完整性檢查 |
| `/sync-prompt` | System Prompt 版本同步確認 |

---

## 十四、Claude Code 本地測試流程

Claude Code 定位為本地測試環境，不負責寫程式。
每個 Wave 完成後，由創辦人在桌電觸發：

```powershell
# 啟動 Claude Code（一般開發）
claude --dangerously-skip-permissions --channels plugin:discord@claude-plugins-official

# 啟動 Claude Code（正式環境部署，不加 skip-permissions）
claude --channels plugin:discord@claude-plugins-official
```

Claude Code 負責執行：
- `npx tsc --noEmit` — TypeScript 型別檢查
- `/qa` — 功能測試
- `/browse` — RWD 390px 驗證
- `/cso` — 部署前資安掃描

**Discord 頻道用途：**
- `#antigravity-tasks` — 對 Claude Code 下達遠端指令
- `#antigravity-report` — 接收回報

---

*本文件由 Claude 策略端定義，Antigravity 執行端維護。*
*每完成一個 Wave 同步更新版本進度區塊。*
*最後更新：2026-03-28 | V1.5 B組 Wave 2 完成，Wave 3 進行中*
