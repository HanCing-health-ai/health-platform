請執行以下三項安全檢查：
1. 確認 .env 和 .env.local 已列在 .gitignore 中
2. 掃描所有 .ts .py .js 檔案，確認無 API Key 或 secret 直接寫在程式碼裡
3. 執行 git log --all 確認 git history 中無任何 Key 外洩
列出每項檢查的結果，發現問題立即標示高風險。
