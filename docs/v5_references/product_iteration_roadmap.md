# ConditionAI 產品迭代路線圖
**各版本交付清單與功能細節說明**
**2026-04-02 更新 | 內部執行文件**
 
## 版本總覽
| 版本 | 定位 | 關鍵判斷依據 |
|---|---|---|
| **V1** | 核心系統建立 | 系統能否跑起來 |
| **V1.5** | 體驗升級 + 知識管理 | 試點資料是否驗證問卷模型 |
| **V2** | 商業化啟動 | 是否有工作室願意付費 |
| **V3** | 平台化 | 月營收是否達 NT$60,000 |
| **長期** | 產業基礎設施 | 是否有穩定用戶基礎 |

---
 
## V1　0-6 個月　核心系統建立
**KPI**：10 家試點、500 筆行為資料、分流準確率 ≥85%、回訪完成率 ≥60%

### 前端（Next.js 14 + Vercel）
*   客戶問卷頁面（部位勾選 + 自然語言輸入） ✅
*   風險分流結果顯示頁 ✅
*   AI 分析結果卡片（Tab 切換：師傅版 + 客戶版） ✅
*   表單驗證、Loading 狀態、成功 Popup ✅
*   RWD 響應式設計（44px 熱區，390px 驗證） ✅

### 後端（Python FastAPI）
*   FastAPI 後端建立（Python 3.11） ✅
*   Prompt Injection 前置掃描 ✅
*   風險分流規則模型 V1（A/B/C 三類） ✅
*   Claude API Structured Output 雙向輸出 ✅
*   Input Quality Gate（字數/部位/去重） ✅
*   每日每用戶 AI 分析去重 ✅
*   VPS 部署 ✅
*   API Webhook Token 驗證 ☐ V1 遺留

### 資料庫（Supabase 15 張表）
*   studios / profiles / clients / questionnaire_responses ✅
*   triage_results / behavior_tags / follow_up_responses ✅
*   insight_reports / treatment_records ✅
*   injection_attempts / blocked_clients ✅
*   knowledge_base / tag_library / credits（V1.5 B組新增） ✅
*   RLS 全資料表啟用 + anon/service_role 分級 ✅

### 工作流自動化（n8n Cloud）
*   工作流一：client_intake_v1（問卷接收） ☐ V1 遺留
*   工作流二：follow_up_trigger（回訪排程） ☐ V1 遺留
*   工作流三：daily_summary（每日摘要） ☐ V1 遺留
*   工作流四：Multi-Agent 知識審核流水線（V1.5 B組） ✅

### 安全防護（五層）
*   Layer 1：Webhook Header Token 驗證 ☐ V1 遺留
*   Layer 2：Prompt Injection 前置掃描 + System Prompt 邊界 ✅
*   Layer 3：LINE Token 環境變數管理 ✅
*   Layer 4：Supabase RLS + blocked/injection 資料表 ✅
*   Layer 5：VPS UFW / SSH Key / fail2ban / Nginx ☐ V1 遺留

### V1 遺留四項（另排）
*   VPS 安全強化（UFW / SSH Key / fail2ban）
*   OTP 電話號碼驗證漏洞（Gate 3 可被換瀏覽器繞過）
*   n8n 三條核心工作流（client_intake / follow_up / daily_summary）
*   筆電 git pull 同步（補 .env.local 的 N8N_WEBHOOK_URL）

---
 
## V1.5　試點驗證後　體驗升級
**KPI**：師傅查閱率 ≥80%、客戶端歷史頁回訪率 ≥50%

*   **A組：師傅登入與角色分流 ✅ 完成**
    *   師傅登入（Supabase Email Auth）、角色分流（?role=）、is_test 旗標四表全部加入。
*   **B組：知識管理 Agent 系統 ✅ 完成**
    *   knowledge_base / tag_library / credits 三表 + RLS + GIN。
    *   get_relevant_knowledge() + 個體過濾 + Prompt 注入。
    *   n8n 工作流四：Multi-Agent 審核流水線、端到端測試通過。
*   **B組後續待辦（基礎設施補債）**
    *   LINE Messaging API 整合 (✅已完成)
    *   Supabase status check constraint 加入 partial (⏳待修)
    *   n8n Cloud 付費決策 (⏳~4/11)
