import json
import os
import sys
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# 載入現有模組
sys.path.append(os.path.dirname(__file__))
from injection_guard import scan_injection
from risk_triage import classify_risk

app = FastAPI()

# 允許前端（Next.js）跨域呼叫
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://health-platform-eight.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Claude API 設定
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_MODEL = "claude-sonnet-4-20250514"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"

# 載入 System Prompt
def load_system_prompt() -> str:
    prompt_path = os.path.join(os.path.dirname(__file__), "docs", "system_prompt_v1.md")
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            content = f.read()
        parts = content.split("```")
        if len(parts) >= 3:
            return parts[1].strip()
        return content
    except FileNotFoundError:
        return FALLBACK_SYSTEM_PROMPT

# 備用 System Prompt（docs 資料夾不存在時使用）
FALLBACK_SYSTEM_PROMPT = """你是「ConditionAI 行為模式分析引擎」，只能回傳指定 JSON 格式。
你不是醫療 AI，不具備診斷或治療能力。
請根據輸入資料，回傳以下 JSON，不允許任何其他文字：
{
  "practitioner_output": {
    "pattern_summary": "行為模式歸納",
    "primary_load_source": "主要負荷來源",
    "suggested_sequence": ["第一步", "第二步", "第三步"],
    "sequence_reason": "建議理由",
    "caution_notes": "注意事項",
    "triage_class": "A",
    "confidence_score": 0.8
  },
  "client_output": {
    "pattern_type": "模式類型",
    "pattern_description": "白話說明",
    "behavior_suggestions": ["建議一", "建議二", "建議三"]
  },
  "behavior_tags": {
    "pattern_type": "sedentary_accumulation",
    "primary_load_source": "static_shoulder_neck",
    "lifestyle_tags": ["久坐"],
    "discomfort_areas": ["頸部"]
  }
}
客戶版輸出禁止出現：診斷、治療、疾病、症狀、病名、處方、風險。"""

SYSTEM_PROMPT = load_system_prompt()

# 請求資料格式
class AnalysisRequest(BaseModel):
    client_id: str
    occupation_type: str
    discomfort_areas: List[str]
    primary_complaint: str
    duration_type: str
    is_on_medication: bool
    special_notes: Optional[str] = ""
    lifestyle_description: str

# 健康檢查端點
@app.get("/")
def health_check():
    return {"status": "ConditionAI FastAPI 運作中", "version": "v1"}

# 主要分析端點
@app.post("/api/analyze")
async def analyze_client(req: AnalysisRequest):

    # Step 1：Injection Guard 掃描
    scan_result = scan_injection({
        "lifestyle_description": req.lifestyle_description,
        "special_notes": req.special_notes or "",
        "primary_complaint": req.primary_complaint
    })
    if scan_result.get("blocked"):
        raise HTTPException(
            status_code=400,
            detail="您的輸入包含無法處理的內容，系統已記錄此次請求。"
        )
    # Step 2：風險分流
    triage_input = {
        "discomfort_areas": req.discomfort_areas,
        "primary_complaint": req.primary_complaint,
        "lifestyle_description": req.lifestyle_description,
        "special_notes": req.special_notes or "",
        "duration_type": req.duration_type,
        "is_on_medication": req.is_on_medication
    }
    triage_result = classify_risk(triage_input)
    triage_class = triage_result.get("class", "A")
    triage_reason = triage_result.get("reason", "一般型")

    # Step 3：C 類直接阻斷，不呼叫 Claude API
    if triage_class == "C":
        return {
            "success": False,
            "triage_class": "C",
            "message": "您描述的狀況建議優先諮詢醫療專業人員，本系統暫不提供調理建議。"
        }

    # Step 4：組裝使用者輸入
    user_message = f"""---
【客戶基本資料】
職業類型：{req.occupation_type}
不適部位：{', '.join(req.discomfort_areas)}
主要主訴：{req.primary_complaint}
持續時間：{req.duration_type}
是否用藥：{'是' if req.is_on_medication else '否'}
特殊備註：{req.special_notes or '無'}

【生活習慣描述】
{req.lifestyle_description}

【風險分流結果】
分流類別：{triage_class}（A=一般型 / B=加強監控）
分流原因：{triage_reason}
---"""

    # Step 5：呼叫 Claude API
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": 2000,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_message}]
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(CLAUDE_API_URL, headers=headers, json=payload)
            response.raise_for_status()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Claude API 回應逾時，請稍後再試")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Claude API 錯誤：{e.response.status_code}")

    # Step 6：解析回傳 JSON
    result = response.json()
    raw_text = result["content"][0]["text"]
    cleaned = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        analysis = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="回傳格式異常，請聯絡管理員")

    # Step 7：Claude 端若觸發安全阻斷
    if analysis.get("blocked"):
        raise HTTPException(status_code=400, detail="分析被安全機制阻斷")

    # Step 8：B 類信心分數硬性上限 0.6
    if triage_class == "B":
        score = analysis.get("practitioner_output", {}).get("confidence_score", 1.0)
        if score > 0.6:
            analysis["practitioner_output"]["confidence_score"] = 0.6

    return {
        "success": True,
        "client_id": req.client_id,
        "triage_class": triage_class,
        "analysis": analysis
    }

# Demo 備案端點（競賽現場備用）
@app.get("/api/demo/sample")
def get_demo_sample():
    return {
        "success": True,
        "client_id": "demo_001",
        "triage_class": "A",
        "analysis": {
            "practitioner_output": {
                "pattern_summary": "久坐累積型，靜態負荷集中於肩胛與頸部",
                "primary_load_source": "長時間桌面工作導致的肩胛區域靜態負荷",
                "suggested_sequence": [
                    "肩胛周圍筋膜放鬆（菱形肌、提肩胛肌）",
                    "頸部肌群處理（上斜方肌）",
                    "主訴部位頸肩直接處理",
                    "手部延伸處理（視時間）"
                ],
                "sequence_reason": "先釋放肩胛筋膜根源，避免直接從主訴入手效果不持久。",
                "caution_notes": "此客戶無特殊注意事項，可按建議順序進行。",
                "triage_class": "A",
                "confidence_score": 0.82
            },
            "client_output": {
                "pattern_type": "久坐累積型",
                "pattern_description": "您目前的身體使用模式屬於久坐累積型，頸肩區域長期承受靜態負荷。",
                "behavior_suggestions": [
                    "每小時起身活動 5 分鐘，做簡單的肩部繞環",
                    "調整螢幕高度至眼睛平視，減少頸部前傾",
                    "可至附近合作調理中心進行定期舒緩"
                ]
            },
            "behavior_tags": {
                "pattern_type": "sedentary_accumulation",
                "primary_load_source": "static_shoulder_neck",
                "lifestyle_tags": ["久坐", "螢幕工作"],
                "discomfort_areas": ["頸部", "肩部"]
            }
        }
    }