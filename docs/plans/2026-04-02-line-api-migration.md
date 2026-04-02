# LINE Notify → LINE Messaging API 遷移規格文件

**文件產出日期**：2026-04-02  
**產出單位**：研發工程室  
**狀態**：待人工在 n8n Cloud 執行遷移操作

---

## ⚠️ 背景

LINE Notify 已於 **2025 年 3 月 31 日正式終止服務**，API 端點 `https://notify-api.line.me/api/notify` 已不可用。
本專案的兩條 n8n 工作流中仍殘留 LINE Notify 節點，需遷移至 **LINE Messaging API Push Message**。

---

## 📋 影響盤點

| 工作流檔案 | 節點名稱 | 用途 | 影響等級 |
|-----------|----------|------|---------|
| `workflow-4-knowledge-intake.json` | `LINE 通知審核者` | 新知識進庫後通知審核者審核 | 🔴 高 |
| `workflow-4-review-decision.json` | `LINE 通知師傅` | 審核決策後通知師傅結果與點數回饋 | 🔴 高 |

---

## 🔑 遷移前置作業（一次性設定）

### Step 1：建立 LINE Official Account
1. 前往 [LINE Official Account Manager](https://manager.line.biz/)
2. 建立 ConditionAI 官方帳號（免費方案每月有 200 則免費推播額度）

### Step 2：開啟 Messaging API
1. 在 Official Account 設定中啟用「Messaging API」
2. 進入 [LINE Developers Console](https://developers.line.biz/)
3. 取得 **Channel Access Token**（長期有效版）

### Step 3：取得使用者 User ID
- LINE Messaging API 需要指定收件人的 **User ID**（格式：`Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
- 取得方式：
  - Webhook 事件中的 `source.userId`
  - 或透過 LINE Developers Console → Your Bot → 「Basic Settings」查看自己的 User ID

### Step 4：在 n8n Cloud 建立 Credential
1. 進入 n8n Cloud → Settings → Credentials
2. 新增 HTTP Header Auth credential：
   - Name: `LINE Messaging API Token`
   - Header Name: `Authorization`
   - Header Value: `Bearer {你的 Channel Access Token}`

---

## 📊 節點 1：LINE 通知審核者（Knowledge Intake Pipeline）

### 🔴 舊設定（LINE Notify — 已失效）

```
節點類型：n8n-nodes-base.httpRequest
URL：https://notify-api.line.me/api/notify
Method：POST
Headers：
  Authorization: Bearer {LINE_TOKEN}
Body Type：Form URL-Encoded
Body Parameters：
  message = "📚 新知識待審核
標題：{{$json.title}}
來源可信度：{{$json.source_credibility}}
合規審查：{{$json.has_violations ? 'fail' : 'pass'}}
建議決策：{{$json.decision_suggestion}}
點此審核：{review_webhook_url}?id={{$json.id}}"
```

### 🟢 新設定（LINE Messaging API Push Message）

```
節點類型：n8n-nodes-base.httpRequest
URL：https://api.line.me/v2/bot/message/push
Method：POST
Headers：
  Content-Type: application/json
  Authorization: Bearer {CHANNEL_ACCESS_TOKEN}
Body Type：JSON
Body Content：
{
  "to": "{REVIEWER_USER_ID}",
  "messages": [
    {
      "type": "text",
      "text": "📚 新知識待審核\n標題：{{$json.title}}\n來源可信度：{{$json.source_credibility}}\n合規審查：{{$json.has_violations ? '❌ 未通過' : '✅ 通過'}}\n建議決策：{{$json.decision_suggestion}}\n\n點此審核：{review_webhook_url}?id={{$json.id}}"
    }
  ]
}
```

### n8n Cloud 操作步驟

1. 開啟 `Knowledge Intake Pipeline` 工作流
2. 點選 `LINE 通知審核者` 節點
3. 修改 URL 為 `https://api.line.me/v2/bot/message/push`
4. 移除舊的 Header Auth，改用新建立的 `LINE Messaging API Token` credential
5. 新增 Header：`Content-Type: application/json`
6. 將 Body Type 從 Form 改為 JSON
7. 貼上上方 JSON Body（替換 `{REVIEWER_USER_ID}` 為審核者的真實 User ID）
8. 測試執行，確認審核者收到通知

---

## 📊 節點 2：LINE 通知師傅（Review Decision Pipeline）

### 🔴 舊設定（LINE Notify — 已失效）

```
節點類型：n8n-nodes-base.httpRequest
URL：https://notify-api.line.me/api/notify
Method：POST
Headers：
  Authorization: Bearer {LINE_TOKEN}
Body Type：Form URL-Encoded
Body Parameters：
  message = "🌟 知識貢獻回饋
您提交的「{title}」{decision_result}
獲得點數：+{points} 點（累計 {total} 點）
感謝您的貢獻，每一筆知識都讓系統更智慧！"
```

### 🟢 新設定（LINE Messaging API Push Message）

```
節點類型：n8n-nodes-base.httpRequest
URL：https://api.line.me/v2/bot/message/push
Method：POST
Headers：
  Content-Type: application/json
  Authorization: Bearer {CHANNEL_ACCESS_TOKEN}
Body Type：JSON
Body Content：
{
  "to": "{{$node['取得 knowledge_base 紀錄'].json.contributor_line_user_id}}",
  "messages": [
    {
      "type": "text",
      "text": "🌟 知識貢獻回饋\n您提交的「{{ $node['取得 knowledge_base 紀錄'].json.title || '知識條目' }}」{{ $node['Webhook 接收'].json.query.decision === 'approve' ? '已入庫 ✅' : ($node['Webhook 接收'].json.query.decision === 'partial' ? '部分入庫 ⚠️' : '未通過 ❌') }}\n獲得點數：+{{ $node['Webhook 接收'].json.query.decision === 'reject' ? '0' : '10' }} 點\n\n感謝您的貢獻，每一筆知識都讓系統更智慧！"
    }
  ]
}
```

### n8n Cloud 操作步驟

1. 開啟 `Review Decision Pipeline` 工作流
2. 點選 `LINE 通知師傅` 節點
3. 修改 URL 為 `https://api.line.me/v2/bot/message/push`
4. 移除舊的 Header Auth，改用新建立的 `LINE Messaging API Token` credential
5. 新增 Header：`Content-Type: application/json`
6. 將 Body Type 從 Form 改為 JSON
7. 貼上上方 JSON Body
8. **關鍵差異**：`to` 欄位需動態取得貢獻師傅的 LINE User ID
   - 需在 `profiles` 表新增 `line_user_id` 欄位（見下方 Schema 建議）
   - 或暫時使用固定 User ID（適用於只有一位師傅的初期階段）
9. 測試執行，確認師傅收到通知

---

## 🗄️ Schema 變更建議（供研發工程室後續納入）

為了讓節點 2 能動態指定收件人，建議在 `profiles` 表新增：

```sql
-- 在 profiles 表新增 LINE User ID 欄位（用於 Messaging API 推播）
ALTER TABLE public.profiles ADD COLUMN line_user_id TEXT;
```

此變更：
- 非必要條件（可先用固定 User ID 過渡）
- 但為 V2 多師傅場景的必要前置工作
- 修改 `profiles` 屬於高危操作，需創辦人確認

---

## 📐 關鍵差異總覽

| 項目 | LINE Notify（舊） | LINE Messaging API（新） |
|------|-------------------|-------------------------|
| API 端點 | `notify-api.line.me/api/notify` | `api.line.me/v2/bot/message/push` |
| 認證方式 | Personal Access Token | Channel Access Token |
| Body 格式 | Form URL-Encoded (`message=...`) | JSON (`{"to":"...","messages":[...]}`) |
| 收件人指定 | 綁定的群組/1對1 | 明確指定 User ID |
| 費用 | 免費（已終止） | 免費方案 200 則/月 |
| 訊息功能 | 純文字 | 文字 / 圖片 / Flex Message / 快速回覆 |
| 服務狀態 | ❌ 2025/3/31 已終止 | ✅ 現役 |

---

## 🚀 V2 進階建議（非必要，但值得規劃）

1. **Flex Message**：將通知改為卡片式 Flex Message，提供「通過 / 退回」按鈕，審核者可在 LINE 內直接操作
2. **Narrowcast**：未來多師傅場景，可用 Narrowcast API 做分群推播
3. **Rich Menu**：設定 LINE Official Account 的 Rich Menu，讓師傅可快速查看待審清單

---

## ✅ 遷移檢查清單

- [ ] LINE Official Account 已建立
- [ ] Messaging API 已開啟
- [ ] Channel Access Token 已取得
- [ ] n8n Cloud Credential 已建立
- [ ] 審核者 User ID 已取得並填入節點 1
- [ ] 師傅 User ID 取得策略已確認（固定/動態）
- [ ] 節點 1（通知審核者）已修改並測試通過
- [ ] 節點 2（通知師傅）已修改並測試通過
- [ ] workflow JSON 已匯出更新至 Git 倉庫

---

*本文件由研發工程室產出 | 2026-04-02*
