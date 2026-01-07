-- ===========================================
-- COMPLETE SEED DATA FOR FEDEX DCA CONTROL TOWER
-- ===========================================
-- Run this ENTIRE script in Supabase SQL Editor
-- ===========================================

-- Step 1: Create INDIA Region (if not exists)
INSERT INTO regions (region_code, name, country_codes, state_codes, default_currency, timezone, status)
VALUES ('INDIA', 'India', ARRAY['IN'], ARRAY['MH', 'KA', 'TN', 'DL', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'TS'], 'INR', 'Asia/Kolkata', 'ACTIVE')
ON CONFLICT (region_code) DO NOTHING;

-- Step 2: Get the India region ID
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
        RAISE EXCEPTION 'INDIA region not found!';
    END IF;
    
    RAISE NOTICE 'Using INDIA region: %', v_india_region_id;

    -- Step 3: Create Organizations (if needed)
    INSERT INTO organizations (name, type, status, primary_region_id)
    VALUES ('Tata Recovery Services', 'DCA', 'ACTIVE', v_india_region_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_tata_org_id;
    
    IF v_tata_org_id IS NULL THEN
        SELECT id INTO v_tata_org_id FROM organizations WHERE name = 'Tata Recovery Services' LIMIT 1;
    END IF;
    
    INSERT INTO organizations (name, type, status, primary_region_id)
    VALUES ('InfoSol Collections', 'DCA', 'ACTIVE', v_india_region_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_infosol_org_id;
    
    IF v_infosol_org_id IS NULL THEN
        SELECT id INTO v_infosol_org_id FROM organizations WHERE name = 'InfoSol Collections' LIMIT 1;
    END IF;
    
    RAISE NOTICE 'Organizations: Tata=%, InfoSol=%', v_tata_org_id, v_infosol_org_id;

    -- Step 4: Create DCAs
    INSERT INTO dcas (
        name, legal_name, status,
        region_id,
        organization_id,
        primary_contact_email, primary_contact_phone, primary_contact_name,
        capacity_limit,
        commission_rate,
        geographic_coverage
    ) VALUES (
        'Tata Recovery Services', 'Tata Recovery Services Pvt Ltd', 'ACTIVE',
        v_india_region_id,
        v_tata_org_id,
        'admin@tatarecovery.in', '+91-22-12345678', 'Rajesh Sharma',
        500,
        15.00,
        '{"states": ["MH", "KA", "TN"], "city": "Mumbai", "country": "India"}'::JSONB
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_tata_dca_id;
    
    IF v_tata_dca_id IS NULL THEN
        SELECT id INTO v_tata_dca_id FROM dcas WHERE name = 'Tata Recovery Services' LIMIT 1;
    END IF;
    
    INSERT INTO dcas (
        name, legal_name, status,
        region_id,
        organization_id,
        primary_contact_email, primary_contact_phone, primary_contact_name,
        capacity_limit,
        commission_rate,
        geographic_coverage
    ) VALUES (
        'InfoSol Collections', 'InfoSol Collections India Pvt Ltd', 'ACTIVE',
        v_india_region_id,
        v_infosol_org_id,
        'admin@infosolcollections.in', '+91-11-98765432', 'Admin User',
        300,
        12.00,
        '{"states": ["DL", "UP"], "city": "New Delhi", "country": "India"}'::JSONB
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_infosol_dca_id;
    
    IF v_infosol_dca_id IS NULL THEN
        SELECT id INTO v_infosol_dca_id FROM dcas WHERE name = 'InfoSol Collections' LIMIT 1;
    END IF;
    
    RAISE NOTICE 'DCAs created: Tata=%, InfoSol=%', v_tata_dca_id, v_infosol_dca_id;

    -- Step 5: Create region-DCA assignments
    INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active)
    VALUES 
        (v_india_region_id, v_tata_dca_id, true, 1, true),
        (v_india_region_id, v_infosol_dca_id, false, 2, true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Region-DCA assignments created';
    
    -- Step 6: Link users to DCAs
    -- Update agent1@tatarecovery.in to link to Tata DCA
    UPDATE users SET 
        dca_id = v_tata_dca_id,
        organization_id = v_tata_org_id,
        primary_region_id = v_india_region_id,
        role = 'DCA_AGENT'
    WHERE email = 'agent1@tatarecovery.in';
    
    RAISE NOTICE '✅ User agent1@tatarecovery.in linked to Tata DCA';
    
END $$;

-- Final verification
SELECT '=== SEED DATA VERIFICATION ===' AS status;

SELECT 'Regions' AS entity, COUNT(*) AS count FROM regions
UNION ALL
SELECT 'DCAs' AS entity, COUNT(*) AS count FROM dcas
UNION ALL
SELECT 'Organizations' AS entity, COUNT(*) AS count FROM organizations
UNION ALL
SELECT 'Users' AS entity, COUNT(*) AS count FROM users
UNION ALL
SELECT 'Region-DCA Assignments' AS entity, COUNT(*) AS count FROM region_dca_assignments;

-- Show DCAs
SELECT id, name, status, region_id FROM dcas;

-- Show users with roles
SELECT id, email, role, dca_id, organization_id FROM users;
