-- P1-6 FIX: Create audit_logs table for comprehensive audit logging
-- Run this in Supabase SQL Editor

-- Drop if exists (for safe re-running)
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    
    -- User who performed the action
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    
    -- Resource affected
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    
    -- Additional context
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Create index for JSONB searches
CREATE INDEX idx_audit_logs_details ON audit_logs USING gin(details);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can read audit logs
CREATE POLICY "audit_logs_select_policy" ON audit_logs
FOR SELECT TO authenticated
USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'FEDEX_ADMIN', 'AUDITOR')
);

-- Service role can insert (for API routes)
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- (No UPDATE or DELETE policies = denied by default)

-- Create a view for easy querying with user names
CREATE OR REPLACE VIEW audit_logs_with_users AS
SELECT 
    al.*,
    u.full_name as user_name,
    u.role as user_role
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id;

-- Grant access to the view
GRANT SELECT ON audit_logs_with_users TO authenticated;

-- Create a function to clean up old audit logs (optional, run via cron)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify table was created
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;
