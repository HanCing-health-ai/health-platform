# 專案名稱
跨技術健康調理資料整合與決策支援引擎（ConditionAI）

---

# 專案定位（AI 行為硬性邊界）
本系統為「行為模式導向的健康管理工具」，非醫療器材。
⛔ 嚴禁產生任何涉及「診斷」「治療」「病因」「處方」「症狀」「疾病」的程式碼或輸出文字。
✅ 允許：記錄、統計、趨勢視覺化、行為提醒、調理建議（非醫療性質）。
違反此規範的任何修改，Claude 必須主動拒絕並說明原因。

---

# 技術架構（V1 現況）
- 前端：Next.js 14（App Router）+ TypeScript + Tailwind CSS
- 後端：Python 3.11 + FastAPI（backend/main.py）
- AI 串接：Claude API（claude-sonnet-4-20250514）Structured Output
- 資料庫：Supabase（PostgreSQL + Auth + RLS）
- 部署：Vercel（前端）+ 本地開發（FastAPI，待部署 VPS）
- 版本控制：Git + GitHub（HanCing-health-ai/health-platform）

---

# 資料夾結構
/frontend        → Next.js 前端專案
/backend         → FastAPI 後端（main.py、risk_triage.py、injection_guard.py）
/backend/docs    → system_prompt_v1.md
/workflows       → n8n 工作流匯出 JSON
/database        → Supabase schema、migration SQL
/docs            → 企劃書、競賽說明書、API 文件

---

# 絕對禁止事項（任何情況下不可違反）
- 不可讀取或修改 .env 與 .env.local（含 API Key）
- 不可修改 venv/ 資料夾內任何內容
- 不可升級 Next.js 版本（維持 14）
- 不可修改 Supabase RLS 設定（需先確認再動）
- 不可刪除任何資料庫資料表
- 不可修改 risk_triage.py 的 C 類阻斷邏輯（需先說明修改理由）
- 不可修改 injection_guard.py 的阻斷機制（需先說明修改理由）
- 不可在客戶端輸出中加入任何醫療用語

---

# 修改前必須確認的高風險檔案
以下檔案修改前，Claude 必須先說明「要改什麼」「為什麼要改」，等待確認後才動：
- backend/risk_triage.py
- backend/injection_guard.py
- backend/docs/system_prompt_v1.md
- frontend/src/lib/supabase/server.ts
- frontend/src/middleware.ts

---

# 已完成功能
- 登入/註冊流程（/login + /auth/callback）
- 每日記錄表單（DailyRecordForm.tsx）含 AI 分析串接
- 前端表單驗證（睡眠、身體感受）
- AI 建議卡片（Tab 切換：客戶版／師傅版）
- AI 分析結果持久化（ai_analysis_results 資料表，每日限一次）
- 師傅端 AI 採納按鈕（已參考／本次未使用，寫入 practitioner_adopted）
- 歷史記錄查看（/dashboard/history）含 AI 分析顯示
- 14天趨勢圖表
- FastAPI 後端（/api/analyze + /api/demo/sample）
- Prompt Injection 防護（injection_guard.py，6 案例通過）
- 風險分流（risk_triage.py，A/B/C 三類）

---

# 技術待辦清單（依優先順序）

## 🔴 上線前必須完成（等 VPS）
- [ ] Hetzner VPS 建立 + FastAPI 部署
- [ ] Layer 5 VPS 安全強化（UFW、SSH Key、Nginx、fail2ban）
- [ ] Webhook Token 驗證（Layer 1）
- [ ] n8n 工作流三條串接（client_intake / follow_up_trigger / daily_summary）

## 🟡 試點前必須完成（現在可做）
- [ ] Input Quality Gate（字數不足/部位未選/24小時去重）
- [ ] localStorage 表單暫存（防重新整理資料消失）
- [ ] 調理項目說明文字 + 客戶偏好調理方式欄位
- [ ] RWD 手機版檢查與修正

## 🟢 V1.5（體驗優化）
- [ ] 師傅端服務成效摘要（本月 X 位客戶完成回訪，平均改善 +Y）
- [ ] 問卷視覺完成感優化
- [ ] treatment_records 資料結構啟用
- [ ] 歷史 AI 分析時間軸頁面

---

# 開發規範
- 語言：TypeScript 優先（前端）、Python（後端）
- 所有函式必須加繁體中文註解說明用途
- 資料庫欄位命名：英文蛇底線（snake_case）
- 元件命名：大寫駝峰（PascalCase）
- 使用者健康資料：不得明文儲存姓名+健康數據的組合（PDPA）
- API 路由統一放在 /app/api/ 目錄下
- 環境變數一律用 os.getenv()（Python）或 process.env（TypeScript），不寫死在程式碼

---

# 標準開發流程
1. 修改前先讀取相關檔案確認現有邏輯
2. 高風險檔案修改前先說明理由，等待確認
3. 前端修改後執行 npx tsc --noEmit 確認無 TypeScript 錯誤
4. 後端修改後確認 uvicorn 能正常啟動
5. 確認無誤後 git add . → git commit → git push

---

# 每次完成功能模組後，主動提示：
1. 這個模組需要哪些邊界條件（edge case）需要處理？
2. 這個功能是否觸碰到「非醫療器材」的法規紅線？
3. 是否需要同步更新 CLAUDE.md 的技術待辦清單？

---

# ConditionAI 專案規範
## 技術框架
- Frontend: Next.js 14 + TypeScript + Tailwind CSS (Vercel)
- Backend: Python FastAPI (VPS 部署)
- Database: Supabase (project ID: xtflhovbdicvkpacnrmj)
- AI: Claude API claude-sonnet-4-20250514, Structured Output
- Workflow: n8n (VPS 自架)
- Git: HanCing-health-ai 組織，主分支 main

## 目錄結構重點
- /src/app → Next.js App Router 頁面
- /src/app/actions.ts → Server Actions（Antigravity 主要作業區）
- /src/components → UI 元件
- /docs/ → 規格文件（部分已加入 .gitignore）
- /.claude/skills/ → 自訂 Skills
- /.claude/commands/ → Slash Commands

## 合規紅線（最高優先級）
client_output 任何欄位絕對禁止出現：
診斷、確診、病因、病症、症狀、疾病、病變、治療、療效、醫治、
處方、藥物、痊癒、康復、治癒、風險、併發症、惡化、緊急、危險

## 嚴格禁止
- 修改 System Prompt（只有 Claude 策略端輸出新版本才能更新）
- 刪除或修改 RLS 設定
- 將任何金鑰寫入程式碼
- 修改 .gitignore 中已列出的檔案

## gstack 指令（已安裝）
- /office-hours：版本開始前確認方向
- /cso：VPS 上線前資安掃描
- /qa + /browse：功能測試 + RWD 驗證
- /guard：正式環境作業時開啟
- /investigate：除錯（未調查不修復）