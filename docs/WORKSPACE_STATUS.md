# ConditionAI 工作區全域狀態看板
**本檔案是所有 Antigravity 聊天室的「共享記憶」。**
每個聊天室在開始與結束時都應讀取/更新此檔案。

> **SOP：每次開新聊天室時，請說「請先讀取 `docs/WORKSPACE_STATUS.md`」**

---

## 📌 當前版本
- **產品版本**：V1.5 B組 Wave 3（端到端測試完成）
- **藍圖版本**：V5.3 核心四角色架構 (/dev, /km, /arch, /design)
- **最後更新**：2026-04-02

---

## 🏢 聊天室分區與當前進度

### 💼 戰略規劃室 (Strategy Room)
**職責**：文件整理、架構設計、護城河討論、文章分析
**建議模型**：Claude Opus 4.6 Thinking

| 任務 | 狀態 | 備註 |
|------|------|------|
| 確立 4 大 Agent 角色邊界 | ✅ 完成 | 確保不過度擴張，維持一人公司敏捷性 |
| 外部文章洞察應用總覽 | ✅ 完成 | `article_insights_applied.md` (4篇文章+9個Use Cases) |
| V5 參考文件遷移 (6份) | ✅ 完成 | `docs/v5_references/` |
| Superpowers 工程紀律轉化 | ✅ 完成 | `.agents/workflows/` (5個Workflow) |
| 與 Claude 策略端最終對齊 | 🟡 待辦 | 待創辦人帶報告回 Claude 討論 |

### 💻 研發工程室 (Engineering Room)
**職責**：寫程式碼、修 Bug、建 Schema、前端 UI
**建議模型**：Gemini 3.1 Pro

| 任務 | 狀態 | 優先級 |
|------|------|--------|
| 修 `schema.sql` status CHECK 約束 | ✅ 完成 | 致命地雷 → 已排除 |
| LINE Notify → Messaging API 遷移規格 | ✅ 完成 | 文件已產出 `docs/plans/` |
| SVG 互動式身體圖標記 | ✅ 完成 | `BodyMap.tsx` 已建立 |
| 歷史 AI 分析時間軸 UI | ✅ 完成 | `InsightTimeline.tsx` 已建立 |
| `products` 資料表設計 (RMN) | 🟢 延至 V2 後期 | 商務前提不足（已記錄 LEARNINGS.md） |
| `treatment_records` 輕量學習欄位 | ✅ 完成 | 3 欄位已加入 schema（取代 learning_logs） |

### ⚖️ 合規審查室 (Compliance Room)
**職責**：Prompt 設計、禁詞測試、n8n 工作流調校
**建議模型**：Claude Opus 4.6 Thinking

| 任務 | 狀態 | 優先級 |
|------|------|--------|
| 信心閥值機制設計 | 🟡 未開始 | 高 |
| Agent 間 JSON Schema 契約 | 🟡 未開始 | 高 |
| 紅軍壓力測試 Prompt 撰寫 | 🟢 未開始 | 中 |
| n8n Agent Prompt 鷹架拆除審計 | 🟢 未開始 | 低 |

---

## 🔑 跨室共享的關鍵決策記錄

| 日期 | 決策 | 來源 |
|------|------|------|
| 2026-03-29 | Antigravity 是 Google DeepMind 引擎，非 Claude 分身 | 戰略規劃室 |
| 2026-03-29 | 採用陣列標籤 (TEXT[]) 做商品/知識比對 | 戰略規劃室 |
| 2026-04-02 | 捨棄 10 大部門擴張，回歸 4 角色精實架構 | Claude 策略端 (避免管理過度) |
| 2026-03-31 | Claude Use Cases #1-#9 應用對照完成 | 戰略規劃室 |
| 2026-04-02 | 安裝 Superpowers 工程紀律 (5 Workflows) | 戰略規劃室 |
| 2026-04-02 | Antigravity 偏差校準：禁止把「技術可行」等同「現在該做」，合規判斷交 Claude | Claude 策略端診斷 |
| 2026-04-02 | 三端分工確立：Antigravity=技術實作 / Claude=合規+策略 / Gemini=文章粗加工 | Claude 策略端 |
| 2026-04-02 | 商品推薦延至 V2 後期（商務前提不足）、小兒推拿延至 V3（需法律顧問） | Claude 策略端 |
| 2026-04-02 | 學習紀錄 V1.5 D組做輕量版（3欄位），AI 只做知識庫引導不直接建議手法 | Claude 策略端 |
| 2026-04-02 | 建立制度化記憶 (LEARNINGS.md) + 標準分層 (STANDARDS.md) | 戰略規劃室 |

---

## 📂 重要文件索引

| 文件 | 路徑 | 用途 |
|------|------|------|
| 專案規範 | `CLAUDE.md` | AI 行為準則與 4 大角色定義 |
| 文章洞察 | `docs/v5_references/article_insights_applied.md` | 外部文章優化對照 |
| 護城河戰略 | `docs/v5_references/moat_strategy_roadmap.md` | 八大護城河規劃 |
| 競品分析 | `docs/v5_references/competitor_analysis.md` | Noterro 等防禦策略 |
| 迭代路線 | `docs/v5_references/product_iteration_roadmap.md` | V1→V5 版本規劃 |
| KM Agent 設計 | `docs/v5_references/km_agent_system_design.md` | 4 騎士工作流規格 |
| n8n 知識進庫 | `workflows/workflow-4-knowledge-intake.json` | 工作流 A |
| n8n 審核決策 | `workflows/workflow-4-review-decision.json` | 工作流 B |
| LINE 遷移規格 | `docs/plans/2026-04-02-line-api-migration.md` | LINE Notify → Messaging API 對照 |
| 身體標記元件 | `frontend/src/components/BodyMap.tsx` | SVG 互動式人體圖 |
| 分析時間軸 | `frontend/src/components/InsightTimeline.tsx` | 歷史 AI 分析時間軸 UI |
| 思考校準協議 | `docs/ANTIGRAVITY_CALIBRATION.md` | Antigravity 提建議前的強制自檢 |
| 部門啟動 SOP | `.agents/workflows/department-activation.md` | 各部門聊天室的啟動 Prompt |
| 制度化記憶 | `docs/LEARNINGS.md` | 教訓、改進備忘、排除記錄 |
| 標準分層管理 | `docs/STANDARDS.md` | 不可變規則 vs 可調政策 |
| 資金與補助追蹤 | Artifact: `funding_and_subsidies_checklist.md` | 綁定開發里程碑的資金/補助清單 |

---

## 📝 更新規則

1. **開始工作時**：先讀取此檔案，了解全局進度
2. **結束工作時**：更新對應聊天室的任務狀態
3. **做出重大決策時**：記錄到「跨室共享的關鍵決策記錄」
4. **新增重要文件時**：更新「重要文件索引」

---
*本檔案由 Antigravity 執行端維護 | 最後更新：2026-04-02 14:55（研發工程室完成全任務清單）*
