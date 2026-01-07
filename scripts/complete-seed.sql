-- ===========================================
-- SEED: DCAs WITH FORM FIELDS ONLY
-- ===========================================
-- Run this in Supabase SQL Editor
-- Only populates fields from DCA creation form
-- ===========================================

-- Step 1: Create INDIA Region (if not exists)
INSERT INTO regions (region_code, name, country_codes, state_codes, default_currency, timezone, status)
VALUES ('INDIA', 'India', ARRAY['IN'], ARRAY['MH', 'KA', 'TN', 'DL', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'TS'], 'INR', 'Asia/Kolkata', 'ACTIVE')
ON CONFLICT (region_code) DO NOTHING;

-- Step 2: Create DCAs with FORM FIELDS ONLY
DO $$
DECLARE
    v_india_region_id UUID;
    v_tata_dca_id UUID;
    v_infosol_dca_id UUID;
BEGIN
    -- Get India region
    SELECT id INTO v_india_region_id FROM regions WHERE region_code = 'INDIA' LIMIT 1;
    
    IF v_india_region_id IS NULL THEN
        RAISE EXCEPTION 'INDIA region not found!';
    END IF;
    
    RAISE NOTICE '✅ Using INDIA region: %', v_india_region_id;

    -- ===========================================
    -- DCA 1: TATA RECOVERY SERVICES
    -- ===========================================
    
    INSERT INTO dcas (
        -- Basic Information
        name,
        legal_name,
        registration_number,
        status,
        region_id,
        
        -- Contract Terms
        commission_rate,
        min_case_value,
        max_case_value,
        
        -- License & Compliance
        license_expiry,
        contract_start_date,
        contract_end_date,
        
        -- Primary Contact
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone
    ) VALUES (
        'Tata Recovery Services',
        'Tata Recovery Services Private Limited',
        'U74999MH2015PTC123456',
        'ACTIVE',
        v_india_region_id,
        
        15.00,              -- commission_rate
        10000.00,           -- min_case_value (₹10K)
        5000000.00,         -- max_case_value (₹50 Lakh)
        
        '2027-12-31'::DATE, -- license_expiry
        '2025-01-01'::DATE, -- contract_start_date
        '2027-12-31'::DATE, -- contract_end_date
        
        'Rajesh Sharma',
        'rajesh.sharma@tatarecovery.in',
        '+91-22-12345678'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_tata_dca_id;
    
    IF v_tata_dca_id IS NULL THEN
        SELECT id INTO v_tata_dca_id FROM dcas WHERE name = 'Tata Recovery Services' LIMIT 1;
    END IF;
    
    RAISE NOTICE '✅ Tata DCA: %', v_tata_dca_id;

    -- ===========================================
    -- DCA 2: INFOSOL COLLECTIONS
    -- ===========================================
    
    INSERT INTO dcas (
        name,
        legal_name,
        registration_number,
        status,
        region_id,
        
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
        'InfoSol Collections',
        'InfoSol Collections India Private Limited',
        'U74999DL2018PTC987654',
        'ACTIVE',
        v_india_region_id,
        
        12.00,              -- commission_rate
        5000.00,            -- min_case_value (₹5K)
        2500000.00,         -- max_case_value (₹25 Lakh)
        
        '2027-06-30'::DATE, -- license_expiry
        '2025-01-01'::DATE, -- contract_start_date
        '2027-06-30'::DATE, -- contract_end_date
        
        'Priya Gupta',
        'admin@infosolcollections.in',
        '+91-11-98765432'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_infosol_dca_id;
    
    IF v_infosol_dca_id IS NULL THEN
        SELECT id INTO v_infosol_dca_id FROM dcas WHERE name = 'InfoSol Collections' LIMIT 1;
    END IF;
    
    RAISE NOTICE '✅ InfoSol DCA: %', v_infosol_dca_id;

    -- ===========================================
    -- REGION-DCA ASSIGNMENTS (Per-Region Capacity)
    -- ===========================================
    
    -- Tata: capacity=500, priority=1, is_active=true
    INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active, capacity_limit)
    VALUES (v_india_region_id, v_tata_dca_id, true, 1, true, 500)
    ON CONFLICT DO NOTHING;
    
    -- InfoSol: capacity=300, priority=2, is_active=true
    INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active, capacity_limit)
    VALUES (v_india_region_id, v_infosol_dca_id, false, 2, true, 300)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Region-DCA assignments created';

    -- ===========================================
    -- LINK EXISTING USERS TO DCAs
    -- ===========================================
    
    -- FedEx users (no DCA, just region)
    UPDATE users SET 
        primary_region_id = v_india_region_id,
        role = 'SUPER_ADMIN'::user_role,
        is_active = true
    WHERE email = 'system.admin@fedex.com';
    
    UPDATE users SET 
        primary_region_id = v_india_region_id,
        role = 'FEDEX_ADMIN'::user_role,
        is_active = true
    WHERE email = 'india.admin@fedex.com';
    
    UPDATE users SET 
        primary_region_id = v_india_region_id,
        role = 'FEDEX_MANAGER'::user_role,
        is_active = true
    WHERE email = 'mumbai.manager@fedex.com';
    
    -- Tata users
    UPDATE users SET 
        dca_id = v_tata_dca_id,
        primary_region_id = v_india_region_id,
        role = 'DCA_ADMIN'::user_role,
        is_active = true
    WHERE email = 'rajesh.sharma@tatarecovery.in';
    
    UPDATE users SET 
        dca_id = v_tata_dca_id,
        primary_region_id = v_india_region_id,
        role = 'DCA_MANAGER'::user_role,
        is_active = true
    WHERE email = 'manager@tatarecovery.in';
    
    UPDATE users SET 
        dca_id = v_tata_dca_id,
        primary_region_id = v_india_region_id,
        role = 'DCA_AGENT'::user_role,
        is_active = true
    WHERE email IN ('agent1@tatarecovery.in', 'agent2@tatarecovery.in');
    
    -- InfoSol users
    UPDATE users SET 
        dca_id = v_infosol_dca_id,
        primary_region_id = v_india_region_id,
        role = 'DCA_ADMIN'::user_role,
        is_active = true
    WHERE email = 'admin@infosolcollections.in';
    
    UPDATE users SET 
        dca_id = v_infosol_dca_id,
        primary_region_id = v_india_region_id,
        role = 'DCA_MANAGER'::user_role,
        is_active = true
    WHERE email = 'manager@infosolcollections.in';
    
    UPDATE users SET 
        dca_id = v_infosol_dca_id,
        primary_region_id = v_india_region_id,
        role = 'DCA_AGENT'::user_role,
        is_active = true
    WHERE email IN ('agent1@infosolcollections.in', 'agent2@infosolcollections.in');
    
    RAISE NOTICE '✅ All users linked';

END $$;

-- ===========================================
-- VERIFICATION
-- ===========================================

SELECT '=== SEED COMPLETE ===' AS status;

-- Show DCAs
SELECT 
    name,
    status::text,
    commission_rate,
    min_case_value,
    max_case_value,
    license_expiry,
    primary_contact_name,
    primary_contact_email
FROM dcas;

-- Show Users with roles
SELECT 
    email,
    role::text,
    dca_id IS NOT NULL AS has_dca
FROM users
ORDER BY role, email;

-- Counts
SELECT 'Regions' AS entity, COUNT(*) AS count FROM regions
UNION ALL
SELECT 'DCAs', COUNT(*) FROM dcas
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Region-DCA Links', COUNT(*) FROM region_dca_assignments;
