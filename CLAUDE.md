\# 專案名稱

跨技術健康調理資料整合與決策支援平台



---



\# 專案定位（AI 行為硬性邊界）

本系統為「行為模式導向的健康管理工具」，非醫療器材。

⛔ 嚴禁產生任何涉及「診斷」、「治療」、「病因」、「處方」的程式碼或文字。

✅ 允許：記錄、統計、趨勢視覺化、行為提醒、調理建議（非醫療性質）。



---



\# 核心使用者流程

1\. 使用者登入（Supabase Auth）

2\. 填寫每日健康調理記錄（睡眠、飲食、身體感受、調理項目）

3\. 資料存入 Supabase 資料庫

4\. n8n 工作流觸發：整理資料 → 送入 Ollama 本地模型分析

5\. 回傳「行為模式摘要」顯示在前端 Dashboard



---



\# 技術架構

\- 前端：Next.js 14（App Router）

\- 後端自動化：n8n

\- 資料庫：Supabase（PostgreSQL + Auth + Storage）

\- 本地 AI 推論：Ollama

\- 部署：Vercel（前端）



---



\# 資料夾結構

/frontend          → Next.js 前端專案

/workflows         → n8n 工作流匯出 JSON

/database          → Supabase schema、migration SQL

/docs              → 企劃書、競賽說明書、API 文件



---



\# 開發規範

\- 語言：TypeScript 優先

\- 所有函式必須加繁體中文註解說明用途

\- 資料庫欄位命名：英文蛇底線（snake\_case）

\- 元件命名：大寫駝峰（PascalCase）

\- 任何使用者健康資料：不得明文儲存姓名+健康數據的組合（PDPA）

\- API 路由統一放在 /app/api/ 目錄下



---



\# 每次完成功能模組後，主動提示：

1\. 這個模組需要哪些單元測試？

2\. 有哪些邊界條件（edge case）需要處理？

3\. 這個功能是否觸碰到「非醫療器材」的法規紅線？



---



## 禁止事項（絕對不可違反）

\- 不可升級 Next.js 版本（維持 14）

\- 不可修改 Supabase RLS 設定

\- 不可更動已完成驗證的欄位邏輯

\- 不可刪除任何資料庫資料表

\- 不可修改 .env.local 的內容



---



## 已完成功能（不可改動）

\- 登入/註冊流程（/login + /auth/callback）

\- 每日記錄表單（DailyRecordForm.tsx）

\- 前端表單驗證（睡眠、身體感受）

\- 儲存成功/失敗提示

\- Vercel 部署設定



---



## 標準開發流程

1\. 修改前先讀取相關檔案確認現有邏輯

2\. 修改後執行 npx tsc --noEmit 確認無 TypeScript 錯誤

3\. 確認無誤後再 git commit + git push
