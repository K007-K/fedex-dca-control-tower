-- Run this SQL in Supabase SQL Editor to verify/fix api_keys table

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'api_keys'
);

-- If it doesn't exist, this will create it:
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,  -- Made optional (no FK constraint)
    name VARCHAR(255) NOT NULL DEFAULT 'Production API Key',
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(30) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,  -- Made optional (no FK constraint)
    revoked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "api_keys_admin_all" ON api_keys;

-- Create permissive policy for authenticated users
CREATE POLICY "api_keys_admin_all" ON api_keys
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify the table is accessible
SELECT COUNT(*) FROM api_keys;
