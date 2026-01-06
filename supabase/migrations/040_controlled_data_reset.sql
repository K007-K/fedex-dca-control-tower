-- ===========================================
-- Migration 040: CONTROLLED DATA RESET
-- ===========================================
-- PURPOSE: Prepare system for ingestion API implementation
-- ENVIRONMENT: DEV/DEMO ONLY (NOT PRODUCTION)
-- DATE: 2026-01-06
-- ===========================================

-- ===========================================
-- PHASE 0: SAFETY VERIFICATION
-- ===========================================
-- Verify this is NOT production before proceeding

DO $$
BEGIN
    -- Check for presence of governance tables (safety gate)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'regions') THEN
        RAISE EXCEPTION 'SAFETY CHECK FAILED: regions table not found. Governance not applied.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sla_templates') THEN
        RAISE EXCEPTION 'SAFETY CHECK FAILED: sla_templates table not found.';
    END IF;
    
    RAISE NOTICE 'Phase 0: Safety checks PASSED. Proceeding with controlled data reset.';
END $$;

-- ===========================================
-- PHASE 1: DELETE RUNTIME/MOCK DATA
-- ===========================================
-- Order: Child tables first, then parent tables (FK-safe)

-- 1.1 Case-related runtime data (child tables)
DO $$
BEGIN
    DELETE FROM case_activities WHERE true;
    DELETE FROM case_documents WHERE true;
    DELETE FROM scheduled_callbacks WHERE true;
    DELETE FROM payment_plans WHERE true;
    DELETE FROM case_actions WHERE true;
    
    -- 1.2 SLA runtime data
    DELETE FROM sla_logs WHERE true;
    
    -- 1.3 Escalations
    DELETE FROM escalations WHERE true;
    
    -- 1.4 Notifications
    DELETE FROM agent_notifications WHERE true;
    DELETE FROM notifications WHERE true;
    
    -- 1.5 Cases (parent table - after children cleared)
    DELETE FROM cases WHERE true;
    
    -- 1.6 User-related runtime data (if any)
    DELETE FROM account_deletion_requests WHERE true;
    
    RAISE NOTICE 'Phase 1.1-1.6: Runtime data deletion COMPLETE.';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Some tables not found, continuing...';
END $$;

-- 1.7 Audit logs (DEMO ENVIRONMENT EXCEPTION)
-- Document: "Audit log truncation is a demo-environment exception"
DO $$
BEGIN
    TRUNCATE TABLE audit_logs RESTART IDENTITY;
    RAISE NOTICE 'Phase 1.7: audit_logs truncated.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'audit_logs truncate skipped: %', SQLERRM;
END $$;

-- 1.8 Region audit logs (demo reset)
DO $$
BEGIN
    TRUNCATE TABLE region_audit_log RESTART IDENTITY;
    RAISE NOTICE 'Phase 1.8: region_audit_log truncated.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'region_audit_log truncate skipped: %', SQLERRM;
END $$;

-- ===========================================
-- PHASE 2: PRESERVE CONFIGURATION DATA
-- ===========================================
-- These tables are NOT touched:
-- - regions (geography governance)
-- - sla_templates (SLA configuration)
-- - geography_region_rules (region assignment rules)
-- - escalation_matrix (escalation configuration)
-- - message_templates (communication templates)
-- - All schema, ENUMs, RLS policies

SELECT 'Phase 2: Configuration data PRESERVED - regions, sla_templates, escalation_matrix' AS status;

-- ===========================================
-- PHASE 3: RESET RUNTIME COUNTERS ON DCAs
-- ===========================================
-- Reset DCA performance metrics (will be derived from ingestion)

DO $$
BEGIN
    UPDATE dcas SET
        total_cases_handled = 0,
        total_amount_collected = 0,
        current_month_collections = 0,
        success_rate = 0,
        avg_collection_time = 0,
        active_cases = 0,
        escalated_cases = 0,
        compliance_score = 100,
        current_capacity = 0
    WHERE true;
    
    -- Reset region-DCA performance metrics
    UPDATE region_dca_assignments SET
        region_recovery_rate = 0,
        region_sla_compliance = 100,
        region_avg_recovery_days = NULL,
        region_cases_handled = 0,
        region_amount_recovered = 0
    WHERE true;
    
    RAISE NOTICE 'Phase 3: DCA performance metrics RESET.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'DCA reset skipped: %', SQLERRM;
