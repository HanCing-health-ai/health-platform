'use server';

import { createClient } from '@supabase/supabase-js';
import triageKeywords from './triage_keywords.json';

// 初始化 Supabase Client (使用 Service Role Key 繞過 RLS，適合在 Server端執行)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// 第一道防線：出口防護違規字庫 (V1 收尾交接說明要求不得更改)
const FORBIDDEN_WORDS = [
  "診斷", "確診", "病因", "病症", "症狀", "疾病", "病變",
  "治療", "療效", "醫治", "處方", "藥物", "痊癒", "康復",
  "治癒", "風險", "併發症", "惡化", "緊急", "危險"
];

async function validateOutput(clientOutput: Record<string, unknown>, responseId: string, clientId: string): Promise<void> {
  const textToCheck = JSON.stringify(clientOutput, null, 0);
  const violations = FORBIDDEN_WORDS.filter(word => textToCheck.includes(word));
  if (violations.length > 0) {
    // 寫入 injection_attempts 資料表記錄
    await supabase.from('injection_attempts').insert([{
      response_id: responseId,
      client_id: clientId,
      violations: violations
    }]);
    throw new Error(`語言合規違規：${violations.join('、')}`);
  }
}

export async function submitQuestionnaire(formData: {
  name: string;
  phone: string;
  occupation_type: string;
  discomfort_areas: string[];
  primary_complaint: string;
  lifestyle_description: string;
  duration_type: string;
  special_notes: string;
  is_on_medication: boolean;
  is_test?: boolean;
  lifestyle_factors?: any;
}) {
  try {
    // === Input Quality Gate ===
    if (formData.lifestyle_description.trim().length < 15) {
      return { success: false, error: "請補充更多生活習慣描述（至少 15 字），以利系統分析。" };
    }
    if (formData.discomfort_areas.length === 0) {
      return { success: false, error: "請至少選擇一個不適部位。" };
    }

    // === Local Triage Logic (Code Layer) ===
    let triageClass = 'A';
    let isBlocked = false;
    const triggeredKeywords: string[] = [];

    // C-Class Check (Critical Red Flags)
    const allText = `${formData.lifestyle_description} ${formData.special_notes} ${formData.primary_complaint}`;
    triageKeywords.group_1_critical.forEach((kw: string) => {
      if (allText.includes(kw)) triggeredKeywords.push(kw);
    });
    triageKeywords.group_3_inquiry.forEach((kw: string) => {
      if (allText.includes(kw)) triggeredKeywords.push(kw);
    });

    if (triggeredKeywords.length > 0 || formData.discomfort_areas.includes('胸部') || formData.discomfort_areas.includes('頭部')) {
      triageClass = 'C';
      isBlocked = true;
    } 
    // B-Class Check
    else if (
      formData.is_on_medication || 
      formData.duration_type === '半年以上' || 
      formData.duration_type === '一個月以上' ||
      formData.special_notes.trim().length > 0 ||
      formData.discomfort_areas.length >= 4
    ) {
      triageClass = 'B';
    }

    // 0. Studio Setup
    const studioRes = await supabase
      .from('studios')
      .select('id')
      .eq('name', 'Demo Studio')
      .single();
    let studio = studioRes.data;
    const studioErr = studioRes.error;

    if (studioErr || !studio) {
      const { data: newStudio, error: newStudioErr } = await supabase
        .from('studios')
        .insert([{ name: 'Demo Studio', owner_name: 'Admin', is_active: true }])
        .select('id')
        .single();
      if (newStudioErr) throw new Error('無法建立預設工作室');
      studio = newStudio;
    }

    const studioId = studio.id;

    // 1. Client Setup
    const clientRes = await supabase
      .from('clients')
      .select('id')
      .eq('phone', formData.phone)
      .single();
    const client = clientRes.data;
    const _clientFetchErr = clientRes.error;

    let clientId;
    if (!client) {
      const { data: newClient, error: clientInsertErr } = await supabase
        .from('clients')
        .insert([{
          studio_id: studioId,
          name: formData.name,
          phone: formData.phone,
          occupation_type: formData.occupation_type,
          phone_verified: true
        }])
        .select('id')
        .single();
      
      if (clientInsertErr) throw new Error('無法建立客戶資料: ' + clientInsertErr.message);
      clientId = newClient.id;
    } else {
      clientId = client.id;
      // Step 2 Identity Defense: Update existing unverified clients upon successful OTP submission
      await supabase.from('clients').update({ phone_verified: true }).eq('id', clientId);
    }

    // 2. Write response
    const { data: responseData, error: responseErr } = await supabase
      .from('questionnaire_responses')
      .insert([{
        client_id: clientId,
        studio_id: studioId,
        discomfort_areas: formData.discomfort_areas,
        lifestyle_description: formData.lifestyle_description,
        primary_complaint: formData.primary_complaint,
        duration_type: formData.duration_type,
        special_notes: formData.special_notes,
        is_on_medication: formData.is_on_medication,
        lifestyle_factors: formData.lifestyle_factors
      }])
      .select('id')
      .single();

    if (responseErr) throw new Error('無法寫入問卷資料: ' + responseErr.message);

    // 3. Claude API Inference (if not blocked)
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    
    if (isBlocked) {
      // C-Class: Skip AI, store hard blocked result
      await supabase.from('insight_reports').insert([{
        response_id: responseData.id,
        client_id: clientId,
        risk_class: 'C',
        is_blocked: true,
        analysis_master: "此客戶觸發風險警示 (包含關鍵字或敏感部位)，建議優先諮詢醫療人員。",
        analysis_client: "您目前描述的狀況建議優先諮詢醫療專業人員，本系統暫不提供調理建議。",
        pattern_type: "風險阻斷",
        primary_load_source: "醫療風險檢測觸發",
        lifestyle_tags: ["建議就醫", "紅旗警示"],
        suggestion_reason: "觸發預設風險關鍵字或涉及胸口/頭部等敏感部位，為安全計進行自動阻斷。",
        confidence_score: 1.0
      }]);
      
      // Step 4 Automation: Trigger n8n Webhook for C-Class Line Notify
      if (process.env.N8N_WEBHOOK_URL) {
        await triggerN8nWebhook(process.env.N8N_WEBHOOK_URL, {
          event: "client_intake_v1",
          risk_class: "C",
          pattern_type: "風險阻斷",
          primary_load_source: "醫療風險檢測觸發",
          analysis_master: "此客戶觸發風險警示 (包含關鍵字或敏感部位)，建議優先諮詢醫療人員。"
        });
      }

      return { success: true, responseId: responseData.id };
    }

    if (claudeApiKey) {
      try {
        const systemPrompt = `你是 ConditionAI 的健康調理行為分析助理，專門協助調理師傅在服務前快速掌握客戶的身體使用模式。

注意：目前的初步風險等級判定為 \${triageClass}。若為 B 類，信心分數建議在 0.6 以下。

【角色定位】
- 你分析的是「行為模式」，不是醫療狀況
- 你的輸出是「調理參考建議」，師傅保有最終決策權
- 所有建議必須基於客戶填寫的生活習慣與身體使用狀況

【絕對禁止詞彙——以下詞彙不得出現在任何輸出欄位】
診斷、確診、病因、病症、症狀、疾病、病變、治療、療效、醫治、處方、藥物、痊癒、康復、治癒、風險、併發症、惡化、緊急、危險、發炎、病理、損傷、受傷、受損

【輸出格式——嚴格遵守以下 JSON 結構】
你必須回傳 JSON 格式，且不包含額外文字。JSON 欄位包含：
{
  "behavior_pattern_type": "行為模式類型（15字以內）",
  "behavior_tags": ["標籤1", "標籤2", "標籤3"],
  "primary_load_source": "主要負荷來源 (10字以內)",
  "risk_class": "最終判定風險等級(A/B/C)",
  "confidence_score": 0.85,
  "analysis_client": "（見客戶版 Markdown 格式規格）",
  "analysis_master": "（見師傅版 Markdown 格式規格）"
}

【analysis_client 輸出規格】
嚴格按照以下 Markdown 格式輸出，不得增減段落：
[開場白——有溫度、白話、讓客戶感覺被理解，不超過 40 字，不得以行為模式類型名稱開頭]

**您的身體使用模式**
[用客戶聽得懂的語言說明身體使用模式的成因，重點是「為什麼會這樣」而非「結果是什麼」，不超過 60 字]

**今日建議**
- [具體可執行的生活習慣調整，不超過 30 字]
- [具體可執行的生活習慣調整，不超過 30 字]
- [具體可執行的生活習慣調整，不超過 30 字]

[結尾鼓勵語——正向、有溫度，不超過 25 字]

【analysis_master 輸出規格】
嚴格按照以下 Markdown 格式輸出，不得增減段落：
## 本次調理重點
[一句話說明本次服務的核心目標，不超過 20 字，讓師傅一眼掌握方向]

**優先關注部位**
- 🔴 [第一優先部位——最需要優先處理]
- 🟡 [第二優先部位]

**核心發現**
[根據客戶描述，直接說明主要的身體使用模式與需要關注的方向，不超過 40 字]

**手法建議**
- [具體調理方向建議，不超過 30 字]
- [具體調理方向建議，不超過 30 字]
- [具體調理方向建議，不超過 30 字]

**回訪追蹤**
[提示師傅下次回訪時需特別觀察的面向，不超過 30 字]`;

        const payload = {
          job_type: formData.occupation_type,
          discomfort_areas: formData.discomfort_areas,
          lifestyle_description: formData.lifestyle_description,
          lifestyle_factors: formData.lifestyle_factors,
          primary_complaint: formData.primary_complaint,
          duration_type: formData.duration_type,
          special_notes: formData.special_notes,
          risk_class_hint: triageClass
        };

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": claudeApiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: "user", content: JSON.stringify(payload) }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const resultText = data.content[0].text;
          
          let parsedResult;
          try {
            const cleanedText = resultText.trim().replace(/^```json/, '').replace(/```$/, '').trim();
            parsedResult = JSON.parse(cleanedText);
          } catch(_e) {
            console.error("JSON 解析失敗:", resultText);
            throw new Error("AI 分析格式錯誤");
          }

          // Step 3 Exit Defense: Language Compliance Scan before writing to DB
          await validateOutput(parsedResult, responseData.id, clientId);

          const { error: insertErr } = await supabase.from('insight_reports').insert([{
            response_id: responseData.id,
            client_id: clientId,
            risk_class: parsedResult.risk_class || triageClass,
            is_blocked: false,
            analysis_master: parsedResult.analysis_master,
            analysis_client: parsedResult.analysis_client,
            pattern_type: parsedResult.behavior_pattern_type || parsedResult.pattern_type || "未分類模式",
            primary_load_source: parsedResult.primary_load_source || "日常累積",
            lifestyle_tags: parsedResult.behavior_tags || parsedResult.lifestyle_tags || [],
            suggestion_reason: parsedResult.suggestion_reason || "",
            confidence_score: triageClass === 'B' ? Math.min(parsedResult.confidence_score || 0.6, 0.6) : (parsedResult.confidence_score || 0.8)
          }]);
          
          if (insertErr) throw insertErr;

          // Step 4 Automation: Trigger n8n Webhook for A/B-Class Line Notify
          if (process.env.N8N_WEBHOOK_URL) {
            await triggerN8nWebhook(process.env.N8N_WEBHOOK_URL, {
              event: "client_intake_v1",
              risk_class: parsedResult.risk_class || triageClass,
              pattern_type: parsedResult.behavior_pattern_type || parsedResult.pattern_type || "未分類模式",
              primary_load_source: parsedResult.primary_load_source || "日常累積",
              analysis_master: parsedResult.analysis_master
            });
          }

        } else {
          throw new Error("Claude API 呼叫失敗");
        }
      } catch (err: unknown) {
        console.error("Claude 處理錯誤:", err);
        return { success: false, error: "AI 分析失敗，請稍後再試" };
      }
    }

    return { success: true, responseId: responseData.id };
  } catch (error: unknown) {
    console.error("提交錯誤:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getInsightReport(responseId: string) {
  try {
    const { data: insightReport, error } = await supabase
      .from('insight_reports')
      .select('*')
      .eq('response_id', responseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Fetch insight report error:", error);
      return { success: false, error: error.message };
    }

    if (!insightReport) {
      return { success: true, isReady: false, data: null };
    }

    return { success: true, isReady: true, data: insightReport };
  } catch (error: unknown) {
    console.error("getInsightReport exception:", error);
    return { success: false, error: (error as Error).message };
  }
}

// === Webhook Utility (Step 1 Entry Defense) ===
/**
 * 觸發 n8n Webhook 專用函式，自動附加安全 Token
 * @param webhookUrl 目標 n8n Webhook URL
 * @param payload 要傳送的 JSON 資料
 * @returns { success: boolean, error?: string }
 */
export async function triggerN8nWebhook(webhookUrl: string, payload: unknown) {
  try {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) throw new Error("缺少 WEBHOOK_SECRET 環境變數");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ConditionAI-Token": secret
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook 請求失敗，狀態碼: ${response.status}`);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("triggerN8nWebhook 執行失敗:", err);
    return { success: false, error: (err as Error).message };
  }
}
