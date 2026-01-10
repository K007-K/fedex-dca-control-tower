-- ===========================================
-- FRESH SEED: DELETE + CREATE + LINK
-- ===========================================
-- This script:
-- 1. DELETES all existing DCAs and DCA-type Organizations
-- 2. CREATES fresh Organizations and DCAs with proper links
-- 3. UPDATES existing users with correct DCA/Org/State links
-- ===========================================

-- Disable audit trigger to avoid region_id constraint during seed
ALTER TABLE users DISABLE TRIGGER trigger_log_creation_rights;

DO $$
DECLARE
    v_india_region_id UUID;
    v_tata_org_id UUID;
    v_infosol_org_id UUID;
    v_tata_dca_id UUID;
    v_infosol_dca_id UUID;
BEGIN
    -- Get India region
    SELECT id INTO v_india_region_id FROM regions WHERE region_code = 'INDIA' LIMIT 1;
    
    IF v_india_region_id IS NULL THEN
        -- Create INDIA region if not exists
        INSERT INTO regions (region_code, name, country_codes, state_codes, default_currency, timezone, status)
        VALUES ('INDIA', 'India', ARRAY['IN'], ARRAY['MH', 'KA', 'TN', 'DL', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'TS'], 'INR', 'Asia/Kolkata', 'ACTIVE')
        RETURNING id INTO v_india_region_id;
    END IF;
    
    RAISE NOTICE '✅ INDIA region: %', v_india_region_id;

    -- ===========================================
    -- DELETE EXISTING DATA (in correct order due to FK constraints)
    -- ===========================================
    
    -- First: Clear user links (don't delete users, just unlink)
    UPDATE users SET dca_id = NULL, organization_id = NULL, state_code = NULL WHERE dca_id IS NOT NULL;
    RAISE NOTICE '✅ Cleared user DCA/Org/State links';
    
    -- Second: Delete region-DCA assignments
    DELETE FROM region_dca_assignments;
    RAISE NOTICE '✅ Deleted region_dca_assignments';
    
    -- Third: Delete all DCAs
    DELETE FROM dcas;
    RAISE NOTICE '✅ Deleted all DCAs';
    
    -- Fourth: Delete all DCA-type organizations (keep FEDEX org)
    DELETE FROM organizations WHERE type = 'DCA';
    RAISE NOTICE '✅ Deleted all DCA organizations';

    -- ===========================================
    -- CREATE FRESH ORGANIZATIONS
    -- ===========================================
    
    -- Tata Recovery Services Organization
    INSERT INTO organizations (name, type, email, phone, address)
    VALUES (
        'Tata Recovery Services',
        'DCA',
        'contact@tatarecovery.in',
        '+91-22-12345678',
        '{"street": "123 Financial Centre", "city": "Mumbai", "state": "Maharashtra", "country": "India", "pincode": "400001"}'::JSONB
    )
    RETURNING id INTO v_tata_org_id;
    
    RAISE NOTICE '✅ Created Tata Organization: %', v_tata_org_id;
    
    -- InfoSol Collections Organization
    INSERT INTO organizations (name, type, email, phone, address)
    VALUES (
        'InfoSol Collections',
        'DCA',
        'contact@infosolcollections.in',
        '+91-11-98765432',
        '{"street": "456 Business Park", "city": "New Delhi", "state": "Delhi", "country": "India", "pincode": "110001"}'::JSONB
    )
    RETURNING id INTO v_infosol_org_id;
    
    RAISE NOTICE '✅ Created InfoSol Organization: %', v_infosol_org_id;

    -- ===========================================
    -- CREATE FRESH DCAs (linked to organizations)
    -- ===========================================
    
    -- Tata Recovery Services DCA
    INSERT INTO dcas (
        organization_id,
        name,
        legal_name,
        registration_number,
        status,
        region_id,
        capacity_limit,
        commission_rate,
        min_case_value,
        max_case_value,
        license_expiry,
        contract_start_date,
        contract_end_date,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone
    ) VALUES (
        v_tata_org_id,
        'Tata Recovery Services',
        'Tata Recovery Services Private Limited',
        'U74999MH2015PTC123456',
        'ACTIVE',
        v_india_region_id,
        500,
        15.00,
        10000.00,
        5000000.00,
        '2027-12-31'::DATE,
        '2025-01-01'::DATE,
        '2027-12-31'::DATE,
        'Rajesh Sharma',
        'rajesh.sharma@tatarecovery.in',
        '+91-22-12345678'
    )
    RETURNING id INTO v_tata_dca_id;
    
    RAISE NOTICE '✅ Created Tata DCA: %', v_tata_dca_id;

    -- InfoSol Collections DCA
    INSERT INTO dcas (
        organization_id,
        name,
        legal_name,
        registration_number,
        status,
        region_id,
        capacity_limit,
        commission_rate,
        min_case_value,
        max_case_value,
        license_expiry,
        contract_start_date,
        contract_end_date,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone
    ) VALUES (
        v_infosol_org_id,
        'InfoSol Collections',
        'InfoSol Collections India Private Limited',
        'U74999DL2018PTC987654',
        'ACTIVE',
        v_india_region_id,
        300,
        12.00,
        5000.00,
        2500000.00,
        '2027-06-30'::DATE,
        '2025-01-01'::DATE,
        '2027-06-30'::DATE,
        'Priya Gupta',
        'admin@infosolcollections.in',
        '+91-11-98765432'
    )
    RETURNING id INTO v_infosol_dca_id;
    
    RAISE NOTICE '✅ Created InfoSol DCA: %', v_infosol_dca_id;

    -- ===========================================
    -- CREATE REGION-DCA ASSIGNMENTS
    -- ===========================================
    
    INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active, capacity_allocation_pct)
    VALUES (v_india_region_id, v_tata_dca_id, true, 1, true, 100);
    
    INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active, capacity_allocation_pct)
    VALUES (v_india_region_id, v_infosol_dca_id, false, 2, true, 100);
    
    RAISE NOTICE '✅ Created region-DCA assignments';

    -- ===========================================
    -- LINK EXISTING USERS (only users that exist)
    -- ===========================================
    
    -- ===== FedEx Users (GLOBAL - no region/DCA/state) =====
    
    -- SUPER_ADMIN: Global access
    UPDATE users SET 
        primary_region_id = NULL,
        dca_id = NULL,
        organization_id = NULL,
        state_code = NULL,
        is_active = true
    WHERE email = 'system.admin@fedex.com';
    
    -- FEDEX_ADMIN: Regional admin for INDIA
    UPDATE users SET 
        primary_region_id = v_india_region_id,
        dca_id = NULL,
        organization_id = NULL,
        state_code = NULL,
        is_active = true
    WHERE email = 'india.admin@fedex.com';
    
    -- FEDEX_MANAGER: Regional operations
    UPDATE users SET 
        primary_region_id = v_india_region_id,
        dca_id = NULL,
        organization_id = NULL,
        state_code = NULL,
        is_active = true
    WHERE email = 'mumbai.manager@fedex.com';
    
    -- ===== Tata Recovery Services (INDIA - MH state) =====
    
    -- DCA_ADMIN: All states in DCA
    UPDATE users SET 
        dca_id = v_tata_dca_id,
        organization_id = v_tata_org_id,
        primary_region_id = v_india_region_id,
        state_code = NULL,
        is_active = true
    WHERE email = 'rajesh.sharma@tatarecovery.in';
    
    -- DCA_MANAGER: Maharashtra (MH)
    UPDATE users SET 
        dca_id = v_tata_dca_id,
        organization_id = v_tata_org_id,
        primary_region_id = v_india_region_id,
        state_code = 'MH',
        can_create_agents = true,
        is_active = true
    WHERE email = 'manager@tatarecovery.in';
    
    -- DCA_AGENT: Created by MH manager
    UPDATE users SET 
        dca_id = v_tata_dca_id,
        organization_id = v_tata_org_id,
        primary_region_id = v_india_region_id,
        state_code = 'MH',
        created_by_user_id = (SELECT id FROM users WHERE email = 'manager@tatarecovery.in'),
        is_active = true
    WHERE email = 'agent1@tatarecovery.in';
    
    RAISE NOTICE '✅ Linked all existing users';

