-- ============================================================
-- 跨技術健康調理資料整合與決策支援平台
-- Supabase PostgreSQL Schema
-- ============================================================
-- 注意：本系統為行為模式導向的健康管理工具，非醫療器材。
-- 所有欄位設計不得涉及診斷、治療、病因、處方相關資料。
-- ============================================================

-- 啟用 UUID 擴充功能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 標籤資料表（Tag Tables）— 系統預設參考資料，不含個人健康資料
-- ============================================================

-- 調理活動標籤（wellness_logs 使用）
CREATE TABLE wellness_activity_tags (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        text        NOT NULL UNIQUE,      -- 標籤名稱，例如：傳統整復
    category    text        NOT NULL,             -- 分類名稱，例如：整復推拿類
    is_custom   boolean     NOT NULL DEFAULT false, -- false = 系統預設；true = 人工審核新增
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 身體部位標籤（body_sensation_logs 使用）
CREATE TABLE body_area_tags (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        text        NOT NULL UNIQUE,      -- 部位名稱，例如：肩膀
    is_custom   boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 身體感受類型標籤（body_sensation_logs 使用）
CREATE TABLE sensation_type_tags (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        text        NOT NULL UNIQUE,      -- 感受名稱，例如：緊繃
    is_custom   boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 使用者資料表
-- ============================================================

-- 使用者基本資料（對應 Supabase Auth auth.users）
-- 遵循 PDPA：不得儲存真實姓名 + 健康資料的組合
CREATE TABLE profiles (
    id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,                            -- 顯示名稱（非真實姓名）
    timezone     text        NOT NULL DEFAULT 'Asia/Taipei',
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 每日記錄主表
-- ============================================================

-- 每日健康調理記錄（主表，每位使用者每天只有一筆）
CREATE TABLE daily_records (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    record_date date        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, record_date)                -- 每人每日唯一
);

-- ============================================================
-- 細項記錄子表（皆關聯 daily_records）
-- ============================================================

-- 睡眠記錄
CREATE TABLE sleep_logs (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id       uuid        NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
    sleep_time      time,                        -- 入睡時間
    wake_time       time,                        -- 起床時間
    duration_hours  numeric(4,2),                -- 總睡眠時數（自動計算或手動填寫）
    quality_score   smallint    CHECK (quality_score BETWEEN 1 AND 5), -- 主觀品質 1-5
    notes           text,                        -- 補充備註
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- 飲食記錄（一天可有多筆，對應不同餐次）
CREATE TABLE diet_logs (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id       uuid        NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
    meal_type       text        CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    description     text,                        -- 飲食內容描述
    water_intake_ml integer,                     -- 飲水量（ml）
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- 身體感受記錄（量化指標 + 部位/感受標籤 + 自由文字）
CREATE TABLE body_sensation_logs (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id       uuid        NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
    energy_level    smallint    CHECK (energy_level BETWEEN 1 AND 5),  -- 精力水準
    stress_level    smallint    CHECK (stress_level BETWEEN 1 AND 5),  -- 壓力感受
    mood_score      smallint    CHECK (mood_score BETWEEN 1 AND 5),    -- 心情
    custom_note     text,                        -- 使用者自述（非診斷性文字）
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- 調理項目記錄（每筆為一次調理活動，可附多個標籤）
CREATE TABLE wellness_logs (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id       uuid        NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
    duration_minutes integer,                    -- 執行時間（分鐘）
    custom_note     text,                        -- 使用者自述補充
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 標籤關聯表（Junction Tables）
-- ============================================================

-- wellness_logs <-> wellness_activity_tags（多對多）
CREATE TABLE wellness_log_tags (
    wellness_log_id uuid NOT NULL REFERENCES wellness_logs(id) ON DELETE CASCADE,
    tag_id          uuid NOT NULL REFERENCES wellness_activity_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (wellness_log_id, tag_id)
);

-- body_sensation_logs <-> body_area_tags（多對多）
CREATE TABLE body_sensation_area_tags (
    sensation_log_id uuid NOT NULL REFERENCES body_sensation_logs(id) ON DELETE CASCADE,
    tag_id           uuid NOT NULL REFERENCES body_area_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (sensation_log_id, tag_id)
);

-- body_sensation_logs <-> sensation_type_tags（多對多）
CREATE TABLE body_sensation_type_tags (
    sensation_log_id uuid NOT NULL REFERENCES body_sensation_logs(id) ON DELETE CASCADE,
    tag_id           uuid NOT NULL REFERENCES sensation_type_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (sensation_log_id, tag_id)
);

-- ============================================================
-- AI 分析結果（由 n8n + Ollama 產生，非醫療診斷）
-- ============================================================

CREATE TABLE ai_analysis_results (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    analysis_date   date        NOT NULL,        -- 分析基準日
    summary         text        NOT NULL,        -- 行為模式摘要（非診斷內容）
    model_version   text,                        -- Ollama 模型名稱，例如：llama3.2
    generated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 觸發器：自動更新 updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON daily_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 觸發器：新使用者自動建立 profile
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Row Level Security（RLS）— 確保使用者只能存取自己的資料
-- ============================================================

-- 啟用 RLS
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_sensation_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_sensation_area_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_sensation_type_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_log_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_results     ENABLE ROW LEVEL SECURITY;
-- 標籤表：所有認證使用者可讀，僅限系統/管理者可寫
ALTER TABLE wellness_activity_tags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_area_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensation_type_tags     ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----
CREATE POLICY "使用者可讀取自己的 profile"
    ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "使用者可新增自己的 profile"
    ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "使用者可更新自己的 profile"
    ON profiles FOR UPDATE USING (id = auth.uid());

-- ---- daily_records ----
CREATE POLICY "使用者可讀取自己的每日記錄"
    ON daily_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "使用者可新增自己的每日記錄"
    ON daily_records FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "使用者可更新自己的每日記錄"
    ON daily_records FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "使用者可刪除自己的每日記錄"
    ON daily_records FOR DELETE USING (user_id = auth.uid());

-- ---- sleep_logs ----
CREATE POLICY "使用者可操作自己的睡眠記錄"
    ON sleep_logs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM daily_records
        WHERE daily_records.id = sleep_logs.record_id
          AND daily_records.user_id = auth.uid()
    ));

-- ---- diet_logs ----
CREATE POLICY "使用者可操作自己的飲食記錄"
    ON diet_logs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM daily_records
        WHERE daily_records.id = diet_logs.record_id
          AND daily_records.user_id = auth.uid()
    ));

-- ---- body_sensation_logs ----
CREATE POLICY "使用者可操作自己的身體感受記錄"
    ON body_sensation_logs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM daily_records
        WHERE daily_records.id = body_sensation_logs.record_id
          AND daily_records.user_id = auth.uid()
    ));

-- ---- body_sensation_area_tags ----
CREATE POLICY "使用者可操作自己的部位標籤關聯"
    ON body_sensation_area_tags FOR ALL
    USING (EXISTS (
        SELECT 1 FROM body_sensation_logs bsl
        JOIN daily_records dr ON dr.id = bsl.record_id
        WHERE bsl.id = body_sensation_area_tags.sensation_log_id
          AND dr.user_id = auth.uid()
    ));

-- ---- body_sensation_type_tags ----
CREATE POLICY "使用者可操作自己的感受類型標籤關聯"
    ON body_sensation_type_tags FOR ALL
    USING (EXISTS (
        SELECT 1 FROM body_sensation_logs bsl
        JOIN daily_records dr ON dr.id = bsl.record_id
        WHERE bsl.id = body_sensation_type_tags.sensation_log_id
          AND dr.user_id = auth.uid()
    ));

-- ---- wellness_logs ----
CREATE POLICY "使用者可操作自己的調理記錄"
    ON wellness_logs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM daily_records
        WHERE daily_records.id = wellness_logs.record_id
          AND daily_records.user_id = auth.uid()
    ));

-- ---- wellness_log_tags ----
CREATE POLICY "使用者可操作自己的調理標籤關聯"
    ON wellness_log_tags FOR ALL
    USING (EXISTS (
        SELECT 1 FROM wellness_logs wl
        JOIN daily_records dr ON dr.id = wl.record_id
        WHERE wl.id = wellness_log_tags.wellness_log_id
          AND dr.user_id = auth.uid()
    ));

-- ---- ai_analysis_results ----
CREATE POLICY "使用者可讀取自己的 AI 分析結果"
    ON ai_analysis_results FOR SELECT USING (user_id = auth.uid());
-- INSERT/UPDATE 由 n8n service_role 執行，不開放一般使用者寫入

-- ---- 標籤資料表：所有認證使用者可讀，寫入僅限 service_role ----
CREATE POLICY "認證使用者可讀取調理活動標籤"
    ON wellness_activity_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "認證使用者可讀取身體部位標籤"
    ON body_area_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "認證使用者可讀取感受類型標籤"
    ON sensation_type_tags FOR SELECT TO authenticated USING (true);
