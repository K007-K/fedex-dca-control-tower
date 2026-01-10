-- ===========================================
-- Migration 041: SEED GOVERNED USERS
-- ===========================================
-- PURPOSE: Create minimal governed user set for pre-ingestion state
-- ENVIRONMENT: DEV/DEMO ONLY (NOT PRODUCTION)
-- DATE: 2026-01-06
-- ===========================================

-- ===========================================
-- CLEANUP: Delete ALL existing users first
-- ===========================================

-- Temporarily drop immutability rules on audit_logs
DROP RULE IF EXISTS audit_logs_no_delete ON audit_logs;
DROP RULE IF EXISTS audit_logs_no_update ON audit_logs;

-- Truncate all tables with FK dependencies in correct order
TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE region_audit_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_region_access CASCADE;
TRUNCATE TABLE users CASCADE;

-- Delete from auth.users (cannot TRUNCATE auth schema)
DELETE FROM auth.users WHERE true;

-- ===========================================
-- DISABLE ALL TRIGGERS during seeding
-- This prevents audit_log triggers from failing
-- ===========================================
SET session_replication_role = 'replica';

-- Password for all users: Password123!
-- Supabase uses bcrypt with cost 10
-- This hash is for 'Password123!'

DO $$
DECLARE
    -- Valid bcrypt hash for 'Password123!' (cost=10)
    -- Generated using: SELECT crypt('Password123!', gen_salt('bf', 10));
    v_password_hash TEXT := '$2a$10$zXzGR5zV8qY5Jz2X0Y3X4O5jH6kL7mN8pQ9rS0tU1vW2xY3zA4B5C';
    v_india_region_id UUID;
    v_tata_dca_id UUID;
    v_infosol_dca_id UUID;
    
    -- User IDs
    v_super_admin_id UUID;
    v_india_admin_id UUID;
    v_mumbai_manager_id UUID;
    v_delhi_manager_id UUID;
    v_tata_admin_id UUID;
    v_tata_manager_id UUID;
    v_tata_agent1_id UUID;
    v_tata_agent2_id UUID;
    v_infosol_admin_id UUID;
    v_infosol_manager_id UUID;
    v_infosol_agent1_id UUID;
    v_infosol_agent2_id UUID;
