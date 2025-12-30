-- API Keys table for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Production API Key',
    key_hash VARCHAR(255) NOT NULL, -- Store hashed version of the key
    key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for display (fedex_prod_xxxx...)
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Webhooks table for event subscriptions
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255), -- For HMAC signature verification
    events TEXT[] NOT NULL DEFAULT '{}', -- Array of event types
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook delivery logs for debugging
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_time ON webhook_deliveries(delivered_at DESC);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- API Keys: Admins can manage
CREATE POLICY "api_keys_admin_all" ON api_keys
    FOR ALL TO authenticated
    USING (TRUE);

-- Webhooks: Admins can manage  
CREATE POLICY "webhooks_admin_all" ON webhooks
    FOR ALL TO authenticated
    USING (TRUE);

-- Webhook Deliveries: Read-only for viewing logs
CREATE POLICY "webhook_deliveries_read" ON webhook_deliveries
    FOR SELECT TO authenticated
    USING (TRUE);
