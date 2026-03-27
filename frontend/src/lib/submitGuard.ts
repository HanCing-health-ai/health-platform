// 24 小時提交防重複工具（以電話號碼為 key）
// 用途：防止同一電話在 24 小時內重複送出問卷

const STORAGE_PREFIX = 'last_submit_';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 小時

/**
 * 檢查指定電話現在是否可以提交
 * @returns { allowed: boolean, remainingMs: number }
 */
export function canSubmitNow(phone: string): { allowed: boolean; remainingMs: number } {
  if (typeof window === 'undefined') return { allowed: true, remainingMs: 0 };
  const key = `${STORAGE_PREFIX}${phone}`;
  const lastSubmit = localStorage.getItem(key);
  if (!lastSubmit) return { allowed: true, remainingMs: 0 };
  const elapsed = Date.now() - parseInt(lastSubmit, 10);
  if (elapsed > COOLDOWN_MS) return { allowed: true, remainingMs: 0 };
  return { allowed: false, remainingMs: COOLDOWN_MS - elapsed };
}

/**
 * 記錄指定電話本次提交時間
 */
export function setLastSubmitTime(phone: string): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}${phone}`;
  localStorage.setItem(key, Date.now().toString());
}
