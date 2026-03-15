"""
風險分流模組 V1
對應規則文件：docs/rules_v1.md（版本 1.0）

系統定位：行為模式導向的健康管理工具，所有輸出為行為調整建議，不涉及醫療診斷或治療。
"""

from __future__ import annotations

# ── C 類觸發關鍵詞庫（完整對應 rules_v1.md）──────────────────────────────────

# 急性症狀類
_C_ACUTE: list[str] = [
    "痛到無法呼吸",
    "胸口悶痛",
    "胸痛",
    "突然暈眩",
    "突然站不穩",
    "手腳麻痺",
    "臉部歪斜",
    "說話困難",
    "視線模糊",
    "左手臂痠麻",
    "胸悶",
    "冷汗合併頭暈",
]

# 嚴重外傷類
_C_TRAUMA: list[str] = [
    "骨折",
    "脫臼",
    "撞傷後無法移動",
]

# 神經症狀類
_C_NEURO: list[str] = [
    "大小便失禁",
    "控制困難",
    "單側手腳突然無力",
    "吞嚥困難",
]

# 腫脹發炎類
_C_SWELLING: list[str] = [
    "關節紅腫發熱",
    "不明原因持續腫脹超過一週",
]

# 疾病相關類
_C_DISEASE: list[str] = [
    "發燒超過38度",
    "發燒超過 38 度",
    "癌症",
    "腫瘤",
    "術後傷口未癒合",
    "骨質疏鬆史合併跌倒後疼痛",
    "糖尿病合併足部傷口未癒",
]

# 合併完整 C 類關鍵詞清單
C_KEYWORDS: list[str] = (
    _C_ACUTE + _C_TRAUMA + _C_NEURO + _C_SWELLING + _C_DISEASE
)

# ── B 類偵測關鍵詞（符合任一即為 B 類）─────────────────────────────────────

B_KEYWORDS: list[str] = [
    # 近期手術或醫療處置
    "手術",
    "開刀",
    "醫療處置",
    # 舊傷史
    "舊傷",
    "舊傷史",
    # 孕期
    "孕期",
    "懷孕",
    "妊娠",
    # 抗凝血藥物
    "抗凝血",
    "阿斯匹靈",
    "aspirin",
    "warfarin",
    "華法林",
    # 心臟支架
    "心臟支架",
    "支架術後",
    # 年齡 ≥65（常見表述）
    "65歲",
    "66歲", "67歲", "68歲", "69歲",
    "70歲", "71歲", "72歲", "73歲", "74歲",
    "75歲", "76歲", "77歲", "78歲", "79歲",
    "80歲", "81歲", "82歲", "83歲", "84歲",
    "85歲", "86歲", "87歲", "88歲", "89歲",
    "90歲",
]

# ── 主函數 ────────────────────────────────────────────────────────────────────


def classify_risk(text: str) -> dict[str, str | None]:
    """
    風險分流主函數

    參數：
        text: 使用者描述的文字

    回傳：
        {
            "level": "A" | "B" | "C",
            "reason": str,          # 供前端或師傅端顯示的說明
            "triggered_keyword": str | None  # 觸發的關鍵詞（C/B 類才有值）
        }

    優先順序：C > B > A
    """
    # ── 第一優先：C 類檢查 ────────────────────────────────────────────────────
    for keyword in C_KEYWORDS:
        if keyword in text:
            return {
                "level": "C",
                "reason": (
                    "您描述的狀況建議優先諮詢醫療專業人員，"
                    "調理服務適合在醫療評估後進行。"
                ),
                "triggered_keyword": keyword,
            }

    # ── 第二優先：B 類檢查 ────────────────────────────────────────────────────
    for keyword in B_KEYWORDS:
        if keyword in text:
            return {
                "level": "B",
                "reason": (
                    "描述中包含需要特別留意的狀況，"
                    "建議師傅進行特別評估，並在調理前確認相關細節。"
                ),
                "triggered_keyword": keyword,
            }

    # ── 預設：A 類 ────────────────────────────────────────────────────────────
    return {
        "level": "A",
        "reason": "描述符合一般調理型，可正常進入分析流程。",
        "triggered_keyword": None,
    }


# ── 簡單測試（python risk_triage.py 直接執行）────────────────────────────────

if __name__ == "__main__":
    test_cases = [
        # (描述, 預期等級)
        ("最近肩膀有點痠痛，已經持續兩週，肌肉緊繃感很明顯。", "A"),
        ("我三個月前剛做完心臟支架手術，最近背部有些不適。", "B"),
        ("突然胸口悶痛，左手臂也痠麻，還有點冷汗。", "C"),
    ]

    print("=" * 55)
    print("  風險分流模組 V1 — 測試結果")
    print("=" * 55)

    all_passed = True
    for text, expected in test_cases:
        result = classify_risk(text)
        level = result["level"]
        keyword = result["triggered_keyword"] or "（無）"
        status = "PASS" if level == expected else "FAIL"
        if status == "FAIL":
            all_passed = False

        print(f"\n[{status}] 預期：{expected}　實際：{level}")
        print(f"  輸入：{text}")
        print(f"  觸發詞：{keyword}")
        print(f"  說明：{result['reason']}")

    print("\n" + "=" * 55)
    print("  全部通過 ✓" if all_passed else "  有測試未通過，請檢查關鍵詞庫。")
    print("=" * 55)
