-- 身體使用模式分析系統 Database Schema V3.7 (PostgreSQL for Supabase)

-- 1. studios (工作室主體)
CREATE TABLE public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  owner_name VARCHAR(100),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. practitioners (師傅資料)
CREATE TABLE public.practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  specialty_tags TEXT[],       -- 專長標籤
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. clients (客戶基本資料)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  birth_year INTEGER,
  occupation_type VARCHAR(100),
  last_followup_sent TIMESTAMP WITH TIME ZONE, -- 儲存最後一次發送回訪的時間 (V4.0新增)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. questionnaire_responses (問卷收集資料，每次問卷一筆)
CREATE TABLE public.questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  discomfort_areas TEXT[] NOT NULL,         -- 勾選的不適部位
  lifestyle_description TEXT,               -- 生活習慣描述
  primary_complaint TEXT,                   -- 主訴
  duration_type VARCHAR(50),                -- 持續時間 (例如: 超過半年)
  special_notes TEXT,                       -- 特殊備註/舊傷
  is_on_medication BOOLEAN DEFAULT false,   -- 是否正在用藥
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. triage_results (分流結果計算)
CREATE TABLE public.triage_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES public.questionnaire_responses(id) ON DELETE CASCADE,
  triage_class VARCHAR(1) CHECK (triage_class IN ('A', 'B', 'C')),
  triggered_keywords TEXT[],                -- 觸發的 C 類關鍵字
  triage_reason TEXT,                       -- 觸發原因說明
  is_blocked BOOLEAN DEFAULT false,         -- 是否被阻斷 (C類為 true)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. insight_reports (LLM 雙向洞察與標籤)
CREATE TABLE public.insight_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES public.questionnaire_responses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  risk_class VARCHAR(1) CHECK (risk_class IN ('A', 'B', 'C')),
  is_blocked BOOLEAN DEFAULT false,
  analysis_master TEXT,                     -- 師傅版分析
  analysis_client TEXT,                     -- 客戶版分析
  pattern_type VARCHAR(100),                -- 例如: 久坐累積型
  primary_load_source VARCHAR(100),         -- 主要負荷來源
  lifestyle_tags TEXT[],                    -- 行為模式標籤 (behavior_tags)
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  suggestion_reason TEXT,                   -- 可解釋性建議理由
  generated_by VARCHAR(50) DEFAULT 'claude-3.5-sonnet', -- 資料來源版本
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. follow_up_responses (定期回訪問卷，V1 埋入以支撐縱向資料)
CREATE TABLE public.follow_up_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  original_response_id UUID REFERENCES public.questionnaire_responses(id) ON DELETE SET NULL,
  improvement_score INTEGER CHECK (improvement_score BETWEEN 1 AND 5), -- 改善程度
  current_status TEXT,                      -- 目前狀況
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 政策 (範例)
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_responses ENABLE ROW LEVEL SECURITY;

-- 允許已驗證的使用者 (工作室帳號) 讀取/操作自己工作室的資料
-- 允許已驗證的使用者 (工作室帳號) 讀取/操作自己工作室的資料
CREATE POLICY "Studios can view own data" ON public.studios FOR SELECT USING (id = auth.uid());
-- 其他相關表亦將依照 studio_id 進行過濾 (需將 auth.uid() 對應到 practitioners 或 studios)

-- 匿名送出表單預設開放 INSERT (但由 n8n 或 Next.js 進行驗證寫入)
-- Layer 4 防護要求：確保跨工作室資料不能越權存取

-- 8. injection_attempts (安全攔截紀錄 - V1 出口防線)
CREATE TABLE public.injection_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES public.questionnaire_responses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  violations TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
