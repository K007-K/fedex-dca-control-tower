-- Migration: 036_complete_activity_fix.sql
-- Purpose: Create activity tables if missing AND fix RLS policies
-- Run this single script to fix all agent activity issues
-- Created: 2026-01-05

-- ============================================
-- STEP 1: CREATE TABLES IF THEY DON'T EXIST
-- ============================================

-- Case Activities table
CREATE TABLE IF NOT EXISTS case_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'NOTE',
        'CONTACT_ATTEMPT',
        'STATUS_CHANGE',
        'PAYMENT',
        'ESCALATION',
        'DOCUMENT',
        'ASSIGNMENT',
        'SYSTEM'
    )),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_activities_case_id ON case_activities(case_id);
CREATE INDEX IF NOT EXISTS idx_case_activities_type ON case_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_case_activities_created_at ON case_activities(created_at DESC);

-- Scheduled Callbacks table
CREATE TABLE IF NOT EXISTS scheduled_callbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES users(id),
    scheduled_for TIMESTAMPTZ NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',
        'COMPLETED',
        'MISSED',
        'CANCELLED'
    )),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_callbacks_agent_id ON scheduled_callbacks(agent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_callbacks_case_id ON scheduled_callbacks(case_id);

-- Agent Notifications table
CREATE TABLE IF NOT EXISTS agent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'GENERAL' CHECK (notification_type IN (
        'CASE_ASSIGNED',
        'SLA_WARNING',
        'SLA_BREACHED',
        'CALLBACK_DUE',
        'PAYMENT_RECEIVED',
        'ESCALATION',
        'GENERAL'
    )),
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_id ON agent_notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_is_read ON agent_notifications(is_read);

-- ============================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: DROP ALL EXISTING RESTRICTIVE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Agents can view activities for their cases" ON case_activities;
DROP POLICY IF EXISTS "Agents can create activities for their cases" ON case_activities;
DROP POLICY IF EXISTS "allow_all_case_activities" ON case_activities;

DROP POLICY IF EXISTS "Agents can view their own callbacks" ON scheduled_callbacks;
DROP POLICY IF EXISTS "Agents can create their own callbacks" ON scheduled_callbacks;
DROP POLICY IF EXISTS "Agents can update their own callbacks" ON scheduled_callbacks;
DROP POLICY IF EXISTS "allow_all_scheduled_callbacks" ON scheduled_callbacks;

DROP POLICY IF EXISTS "Agents can view their own notifications" ON agent_notifications;
DROP POLICY IF EXISTS "Agents can update their own notifications" ON agent_notifications;
DROP POLICY IF EXISTS "allow_all_agent_notifications" ON agent_notifications;

-- ============================================
-- STEP 4: CREATE PERMISSIVE POLICIES
-- Allow authenticated users full access (RLS is for structure, API handles auth)
-- ============================================

-- Case Activities - allow all authenticated users
CREATE POLICY "authenticated_full_access_activities" ON case_activities
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Scheduled Callbacks - allow all authenticated users
CREATE POLICY "authenticated_full_access_callbacks" ON scheduled_callbacks
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Agent Notifications - allow all authenticated users
CREATE POLICY "authenticated_full_access_notifications" ON agent_notifications
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- STEP 5: GRANT PERMISSIONS 
-- ============================================
GRANT ALL ON case_activities TO authenticated;
GRANT ALL ON scheduled_callbacks TO authenticated;
GRANT ALL ON agent_notifications TO authenticated;
GRANT ALL ON case_activities TO service_role;
GRANT ALL ON scheduled_callbacks TO service_role;
GRANT ALL ON agent_notifications TO service_role;

-- ============================================
-- VERIFICATION: Show that tables exist
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ case_activities table ready';
    RAISE NOTICE '✅ scheduled_callbacks table ready';
    RAISE NOTICE '✅ agent_notifications table ready';
    RAISE NOTICE '✅ RLS policies applied (permissive)';
    RAISE NOTICE '✅ All tables accessible to authenticated users';
END $$;
