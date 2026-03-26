const SUBMIT_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getLastSubmitTime(clientId: string): number | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(`conditionai_last_submit_${clientId}`);
  return val ? parseInt(val, 10) : null;
}

export function setLastSubmitTime(clientId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`conditionai_last_submit_${clientId}`, Date.now().toString());
}

export function canSubmitNow(clientId: string): { allowed: boolean; remainingMs: number } {
  if (typeof window === "undefined") return { allowed: true, remainingMs: 0 };
  const lastSubmit = getLastSubmitTime(clientId);
  if (!lastSubmit) return { allowed: true, remainingMs: 0 };

  const elapsed = Date.now() - lastSubmit;
  if (elapsed >= SUBMIT_LIMIT_MS) {
    return { allowed: true, remainingMs: 0 };
  }

  return { allowed: false, remainingMs: SUBMIT_LIMIT_MS - elapsed };
}
