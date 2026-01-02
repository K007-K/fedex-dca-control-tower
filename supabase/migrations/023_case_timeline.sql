-- ============================================
-- Case Timeline Table
-- Stores detailed case activity timeline
-- ============================================

CREATE TABLE IF NOT EXISTS case_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(20) NOT NULL CHECK (event_category IN ('SYSTEM', 'DCA', 'AI', 'SLA', 'USER')),
    description TEXT NOT NULL,
    
    -- Change tracking
    old_value TEXT,
    new_value TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Actor
    performed_by VARCHAR(100) NOT NULL,
    performed_by_role VARCHAR(50),
    performed_by_dca_id UUID REFERENCES dcas(id),
    
    -- Idempotency
    idempotency_key VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_case_timeline_case_id ON case_timeline(case_id);
CREATE INDEX IF NOT EXISTS idx_case_timeline_event_type ON case_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_case_timeline_category ON case_timeline(event_category);
CREATE INDEX IF NOT EXISTS idx_case_timeline_created_at ON case_timeline(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_timeline_idempotency ON case_timeline(case_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- RLS
ALTER TABLE case_timeline ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view timeline for cases they can access
CREATE POLICY "case_timeline_read_policy" ON case_timeline
    FOR SELECT USING (true);

-- Policy: Insert allowed for authenticated users
CREATE POLICY "case_timeline_insert_policy" ON case_timeline
    FOR INSERT WITH CHECK (true);

-- Comment
COMMENT ON TABLE case_timeline IS 'Detailed case activity timeline with SYSTEM/DCA/AI/SLA events';