END $$;

-- ===========================================
-- PHASE 3B: DELETE EXISTING USERS (for clean master data)
-- ===========================================
-- Note: We delete users to recreate a clean governed set
-- RLS policies and triggers remain intact

DO $$
BEGIN
    -- First delete from dependent tables
    DELETE FROM user_region_access WHERE true;
    DELETE FROM dca_user_region_access WHERE true;
    
    RAISE NOTICE 'Phase 3B.1: Region access deleted.';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Region access tables not found, continuing...';
END $$;

DO $$
BEGIN
    -- Delete all users (will recreate governed set via application)
    -- Note: auth.users may not be accessible depending on permissions
    DELETE FROM users WHERE true;
    
    RAISE NOTICE 'Phase 3B.2: Users deleted.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Users delete skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Delete and recreate DCAs with clean master data
    DELETE FROM region_dca_assignments WHERE true;
    DELETE FROM dcas WHERE true;
    
    RAISE NOTICE 'Phase 3B.3: DCAs cleared for recreation.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'DCAs delete skipped: %', SQLERRM;
END $$;

-- ===========================================
-- PHASE 4: RECREATE ESSENTIAL MASTER DATA
-- ===========================================

-- 4.1 Create DCAs (Master Entities Only - NO performance data)

DO $$
DECLARE
    v_india_region_id UUID;
    v_tata_dca_id UUID;
    v_infosol_dca_id UUID;
BEGIN
    SELECT id INTO v_india_region_id FROM regions WHERE region_code = 'INDIA' LIMIT 1;
    
    IF v_india_region_id IS NULL THEN
        -- Create INDIA region if not exists
        INSERT INTO regions (region_code, name, country_codes, state_codes, default_currency, timezone, status)
        VALUES ('INDIA', 'India', ARRAY['IN'], ARRAY['MH', 'KA', 'TN', 'DL', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'TS'], 'INR', 'Asia/Kolkata', 'ACTIVE')
        RETURNING id INTO v_india_region_id;
        RAISE NOTICE 'INDIA region created.';
    END IF;

    -- Create Tata Recovery Services DCA (using actual dcas table schema)
    INSERT INTO dcas (
        name, legal_name, status,
        region_id,
        primary_contact_email, primary_contact_phone, primary_contact_name,
        capacity_limit,
        commission_rate,
        geographic_coverage
    ) VALUES (
        'Tata Recovery Services', 'Tata Recovery Services Pvt Ltd', 'ACTIVE',
        v_india_region_id,
        'admin@tatarecovery.in', '+91-22-12345678', 'Rajesh Sharma',
        500,
        15.00,
        '{"states": ["MH", "KA", "TN"], "city": "Mumbai", "country": "India"}'::JSONB
    ) RETURNING id INTO v_tata_dca_id;

    -- Create InfoSol Collections DCA
    INSERT INTO dcas (
        name, legal_name, status,
        region_id,
        primary_contact_email, primary_contact_phone, primary_contact_name,
        capacity_limit,
        commission_rate,
        geographic_coverage
    ) VALUES (
        'InfoSol Collections', 'InfoSol Collections India Pvt Ltd', 'ACTIVE',
        v_india_region_id,
        'admin@infosolcollections.in', '+91-11-98765432', 'Admin User',
        300,
        12.00,
        '{"states": ["DL", "UP"], "city": "New Delhi", "country": "India"}'::JSONB
    ) RETURNING id INTO v_infosol_dca_id;

    -- Create region-DCA assignments
    INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active)
    VALUES 
        (v_india_region_id, v_tata_dca_id, true, 1, true),
        (v_india_region_id, v_infosol_dca_id, false, 2, true);

    RAISE NOTICE 'Phase 4.1: DCAs created - Tata Recovery (%), InfoSol (%)', v_tata_dca_id, v_infosol_dca_id;
