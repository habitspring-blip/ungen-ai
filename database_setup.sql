-- Complete Database Setup for UnGen AI
-- Run this in your Supabase SQL Editor

-- ===========================================
-- 1. CREATE TABLES
-- ===========================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    credits INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    preprocessed JSONB,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    status VARCHAR(50) DEFAULT 'ready',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Summaries table
CREATE TABLE IF NOT EXISTS public.summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    method VARCHAR(50),
    config JSONB,
    metrics JSONB,
    model_version VARCHAR(100),
    processing_time INTEGER,
    confidence REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_id UUID REFERENCES public.summaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER,
    feedback_type VARCHAR(50),
    edited_summary TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(100),
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    summary_id UUID REFERENCES public.summaries(id) ON DELETE SET NULL,
    processing_time INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 2. CREATE INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON public.summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);

-- ===========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ===========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 4. CREATE RLS POLICIES
-- ===========================================

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- Summaries policies
CREATE POLICY "Users can view own summaries" ON public.summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries" ON public.summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries" ON public.summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries" ON public.summaries
    FOR DELETE USING (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON public.feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.feedback
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON public.feedback
    FOR DELETE USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- 5. GRANT PERMISSIONS TO SERVICE ROLE
-- ===========================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;

-- Grant permissions on tables
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.documents TO service_role;
GRANT ALL ON public.summaries TO service_role;
GRANT ALL ON public.feedback TO service_role;
GRANT ALL ON public.usage_logs TO service_role;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ===========================================
-- 6. CREATE TRIGGER FOR USER SYNC
-- ===========================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 7. UPDATE TRIGGER FOR USERS TABLE
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- 8. GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ===========================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.summaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT SELECT, INSERT ON public.usage_logs TO authenticated;

-- ===========================================
-- 9. CREATE VIEWS FOR EASIER QUERIES (OPTIONAL)
-- ===========================================

-- View for user documents with summary counts
CREATE OR REPLACE VIEW public.user_documents AS
SELECT
    d.*,
    COUNT(s.id) as summary_count
FROM public.documents d
LEFT JOIN public.summaries s ON d.id = s.document_id
WHERE d.user_id = auth.uid()
GROUP BY d.id;

-- Grant permissions on view
GRANT SELECT ON public.user_documents TO authenticated;

-- ===========================================
-- SETUP COMPLETE
-- ===========================================

-- Verify setup by checking tables exist
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'documents', 'summaries', 'feedback', 'usage_logs')
ORDER BY tablename;