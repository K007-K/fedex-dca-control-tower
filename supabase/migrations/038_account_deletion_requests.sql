-- Account Deletion Requests table
-- Stores requests from users for account deletion that need approval from superior roles

CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    requester_email TEXT NOT NULL,
    requester_name TEXT,
    requester_role TEXT NOT NULL,
    requester_dca_id UUID, -- For DCA users, store their DCA for scoping
    reason TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    handled_by UUID,
    handled_at TIMESTAMPTZ,
    handler_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_dca_id ON account_deletion_requests(requester_dca_id);

-- RLS Policies
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own deletion requests"
    ON account_deletion_requests
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY "Users can create own deletion requests"
    ON account_deletion_requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can cancel their own pending requests
CREATE POLICY "Users can cancel own pending requests"
    ON account_deletion_requests
    FOR UPDATE
    USING (user_id = auth.uid() AND status = 'PENDING')
    WITH CHECK (status = 'CANCELLED');

-- Superior roles can view and handle requests (handled via API with admin client)
-- This allows service role to bypass RLS for admin operations

COMMENT ON TABLE account_deletion_requests IS 'Stores account deletion requests that require approval from superior roles';