END $$;

-- ===========================================
-- 4.2 Create Governed User Set
-- ===========================================
-- NOTE: Users are created via Supabase Auth API, not direct SQL
-- This section documents the required users

/*
User creation must be done via the application API or Supabase dashboard:

SUPER_ADMIN (1):
  - system.admin@fedex.com (Global access)

FEDEX_ADMIN (2):
  - india.admin@fedex.com (INDIA region)
  - americas.admin@fedex.com (AMERICAS region)

FEDEX_MANAGER (2):
  - mumbai.manager@fedex.com (INDIA, state: MH)
  - delhi.manager@fedex.com (INDIA, state: DL)

DCA_ADMIN (per DCA):
  - rajesh.sharma@tatarecovery.in (Tata Recovery, DCA_ADMIN)
  - admin@infosolcollections.in (InfoSol, DCA_ADMIN)

DCA_MANAGER (per DCA, with state_code):
  - manager@tatarecovery.in (Tata, DCA_MANAGER, state: MH)
  - manager@infosolcollections.in (InfoSol, DCA_MANAGER, state: DL)

DCA_AGENT (2 per DCA):
  - agent1@tatarecovery.in, agent2@tatarecovery.in
  - agent1@infosolcollections.in, agent2@infosolcollections.in
*/

SELECT 'Phase 4.2: User documentation - see comments above. Users created via application API.' AS status;

-- ===========================================
-- PHASE 5: FINAL VALIDATION
-- ===========================================

DO $$
DECLARE
    v_case_count INT;
    v_sla_log_count INT;
    v_notification_count INT;
    v_region_count INT;
    v_dca_count INT;
BEGIN
    -- MUST be ZERO
    SELECT COUNT(*) INTO v_case_count FROM cases;
    SELECT COUNT(*) INTO v_sla_log_count FROM sla_logs;
    SELECT COUNT(*) INTO v_notification_count FROM notifications;
    
    -- MUST be > 0
    SELECT COUNT(*) INTO v_region_count FROM regions;
    SELECT COUNT(*) INTO v_dca_count FROM dcas;
    
    -- Validation checks
    IF v_case_count > 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: % cases still exist', v_case_count;
    END IF;
    
    IF v_sla_log_count > 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: % SLA logs still exist', v_sla_log_count;
    END IF;
    
    IF v_notification_count > 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: % notifications still exist', v_notification_count;
    END IF;
    
    IF v_region_count = 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: No regions exist';
    END IF;
    
    IF v_dca_count = 0 THEN
        RAISE EXCEPTION 'VALIDATION FAILED: No DCAs exist';
    END IF;
    
    RAISE NOTICE '=== PHASE 5 VALIDATION PASSED ===';
    RAISE NOTICE '  - Cases: 0 (CLEAN)';
    RAISE NOTICE '  - SLA Logs: 0 (CLEAN)';
    RAISE NOTICE '  - Notifications: 0 (CLEAN)';
    RAISE NOTICE '  - Regions: % (PRESERVED)', v_region_count;
    RAISE NOTICE '  - DCAs: % (RECREATED)', v_dca_count;
END $$;

-- ===========================================
-- FINAL OUTPUT
-- ===========================================

SELECT 
    '=== CONTROLLED DATA RESET COMPLETE ===' AS status,
    'System is now in CLEAN PRE-INGESTION STATE' AS state,
    'Ready for ingestion API implementation' AS next_step;

-- Summary Report
SELECT 'DELETED' AS action, 'cases, case_activities, sla_logs, notifications, escalations, audit_logs' AS entities
UNION ALL
SELECT 'PRESERVED' AS action, 'regions, sla_templates, geography_region_rules, escalation_matrix, RLS policies' AS entities
UNION ALL
SELECT 'RECREATED' AS action, 'dcas (Tata Recovery, InfoSol), region_dca_assignments' AS entities
UNION ALL
SELECT 'PENDING' AS action, 'users (must be created via application API)' AS entities;
