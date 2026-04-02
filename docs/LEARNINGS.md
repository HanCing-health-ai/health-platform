# ConditionAI 制度化記憶 (Institutional Memory)
**每次踩坑、每個洞察、每條教訓，都不該只存在聊天紀錄裡。**

> **更新規則**：任何聊天室結束工作時，如果過程中發現了值得記住的事，就追加到這裡。

---

## 📚 經驗教訓 (Lessons Learned)

### 2026-03-29 | Agent 身份混淆事件
- **發生了什麼**：Claude 策略端誤把 Antigravity 認定為自己的分身
- **根因**：`CLAUDE.md` 只寫了「獨立 IDE」，沒標明 AI 引擎來源
- **修正**：在 CLAUDE.md 明確寫入 Antigravity = Google DeepMind 引擎
- **教訓**：所有角色的身份定義必須在文件中寫到「不可能被誤解」的程度

### 2026-03-29 | n8n Agent 4 的 [object Object] 崩潰
- **發生了什麼**：Agent 4 報告整合員的輸出包含 `[object Object]` 而非實際內容
- **根因**：上游 Agent 輸出的 JSON 格式不符預期，被直接轉字串
- **教訓**：Agent 之間必須有 JSON Schema 契約驗證（已列入待辦）

### 2026-04-02 | Antigravity 偏差模式被診斷
- **發生了什麼**：Claude 策略端指出 Antigravity 三個系統性偏差
- **具體偏差**：
  1. 把「技術可行」等同於「現在該做」
  2. 低估合規風險（特別是兒童領域）
  3. 過度工程化（每個觀察都想建新模組）
- **修正**：建立 `ANTIGRAVITY_CALIBRATION.md` 五道關卡自檢協議
- **教訓**：技術執行端的建議 ≠ 最終決策。合規和時間線判斷必須經策略端校準

### 2026-04-02 | 小兒推拿替代語言的合規陷阱
- **發生了什麼**：Antigravity 建議用「輔助生長氣血循環」替代醫療用語
- **Claude 指出**：「輔助生長」暗示發育效果，「夜啼」是中醫病名，兒童領域衛福部標準更嚴
- **教訓**：健康相關的替代語言，不能由技術端自行判斷安全性。永遠交給法務/策略端審查

### 2026-04-02 | Superpowers 與 everything-claude-code 的安裝教訓
- **發生了什麼**：兩個熱門開源專案都無法直接安裝到 Antigravity IDE
- **根因**：它們分別是 Gemini CLI 和 Claude Code 的專用擴充套件
- **解法**：提取核心思想，轉化為 `.agents/workflows/` 格式
- **教訓**：不要盲目追熱門工具。提取思想 > 照搬工具

### 2026-04-02 | 檔案架構大掃除（37KB 冗餘清除）
- **發生了什麼**：審計發現 6 個重複/過時的檔案（舊版 schema、已吸收的總覽文件、空殼文件等）
- **刪除清單**：根目錄 `schema.sql`、文件集中更新總覽、指令集（Discord 部分已搬家）、tech_corrections_table、collaboration_workflow_guide、docs/CLAUDE.md
- **教訓**：每次建新文件時應同時檢查是否有舊文件被取代。定期做架構審計

### 2026-04-02 | Gemini 文章分析越權事件
- **發生了什麼**：Gemini 在文章分析任務中自行產出完整 V2 企劃藍圖和架構建議
- **問題規模**：~50 條建議中，26% 重複（不了解現狀）、36% 觸犯校準協議（過度工程）
- **根因**：啟動 Prompt 沒有明確約束其角色邊界
- **修正**：Gemini 角色約束已寫入 STANDARDS.md 不可變規則；更新了啟動 Prompt 加入紅線
- **教訓**：每個 AI 角色的「不能做什麼」跟「能做什麼」一樣重要。沒有明確紅線的 AI 會自動擴張權限

---

## 💡 未來改進備忘 (Enhancement Backlog)

### 🔴 已確認要做（等時機到）
| 改進項目 | 觸發條件 | 來源 |
|---------|---------|------|
| Agent 模型分級（Haiku 做格式檢查、Sonnet 做深度審核） | 每月知識入庫 > 20 筆 | Gemini 建議 → Claude 確認 |
| 知識回饋閉環自動化 | active 條目 > 50 筆，且觀察到重複修正模式 | Gemini 建議 → Claude 確認 |
| 師傅能力雷達圖 | 每個 pattern_tag 至少 10 筆處理紀錄 | Claude 確認時機 |
| 商品推薦引擎 (products 表) | 有付費用戶 + 廠商合作 + 商品上架審核流程設計完成 | Claude 延至 V2 後期 |
| products 表的上游文案合規審查機制 | 與 products 表同步啟動 | 校準協議指出 Prompt 擋不住廠商文案 |
| learning_logs 獨立表（完整版） | treatment_records 3 欄位收集的數據 > 50 筆 | V1.5 先做輕量版，V2 評估擴充 |
| 小兒推拿模組 | 諮詢法律顧問完成 | Claude 延至 V3 |

### 🟡 值得探索（尚未決策）
| 探索方向 | 備註 |
|---------|------|
| AI Scribe（語音轉調理記錄）| 防禦 Noterro 的預備武器 |
| Apple Health / Garmin 數據對接 | 需評估 API 成本與隱私政策 |
| 行為心理設計（損失厭惡 vs 獎勰機制）| 需更多客戶行為數據才有意義 |
| 預測市場式的知識品質評估 | 概念有趣但實作複雜度高 |
| Git Worktree 多功能並行開發 | V2 多任務場景時導入。讓不同分支在不同目錄同時開發，互不干擾（來源：Dean Lin 影片） |
| AI 自動整理 Atomic Commits | 讓 AI 把雜亂修改拆成單一職責的 commit，提升追溯性（來源：Dean Lin 影片） |
| PII 資料脫敏（n8n Regex 節點） | V3 B2B 多租戶時再建。單師傅階段資料不出境，規模不到（來源：Gemini 校準後保留） |
| Token 使用量簡易追蹤 | V2 評估。n8n 工作流結尾加 counter 欄位即可，不需建 api_usage_logs 表（來源：Gemini 校準後保留） |
| Skill 依賴衝突仲裁機制 | V3 知識量 > 100 筆再設計。多部位 SOP 同時調用可能互相矛盾（來源：Gemini 校準後保留） |
| 意圖綁定觸發（Intent-based Triggering） | V2 評估。關鍵字自動路由到對應 Skill pipeline（如 "bug"→除錯流程）（來源：Gemini 校準後保留） |

### 🟢 已排除（記錄原因）
| 排除項目 | 排除原因 | 決策者 |
|---------|---------|--------|
| 獨立語氣轉換 Agent | 已在 System Prompt 解決，多一個 Agent 是過度工程 | Claude |
| 全自動知識入庫重試 | 會重複消耗 API 額度，改用 Error Branch + LINE 通知 | Claude |
| 直接安裝 Superpowers/everything-claude-code | 架構不相容，已提取核心思想轉化 | Antigravity |
| 中國模型用於臨床資料 | 健康數據回傳境外風險高，需法律顧問確認才能重新評估 | 戰略規劃室 |

---
*本檔案是 ConditionAI 的組織記憶。每一條教訓都是用真實的錯誤換來的。*
*最後更新：2026-04-02*
