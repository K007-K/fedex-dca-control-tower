-- Migration: 034_agent_workbench.sql
-- Purpose: Database tables for DCA Agent Workbench
-- Created: 2026-01-05

-- ============================================
-- 1. CASE ACTIVITIES (Audit Trail)
-- Stores all actions taken on a case
-- ============================================
CREATE TABLE IF NOT EXISTS case_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'NOTE',              -- Agent note
        'CONTACT_ATTEMPT',   -- Phone/email/SMS attempt
        'STATUS_CHANGE',     -- Status transition
        'PAYMENT',           -- Payment recorded
        'ESCALATION',        -- Escalated to supervisor/legal
        'DOCUMENT',          -- Document uploaded
        'ASSIGNMENT',        -- Case assigned to agent
        'SYSTEM'             -- System-generated
    )),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    -- For CONTACT_ATTEMPT: {"method": "PHONE|EMAIL|SMS", "outcome": "ANSWERED|NO_ANSWER|VOICEMAIL|WRONG_NUMBER", "duration_seconds": 120}
    -- For PAYMENT: {"amount": 50000, "currency": "INR", "method": "BANK|CARD|CASH|UPI", "reference": "TXN123"}
    -- For ESCALATION: {"reason": "text", "escalated_to": "SUPERVISOR|LEGAL|DISPUTE"}
    -- For DOCUMENT: {"document_id": "uuid", "document_type": "type"}
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_activities_case_id ON case_activities(case_id);
CREATE INDEX IF NOT EXISTS idx_case_activities_type ON case_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_case_activities_created_at ON case_activities(created_at DESC);

-- ============================================
-- 2. CASE DOCUMENTS
-- File attachments for cases
-- ============================================
CREATE TABLE IF NOT EXISTS case_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'DEMAND_LETTER',     -- Formal demand letter
        'SETTLEMENT',        -- Settlement agreement
        'PAYMENT_RECEIPT',   -- Payment receipt
        'CUSTOMER_DOC',      -- Document from customer
        'INVOICE',           -- Original invoice
        'CORRESPONDENCE',    -- Email/letter correspondence
        'OTHER'              -- Other documents
    )),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);

-- ============================================
-- 3. SCHEDULED CALLBACKS
-- Reminders for agents to call back customers
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_callbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES users(id),
    scheduled_for TIMESTAMPTZ NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',           -- Scheduled, not yet due
        'COMPLETED',         -- Agent completed the callback
        'MISSED',            -- Agent missed the callback
        'CANCELLED'          -- Cancelled
    )),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_callbacks_agent_id ON scheduled_callbacks(agent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_callbacks_scheduled_for ON scheduled_callbacks(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_callbacks_status ON scheduled_callbacks(status);

-- ============================================
-- 4. PAYMENT PLANS
-- Installment plans for customers
-- ============================================
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    total_amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    installment_count INTEGER NOT NULL CHECK (installment_count > 0),
    installment_amount DECIMAL(12,2) NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (frequency IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY')),
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'PENDING',           -- Awaiting approval
        'ACTIVE',            -- Currently running
        'COMPLETED',         -- All payments made
        'DEFAULTED',         -- Customer missed payments
        'CANCELLED'          -- Plan cancelled
    )),
    next_payment_date DATE,
    payments_made INTEGER DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_plans_case_id ON payment_plans(case_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_next_payment ON payment_plans(next_payment_date);

-- ============================================
-- 5. MESSAGE TEMPLATES
-- Pre-approved email/SMS templates
-- ============================================
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dca_id UUID REFERENCES dcas(id),
    -- NULL dca_id = global template (FedEx-approved)
    template_type TEXT NOT NULL CHECK (template_type IN ('EMAIL', 'SMS', 'LETTER')),
    name TEXT NOT NULL,
    subject TEXT, -- For emails
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    -- e.g., ["customer_name", "amount_due", "due_date", "case_number"]
    is_active BOOLEAN DEFAULT TRUE,
    is_compliance_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_dca_id ON message_templates(dca_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active);

-- ============================================
-- 6. AGENT NOTIFICATIONS
-- Notifications specific to agents
-- ============================================
CREATE TABLE IF NOT EXISTS agent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id),
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'CASE_ASSIGNED',      -- New case assigned
        'SLA_DUE_SOON',       -- SLA approaching
        'SLA_BREACHED',       -- SLA breached
        'CALLBACK_REMINDER',  -- Callback scheduled
        'PAYMENT_RECEIVED',   -- Payment recorded on your case
        'ESCALATION_UPDATE',  -- Escalation resolved
        'SYSTEM_MESSAGE'      -- General message
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    case_id UUID REFERENCES cases(id),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_id ON agent_notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_unread ON agent_notifications(agent_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_agent_notifications_created_at ON agent_notifications(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Case Activities: Agent can view/create for their assigned cases
ALTER TABLE case_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view activities for their cases" ON case_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = case_activities.case_id 
            AND cases.assigned_agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can create activities for their cases" ON case_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = case_activities.case_id 
            AND cases.assigned_agent_id = auth.uid()
        )
    );

-- Case Documents: Same as activities
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view documents for their cases" ON case_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = case_documents.case_id 
            AND cases.assigned_agent_id = auth.uid()
        )
    );

