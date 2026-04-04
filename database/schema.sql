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

-- 2. profiles (師傅資料)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  specialty_tags TEXT[],       -- 專長標籤
  line_user_id TEXT,           -- LINE User ID (V1.5新增，用於 Messaging API)
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
  is_test BOOLEAN DEFAULT false,            -- 測資隔離牆 (V1.5新增)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. questionnaire_responses (問卷收集資料，每次問卷一筆)
CREATE TABLE public.questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  discomfort_areas TEXT[] NOT NULL,         -- 勾選的不適部位
  lifestyle_description TEXT,               -- 生活習慣描述 (舊版文字描述)
  lifestyle_factors JSONB,                  -- 生活習慣與狀況 (V1.5 C組新增結構化資料)
  primary_complaint TEXT,                   -- 主訴
  duration_type VARCHAR(50),                -- 持續時間 (例如: 超過半年)
  special_notes TEXT,                       -- 特殊備註/舊傷
  is_on_medication BOOLEAN DEFAULT false,   -- 是否正在用藥
  is_test BOOLEAN DEFAULT false,            -- 測資隔離牆 (V1.5新增)
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
  is_test BOOLEAN DEFAULT false,            -- 測資隔離牆 (V1.5新增)
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
  is_test BOOLEAN DEFAULT false,            -- 測資隔離牆 (V1.5新增)
  metadata JSONB DEFAULT '{}'::jsonb,       -- 知識庫引用與附加資訊追蹤 (V1.5 B組新增)
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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_responses ENABLE ROW LEVEL SECURITY;

-- 允許已驗證的使用者 (工作室帳號) 讀取/操作自己工作室的資料
-- 允許已驗證的使用者 (工作室帳號) 讀取/操作自己工作室的資料
CREATE POLICY "Studios can view own data" ON public.studios FOR SELECT USING (id = auth.uid());
-- 其他相關表亦將依照 studio_id 進行過濾 (需將 auth.uid() 對應到 profiles 或 studios)

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

-- 9. treatment_records (調理記錄)
CREATE TABLE public.treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES public.profiles(id),
  response_id UUID REFERENCES public.questionnaire_responses(id) ON DELETE SET NULL,
  technique TEXT,                                -- 使用手法
  body_areas TEXT[] DEFAULT '{}',                -- 調理部位
  duration_minutes INTEGER,                      -- 調理時間（分鐘）
  notes TEXT,                                    -- 師傅備註
  ai_adoption_score INTEGER CHECK (ai_adoption_score BETWEEN 1 AND 5),   -- AI 建議採納程度（1-5，選填）
  self_confidence INTEGER CHECK (self_confidence BETWEEN 1 AND 5),       -- 師傅自評信心（1-5，選填）
  post_session_note TEXT,                        -- 調理後觀察筆記（選填）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_treatment_records_client_id ON public.treatment_records (client_id);
CREATE INDEX idx_treatment_records_practitioner_id ON public.treatment_records (practitioner_id);

-- RLS
ALTER TABLE public.treatment_records ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- V1.5 B組 知識管理系統 (Wave 1)
-- ==========================================

-- 9. knowledge_base (知識庫)
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('穴位', '配穴組合', '調理邏輯', '行為模式', '其他')),
  title TEXT NOT NULL,
  pattern_tags TEXT[] DEFAULT '{}',
  applicable_techniques TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  combo TEXT,
  contraindications TEXT[] DEFAULT '{}',
  caution_levels JSONB DEFAULT '{"absolute": [], "careful": [], "inform": []}',
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  source TEXT,
  source_credibility TEXT CHECK (source_credibility IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'suspended', 'partial', 'needs_revision', 'rejected')),
  conflict_ids UUID[] DEFAULT '{}',
  last_reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  contributor_id UUID REFERENCES public.profiles(id),
  version INTEGER NOT NULL DEFAULT 1,
  previous_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN 索引（加速標籤查詢）
CREATE INDEX idx_knowledge_base_pattern_tags ON public.knowledge_base USING GIN (pattern_tags);
CREATE INDEX idx_knowledge_base_applicable_techniques ON public.knowledge_base USING GIN (applicable_techniques);
CREATE INDEX idx_knowledge_base_contraindications ON public.knowledge_base USING GIN (contraindications);
CREATE INDEX idx_knowledge_base_status ON public.knowledge_base (status);

-- RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio_isolation" ON public.knowledge_base USING (true); -- V1.5 暫時開放，V2 加 studio_id 隔離


-- 10. tag_library (標籤庫)
CREATE TABLE public.tag_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'deprecated')),
  proposed_by TEXT NOT NULL DEFAULT 'system',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tag_library_status ON public.tag_library (status);
CREATE INDEX idx_tag_library_tag_name ON public.tag_library (tag_name);

-- RLS
ALTER TABLE public.tag_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_tags" ON public.tag_library FOR SELECT USING (status = 'active');
CREATE POLICY "service_role_all" ON public.tag_library USING (auth.role() = 'service_role');

-- 預設種入初始標籤（來自既有 behavior_tags 資料）
INSERT INTO public.tag_library (tag_name, description, status, proposed_by, approved_at) VALUES
('久坐累積型', '長時間坐姿造成腰背負擔累積', 'active', 'system', NOW()),
('前傾姿勢型', '頭頸前傾、圓肩的姿勢模式', 'active', 'system', NOW()),
('站立勞損型', '長時間站立造成下肢與腰部累積負擔', 'active', 'system', NOW()),
('睡眠壓力型', '睡眠品質差或壓力影響身體狀態', 'active', 'system', NOW()),
('3C過度使用型', '手機電腦使用過多造成頸肩緊繃', 'active', 'system', NOW());


-- 11. credits (點數系統)
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.profiles(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('knowledge_contributed', 'knowledge_approved', 'knowledge_cited', 'followup_completed', 'redeemed', 'bonus')),
  knowledge_id UUID REFERENCES public.knowledge_base(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_credits_practitioner_id ON public.credits (practitioner_id);
CREATE INDEX idx_credits_created_at ON public.credits (created_at);

-- RLS
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
-- 修復: 原為 practitioner_id 去比對 table 的自己，現改為取得目前 Auth user ID。
CREATE POLICY "own_credits_only" ON public.credits USING (practitioner_id = auth.uid());
