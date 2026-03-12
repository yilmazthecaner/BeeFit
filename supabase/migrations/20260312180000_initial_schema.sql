-- ==========================================
-- BeeFit — Initial Database Schema
-- Supabase PostgreSQL Migration
-- ==========================================

-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    height_cm NUMERIC(5,1),
    weight_kg NUMERIC(5,1),
    fitness_goal TEXT CHECK (fitness_goal IN ('lose_weight', 'build_muscle', 'maintain', 'endurance', 'general')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    daily_calorie_target INT,
    daily_protein_g INT,
    daily_carbs_g INT,
    daily_fat_g INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link users table to Supabase Auth
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- ==========================================
-- WORKOUT PLANS
-- ==========================================
CREATE TABLE workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
    goal TEXT,
    equipment TEXT[],
    generated_by TEXT DEFAULT 'ai',
    plan_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    starts_at DATE,
    ends_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own plans"
    ON workout_plans FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_workout_plans_user_active
    ON workout_plans(user_id, is_active);

-- ==========================================
-- WORKOUT LOGS
-- ==========================================
CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    workout_type TEXT NOT NULL,
    title TEXT,
    duration_minutes INT,
    calories_burned INT,
    avg_heart_rate INT,
    max_heart_rate INT,
    source TEXT DEFAULT 'manual',
    external_id TEXT,
    exercises JSONB,
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own workout logs"
    ON workout_logs FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_workout_logs_user_date
    ON workout_logs(user_id, logged_at DESC);

CREATE INDEX idx_workout_logs_external
    ON workout_logs(user_id, source, external_id);

-- ==========================================
-- MEAL LOGS
-- ==========================================
CREATE TABLE meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    photo_url TEXT,
    total_calories INT,
    total_protein_g NUMERIC(6,1),
    total_carbs_g NUMERIC(6,1),
    total_fat_g NUMERIC(6,1),
    total_fiber_g NUMERIC(6,1),
    ai_analysis JSONB,
    ai_feedback TEXT,
    logged_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own meal logs"
    ON meal_logs FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_meal_logs_user_date
    ON meal_logs(user_id, logged_at DESC);

-- ==========================================
-- MEAL ITEMS
-- ==========================================
CREATE TABLE meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID REFERENCES meal_logs(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    portion_size TEXT,
    calories INT,
    protein_g NUMERIC(5,1),
    carbs_g NUMERIC(5,1),
    fat_g NUMERIC(5,1),
    fiber_g NUMERIC(5,1),
    confidence NUMERIC(3,2)
);

ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meal items"
    ON meal_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM meal_logs
            WHERE meal_logs.id = meal_items.meal_id
            AND meal_logs.user_id = auth.uid()
        )
    );

-- ==========================================
-- AI CONTEXT ENTRIES (Vector Search)
-- ==========================================
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE ai_context_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    source_table TEXT,
    source_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_context_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own context"
    ON ai_context_entries FOR SELECT
    USING (auth.uid() = user_id);

-- HNSW index for fast similarity search (works on empty tables unlike IVFFlat)
CREATE INDEX idx_ai_context_embedding
    ON ai_context_entries
    USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_ai_context_user
    ON ai_context_entries(user_id, created_at DESC);

-- ==========================================
-- COACH CONVERSATIONS
-- ==========================================
CREATE TABLE coach_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own conversations"
    ON coach_conversations FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_coach_conv_user
    ON coach_conversations(user_id, updated_at DESC);

-- ==========================================
-- VECTOR SIMILARITY SEARCH FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION match_context_entries(
    query_embedding VECTOR(1536),
    match_user_id UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    entry_type TEXT,
    source_table TEXT,
    source_id UUID,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ace.id,
        ace.content,
        ace.entry_type,
        ace.source_table,
        ace.source_id,
        ace.metadata,
        1 - (ace.embedding <=> query_embedding) AS similarity
    FROM ai_context_entries ace
    WHERE ace.user_id = match_user_id
      AND 1 - (ace.embedding <=> query_embedding) > match_threshold
    ORDER BY ace.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ==========================================
-- STORAGE BUCKET
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload meal photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'meal-photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Public read access for meal photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'meal-photos');