CREATE POLICY "Agents can upload documents for their cases" ON case_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = case_documents.case_id 
            AND cases.assigned_agent_id = auth.uid()
        )
    );

-- Scheduled Callbacks: Agent can only see their own
ALTER TABLE scheduled_callbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own callbacks" ON scheduled_callbacks
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can create their own callbacks" ON scheduled_callbacks
    FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own callbacks" ON scheduled_callbacks
    FOR UPDATE USING (agent_id = auth.uid());

-- Payment Plans: Agents can view for their cases
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view payment plans for their cases" ON payment_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = payment_plans.case_id 
            AND cases.assigned_agent_id = auth.uid()
        )
    );

-- Agent Notifications: Agent can only see their own
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own notifications" ON agent_notifications
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can update their own notifications" ON agent_notifications
    FOR UPDATE USING (agent_id = auth.uid());

-- ============================================
-- SEED DATA: Global Message Templates
-- ============================================
INSERT INTO message_templates (template_type, name, subject, body, variables, is_compliance_approved)
VALUES 
(
    'EMAIL',
    'Initial Contact',
    'Important: Outstanding Balance - {{case_number}}',
    'Dear {{customer_name}},

This is to inform you that you have an outstanding balance of {{currency}}{{amount_due}} with FedEx.

Please contact us at your earliest convenience to discuss payment arrangements.

Case Reference: {{case_number}}

Best regards,
FedEx Collections Team',
    '["customer_name", "amount_due", "currency", "case_number"]',
    TRUE
),
(
    'SMS',
    'Payment Reminder',
    NULL,
    'FedEx: Payment of {{currency}}{{amount_due}} due on {{due_date}}. Ref: {{case_number}}. Contact us to avoid late fees.',
    '["amount_due", "currency", "due_date", "case_number"]',
    TRUE
),
(
    'EMAIL',
    'Payment Received',
    'Payment Confirmation - {{case_number}}',
    'Dear {{customer_name}},

Thank you for your payment of {{currency}}{{amount_paid}}.

Your remaining balance is: {{currency}}{{remaining_balance}}

Case Reference: {{case_number}}

Best regards,
FedEx Collections Team',
    '["customer_name", "amount_paid", "currency", "remaining_balance", "case_number"]',
    TRUE
);

-- Grant service role access for system operations
GRANT ALL ON case_activities TO service_role;
GRANT ALL ON case_documents TO service_role;
GRANT ALL ON scheduled_callbacks TO service_role;
GRANT ALL ON payment_plans TO service_role;
GRANT ALL ON message_templates TO service_role;
GRANT ALL ON agent_notifications TO service_role;