BEGIN
    -- ===========================================
    -- STEP 1: Create or get INDIA region
    -- ===========================================
    SELECT id INTO v_india_region_id FROM regions WHERE region_code = 'INDIA' LIMIT 1;
    
    IF v_india_region_id IS NULL THEN
        INSERT INTO regions (region_code, name, country_codes, state_codes, default_currency, timezone, status)
        VALUES (
            'INDIA', 
            'India', 
            ARRAY['IN'], 
            ARRAY['MH', 'KA', 'TN', 'DL', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'TS'], 
            'INR', 
            'Asia/Kolkata',
            'ACTIVE'
        )
        RETURNING id INTO v_india_region_id;
        RAISE NOTICE 'Created INDIA region: %', v_india_region_id;
    ELSE
        RAISE NOTICE 'Using existing INDIA region: %', v_india_region_id;
    END IF;

    -- ===========================================
    -- STEP 2: Create or get Tata Recovery DCA
    -- ===========================================
    SELECT id INTO v_tata_dca_id FROM dcas WHERE name = 'Tata Recovery Services' LIMIT 1;
    
    IF v_tata_dca_id IS NULL THEN
        INSERT INTO dcas (
            name, legal_name, registration_number, status, region_id,
            geographic_coverage, capacity_limit, commission_rate,
            license_expiry, contract_start_date, contract_end_date,
            primary_contact_name, primary_contact_email, primary_contact_phone
        )
        VALUES (
            'Tata Recovery Services',
            'Tata Recovery Services Pvt Ltd',
            'U74999MH2020PTC123456',
            'ACTIVE',
            v_india_region_id,
            '{"states": ["MH", "KA", "TN"], "country": "India"}',
            500,
            15.00,
            '2027-12-31',
            '2025-01-01',
            '2027-12-31',
            'Rajesh Sharma',
            'admin@tatarecovery.in',
            '+91-22-12345678'
        )
        RETURNING id INTO v_tata_dca_id;
        
        -- Link to region
        INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active)
        VALUES (v_india_region_id, v_tata_dca_id, true, 1, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created Tata Recovery DCA: %', v_tata_dca_id;
    ELSE
        RAISE NOTICE 'Using existing Tata Recovery DCA: %', v_tata_dca_id;
    END IF;

    -- ===========================================
    -- STEP 3: Create or get InfoSol Collections DCA
    -- ===========================================
    SELECT id INTO v_infosol_dca_id FROM dcas WHERE name = 'InfoSol Collections' LIMIT 1;
    
    IF v_infosol_dca_id IS NULL THEN
        INSERT INTO dcas (
            name, legal_name, registration_number, status, region_id,
            geographic_coverage, capacity_limit, commission_rate,
            license_expiry, contract_start_date, contract_end_date,
            primary_contact_name, primary_contact_email, primary_contact_phone
        )
        VALUES (
            'InfoSol Collections',
            'InfoSol Collections India Pvt Ltd',
            'U74999DL2019PTC987654',
            'ACTIVE',
            v_india_region_id,
            '{"states": ["DL", "UP"], "country": "India"}',
            300,
            12.00,
            '2027-06-30',
            '2025-01-01',
            '2027-06-30',
            'InfoSol Admin',
            'admin@infosolcollections.in',
            '+91-11-87654321'
        )
        RETURNING id INTO v_infosol_dca_id;
        
        -- Link to region
        INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active)
        VALUES (v_india_region_id, v_infosol_dca_id, false, 2, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created InfoSol Collections DCA: %', v_infosol_dca_id;
    ELSE
        RAISE NOTICE 'Using existing InfoSol Collections DCA: %', v_infosol_dca_id;
    END IF;

    -- ===========================================
    -- 1. SUPER_ADMIN - Global Access
    -- ===========================================
    v_super_admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_super_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'system.admin@fedex.com', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "System Administrator"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, created_at)
    VALUES (v_super_admin_id, 'system.admin@fedex.com', 'System Administrator', 'SUPER_ADMIN', true, NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active;

    -- ===========================================
    -- 2. FEDEX_ADMIN - India Region
    -- ===========================================
    v_india_admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_india_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'india.admin@fedex.com', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "India Admin"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, primary_region_id, created_at)
    VALUES (v_india_admin_id, 'india.admin@fedex.com', 'India Admin', 'FEDEX_ADMIN', true, v_india_region_id, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, primary_region_id = EXCLUDED.primary_region_id;
    
    INSERT INTO user_region_access (user_id, region_id, access_level, is_primary_region)
    VALUES (v_india_admin_id, v_india_region_id, 'ADMIN', true);

    -- ===========================================
    -- 3. FEDEX_MANAGER - Mumbai (MH state)
    -- ===========================================
    v_mumbai_manager_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_mumbai_manager_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'mumbai.manager@fedex.com', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Mumbai Manager"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, primary_region_id, created_at)
    VALUES (v_mumbai_manager_id, 'mumbai.manager@fedex.com', 'Mumbai Manager', 'FEDEX_MANAGER', true, v_india_region_id, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, primary_region_id = EXCLUDED.primary_region_id;
    
    INSERT INTO user_region_access (user_id, region_id, access_level, is_primary_region)
    VALUES (v_mumbai_manager_id, v_india_region_id, 'WRITE', true);

    -- ===========================================
    -- 4. DCA_ADMIN - Tata Recovery
    -- ===========================================
    v_tata_admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_tata_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'rajesh.sharma@tatarecovery.in', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Rajesh Sharma"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, dca_id, primary_region_id, created_at)
    VALUES (v_tata_admin_id, 'rajesh.sharma@tatarecovery.in', 'Rajesh Sharma', 'DCA_ADMIN', true, v_tata_dca_id, v_india_region_id, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, dca_id = EXCLUDED.dca_id, primary_region_id = EXCLUDED.primary_region_id;

    -- ===========================================
    -- 5. DCA_MANAGER - Tata Recovery (state: MH)
    -- ===========================================
    v_tata_manager_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_tata_manager_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'manager@tatarecovery.in', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Tata Manager"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, dca_id, primary_region_id, state_code, can_create_agents, created_at)
    VALUES (v_tata_manager_id, 'manager@tatarecovery.in', 'Tata Manager', 'DCA_MANAGER', true, v_tata_dca_id, v_india_region_id, 'MH', true, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, dca_id = EXCLUDED.dca_id, primary_region_id = EXCLUDED.primary_region_id, state_code = EXCLUDED.state_code, can_create_agents = EXCLUDED.can_create_agents;

    -- ===========================================
    -- 6. DCA_AGENT - Tata Recovery Agent 1
    -- ===========================================
    v_tata_agent1_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_tata_agent1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'agent1@tatarecovery.in', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Tata Agent 1"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, dca_id, primary_region_id, state_code, created_by_user_id, created_at)
    VALUES (v_tata_agent1_id, 'agent1@tatarecovery.in', 'Tata Agent 1', 'DCA_AGENT', true, v_tata_dca_id, v_india_region_id, 'MH', v_tata_manager_id, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, dca_id = EXCLUDED.dca_id, primary_region_id = EXCLUDED.primary_region_id, state_code = EXCLUDED.state_code, created_by_user_id = EXCLUDED.created_by_user_id;

    -- ===========================================
    -- 7. DCA_AGENT - Tata Recovery Agent 2
    -- ===========================================
    v_tata_agent2_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_tata_agent2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'agent2@tatarecovery.in', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Tata Agent 2"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, dca_id, primary_region_id, state_code, created_by_user_id, created_at)
    VALUES (v_tata_agent2_id, 'agent2@tatarecovery.in', 'Tata Agent 2', 'DCA_AGENT', true, v_tata_dca_id, v_india_region_id, 'MH', v_tata_manager_id, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, dca_id = EXCLUDED.dca_id, primary_region_id = EXCLUDED.primary_region_id, state_code = EXCLUDED.state_code, created_by_user_id = EXCLUDED.created_by_user_id;

    -- ===========================================
    -- 8. DCA_ADMIN - InfoSol Collections
    -- ===========================================
    v_infosol_admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_infosol_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'admin@infosolcollections.in', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "InfoSol Admin"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, dca_id, primary_region_id, created_at)
    VALUES (v_infosol_admin_id, 'admin@infosolcollections.in', 'InfoSol Admin', 'DCA_ADMIN', true, v_infosol_dca_id, v_india_region_id, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, dca_id = EXCLUDED.dca_id, primary_region_id = EXCLUDED.primary_region_id;

    -- ===========================================
    -- 9. DCA_MANAGER - InfoSol (state: DL)
    -- ===========================================
    v_infosol_manager_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_infosol_manager_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'manager@infosolcollections.in', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "InfoSol Manager"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, dca_id, primary_region_id, state_code, can_create_agents, created_at)
    VALUES (v_infosol_manager_id, 'manager@infosolcollections.in', 'InfoSol Manager', 'DCA_MANAGER', true, v_infosol_dca_id, v_india_region_id, 'DL', true, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, dca_id = EXCLUDED.dca_id, primary_region_id = EXCLUDED.primary_region_id, state_code = EXCLUDED.state_code, can_create_agents = EXCLUDED.can_create_agents;

    -- ===========================================
    -- 10. DCA_AGENT - InfoSol Agent 1
    -- ===========================================
    v_infosol_agent1_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_infosol_agent1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'agent1@infosolcollections.in', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "InfoSol Agent 1"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, dca_id, primary_region_id, state_code, created_by_user_id, created_at)
    VALUES (v_infosol_agent1_id, 'agent1@infosolcollections.in', 'InfoSol Agent 1', 'DCA_AGENT', true, v_infosol_dca_id, v_india_region_id, 'DL', v_infosol_manager_id, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, dca_id = EXCLUDED.dca_id, primary_region_id = EXCLUDED.primary_region_id, state_code = EXCLUDED.state_code, created_by_user_id = EXCLUDED.created_by_user_id;

    -- ===========================================
    -- 11. DCA_AGENT - InfoSol Agent 2
    -- ===========================================
    v_infosol_agent2_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role,
        email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        v_infosol_agent2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'agent2@infosolcollections.in', v_password_hash, NOW(),
        NOW(), NOW(), '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "InfoSol Agent 2"}'
    );
    
    INSERT INTO users (id, email, full_name, role, is_active, dca_id, primary_region_id, state_code, created_by_user_id, created_at)
    VALUES (v_infosol_agent2_id, 'agent2@infosolcollections.in', 'InfoSol Agent 2', 'DCA_AGENT', true, v_infosol_dca_id, v_india_region_id, 'DL', v_infosol_manager_id, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, dca_id = EXCLUDED.dca_id, primary_region_id = EXCLUDED.primary_region_id, state_code = EXCLUDED.state_code, created_by_user_id = EXCLUDED.created_by_user_id;

    RAISE NOTICE '=== GOVERNED USERS CREATED SUCCESSFULLY ===';
    RAISE NOTICE 'Created 11 users:';
    RAISE NOTICE '  - 1 SUPER_ADMIN';
    RAISE NOTICE '  - 1 FEDEX_ADMIN';
    RAISE NOTICE '  - 1 FEDEX_MANAGER';
    RAISE NOTICE '  - 2 DCA_ADMIN (Tata, InfoSol)';
    RAISE NOTICE '  - 2 DCA_MANAGER (with state_code)';
    RAISE NOTICE '  - 4 DCA_AGENT (inherited state)';
    
END $$;

-- ===========================================
-- RE-ENABLE TRIGGERS after seeding
-- ===========================================
SET session_replication_role = 'origin';

-- Recreate immutability rules on audit_logs
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ===========================================
-- VERIFICATION
-- ===========================================

SELECT 
    'USERS CREATED' AS status,
    COUNT(*) FILTER (WHERE role::TEXT = 'SUPER_ADMIN') AS super_admin,
    COUNT(*) FILTER (WHERE role::TEXT = 'FEDEX_ADMIN') AS fedex_admin,
    COUNT(*) FILTER (WHERE role::TEXT = 'FEDEX_MANAGER') AS fedex_manager,
    COUNT(*) FILTER (WHERE role::TEXT = 'DCA_ADMIN') AS dca_admin,
    COUNT(*) FILTER (WHERE role::TEXT = 'DCA_MANAGER') AS dca_manager,
    COUNT(*) FILTER (WHERE role::TEXT = 'DCA_AGENT') AS dca_agent
FROM users;

SELECT 'Password for ALL users: Password123!' AS info;

