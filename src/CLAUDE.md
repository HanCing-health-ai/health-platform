# Frontend 規範
## 框架
- Next.js 14 App Router
- TypeScript（所有元件必須有型別定義）
- Tailwind CSS（不使用 inline style）

## 命名規範
- 元件：PascalCase（QuestionnaireForm.tsx）
- 工具函式：camelCase（validateOutput.ts）
- 常數：UPPER_SNAKE_CASE

## 禁止事項
- 不在前端直接呼叫 Claude API（必須透過 FastAPI）
- 不在前端儲存任何 API Key
- client_output 顯示前必須通過語言合規確認

## RWD 標準
- 手機優先（390px 基準）
- 測試用 /rwd-test 指令