END $$;

-- Re-enable audit trigger
ALTER TABLE users ENABLE TRIGGER trigger_log_creation_rights;

-- ===========================================
-- VERIFICATION
-- ===========================================

SELECT '=== SEED COMPLETE ===' AS status;

-- Organizations
SELECT 'ORGANIZATIONS' AS table_name;
SELECT id, name, type FROM organizations WHERE type = 'DCA';

-- DCAs with org links
SELECT 'DCAs' AS table_name;
SELECT 
    d.name AS dca_name,
    o.name AS org_name,
    d.organization_id IS NOT NULL AS has_org_link,
    d.status
FROM dcas d
LEFT JOIN organizations o ON d.organization_id = o.id;

-- Users with links
SELECT 'USERS WITH ASSIGNMENTS' AS table_name;
SELECT 
    u.email,
    u.role::text,
    d.name AS dca_name,
    u.state_code,
    u.primary_region_id IS NOT NULL AS has_region,
    u.organization_id IS NOT NULL AS has_org
FROM users u
LEFT JOIN dcas d ON u.dca_id = d.id
ORDER BY u.role, u.email;

-- Region-DCA Assignments
SELECT 'REGION_DCA_ASSIGNMENTS' AS table_name;
SELECT 
    r.region_code,
    d.name AS dca_name,
    rda.is_primary,
    rda.allocation_priority
FROM region_dca_assignments rda
JOIN regions r ON r.id = rda.region_id
JOIN dcas d ON d.id = rda.dca_id;