*   **C組：客戶體驗升級 🕐 排隊中**
    *   身體部位圖標記介面（互動式 SVG）、歷史 AI 分析時間軸。
    *   AI 輸出等待時間的體感品質優化。
    *   n8n Agent 間 JSON 格式驗證 + Error Branch。
*   **D組：師傅端升級 🕐 排隊中**
    *   師傅學習紀錄輕量版（3 新欄位）、語音快速備注。
    *   分流準確率追蹤（師傅一鍵確認/修正）。

---

## V2　7-18 個月　商業化啟動
**KPI**：30 家付費、月營收 ≥NT$60,000、LLM 採納率 ≥70%、回訪 ≥1,000 筆

### 知識架構擴充
*   profiles 新增 preferred_framework 欄位。
*   深度 category 擴充（解剖/筋膜/肌動學/整復手法/關鍵點/陰陽五行）。
*   knowledge_references[] 欄位：AI 輸出附帶知識來源追溯。
*   知識條目引用頻率追蹤、Sprint Contract。
*   模型分級與 Skeptical Memory。

### 師傅端升級
*   學習洞察儀表板（能力雷達圖）。
*   知識庫引導式回饋（AI 回「參考 KB-xxx」）。
*   個人化調理建議、認證師傅標章初版。

### 品質與測試
*   採納率 × 改善率 = 知識品質雙重驗證。
*   風險分流 + 合規過濾自動化測試腳本。
*   validate_output() 整合進 CI 自動化迴圈。
*   autoDream 門檻、模型版本更新後重跑合規測試套件。

### 工具鏈評估
frontend-design plugin (高)、沙箱環境 (高)、CLAUDE.md 三層記憶重構 (高)。

---

## V3　19-36 個月　平台化
**KPI**：200 家客戶、年營收 ≥NT$500 萬

*   **商品推薦系統（新增）**：products 資料表 + applicable_pattern_tags[] 陣列交集比對。零庫存聯盟。
*   **小兒推拿分析**（備用/需法律顧問先行）：僅限兒童日常行為模式分析，不碰任何生理功能主張。
*   **其他 V3 功能**：RMN 資料商業化、Voice of Customer Agent、ESG 企業健康報告、API 開放、認證標章升級。

---
 
## 持續性工作與飛輪原則
*   **定期任務**：API Key 輪換、金鑰掃描、技術債清理、合規審查。每月追蹤分流準確率與採納率。
*   **資料飛輪原則**：每一代版本累積的資料都是下一代的基礎。跳過任何一代，資料飛輪就會斷裂。

---
---

# 產品迭代路線圖 — V2 備忘補充清單
**2026-04-03 產出 | 來源：V5.0 企劃書整合過程中收斂的新增項目**

## 一、V1.5 C/D 組補充項（近期可執行）
1. 回訪間隔調整 7/14/21 天 (高優先度)
2. 師傅備註合規過濾器（Sanitizer） (中優先度)
3. appointment_status 狀態機欄位 (低優先度)

## 二、V2 新增功能備忘
### 產品功能
*   C 端自助分析方案
*   上帝視角儀表板（管理端）
*   預約前置分析
*   knowledge_references[] 欄位追溯
*   知識條目引用頻率追蹤
*   師傅能力雷達圖
*   一鍵分享報告到社群

### 知識庫與行銷
*   半自動學術文獻納入
*   師傅案例結構化入庫
*   preferred_framework 欄位
*   學術里程碑內部評估
*   PGC 健康知識內容牆
*   內容萃取 Prompt 鷹架

### 系統管理與測試
*   週末復盤綜合 Agent
*   Sprint Contract 概念
*   模型分級（Haiku/Sonnet）
*   自動化測試覆蓋核心路徑

## 三、明確不納入的項目
1.  **C2B2B 軸心翻轉（AI 直接指導客戶動作）**：違反「師傅最終決策權」核心原則。
2.  **自建購物車 + 結帳金流**：資源錯配，一律導向外部結帳連結。
3.  **UGC 社群功能**：健康產業 UGC 是災難，V4/V5 才考慮。
4.  **多部門 Agent 網路**：與精實 4 角色鐵律衝突，改用單一週末復盤 Agent。
5.  **自建預約系統 / 即時地理調度**：採「外掛大腦」API 橋樑模式。

*ConditionAI 內部文件 | 產品迭代路線圖 V2 備忘補充清單 | 2026-04-03*
