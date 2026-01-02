-- ===========================================
-- FedEx DCA Control Tower - Region Seed Data
-- Migration: 022_seed_regions.sql
-- ===========================================
-- Seeds initial regions with geography rules, DCA assignments
-- ===========================================

-- ===========================================
-- 1. SEED REGIONS
-- ===========================================

-- INDIA Region
INSERT INTO regions (
    id,
    region_code,
    name,
    description,
    country_codes,
    state_codes,
    default_currency,
    timezone,
    business_hours,
    status,
    created_at
) VALUES (
    'a1b2c3d4-1111-4000-8000-000000000001',
    'IN-ALL',
    'India',
    'FedEx India Operations - All states',
    ARRAY['IN'],
    NULL,
    'INR',
    'Asia/Kolkata',
    '{"start": "09:00", "end": "18:00", "days": [1,2,3,4,5,6]}',
    'ACTIVE',
    NOW()
) ON CONFLICT (region_code) DO UPDATE SET
    name = EXCLUDED.name,
    default_currency = EXCLUDED.default_currency,
    timezone = EXCLUDED.timezone;

-- AMERICA Region
INSERT INTO regions (
    id,
    region_code,
    name,
    description,
    country_codes,
    state_codes,
    default_currency,
    timezone,
    business_hours,
    status,
    created_at
) VALUES (
    'a1b2c3d4-2222-4000-8000-000000000002',
    'US-ALL',
    'America',
    'FedEx America Operations - USA & Canada',
    ARRAY['US', 'CA'],
    NULL,
    'USD',
    'America/New_York',
    '{"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}',
    'ACTIVE',
    NOW()
) ON CONFLICT (region_code) DO UPDATE SET
    name = EXCLUDED.name,
    default_currency = EXCLUDED.default_currency,
    timezone = EXCLUDED.timezone;

-- EUROPE Region
INSERT INTO regions (
    id,
    region_code,
    name,
    description,
    country_codes,
    state_codes,
    default_currency,
    timezone,
    business_hours,
    status,
    created_at
) VALUES (
    'a1b2c3d4-3333-4000-8000-000000000003',
    'EU-ALL',
    'Europe',
    'FedEx Europe Operations',
    ARRAY['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE'],
    NULL,
    'EUR',
    'Europe/London',
    '{"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}',
    'ACTIVE',
    NOW()
) ON CONFLICT (region_code) DO UPDATE SET
    name = EXCLUDED.name,
    default_currency = EXCLUDED.default_currency;

-- APAC Region
INSERT INTO regions (
    id,
    region_code,
    name,
    description,
    country_codes,
    state_codes,
    default_currency,
    timezone,
    business_hours,
    status,
    created_at
) VALUES (
    'a1b2c3d4-4444-4000-8000-000000000004',
    'APAC-ALL',
    'Asia Pacific',
    'FedEx APAC Operations',
    ARRAY['AU', 'SG', 'JP', 'KR', 'TW', 'HK'],
    NULL,
    'USD',
    'Asia/Singapore',
    '{"start": "09:00", "end": "18:00", "days": [1,2,3,4,5]}',
    'ACTIVE',
    NOW()
) ON CONFLICT (region_code) DO UPDATE SET
    name = EXCLUDED.name;

-- ===========================================
-- 2. SEED GEOGRAPHY RULES
-- ===========================================

-- India Rules
INSERT INTO geography_region_rules (region_id, rule_name, country_code, priority, is_active)
VALUES 
    ('a1b2c3d4-1111-4000-8000-000000000001', 'India - Country Match', 'IN', 100, TRUE)
ON CONFLICT DO NOTHING;

-- America Rules
INSERT INTO geography_region_rules (region_id, rule_name, country_code, priority, is_active)
VALUES 
    ('a1b2c3d4-2222-4000-8000-000000000002', 'USA - Country Match', 'US', 100, TRUE),
    ('a1b2c3d4-2222-4000-8000-000000000002', 'Canada - Country Match', 'CA', 100, TRUE)
ON CONFLICT DO NOTHING;

-- Europe Rules
INSERT INTO geography_region_rules (region_id, rule_name, country_code, priority, is_active)
VALUES 
    ('a1b2c3d4-3333-4000-8000-000000000003', 'UK - Country Match', 'GB', 100, TRUE),
    ('a1b2c3d4-3333-4000-8000-000000000003', 'Germany - Country Match', 'DE', 100, TRUE),
    ('a1b2c3d4-3333-4000-8000-000000000003', 'France - Country Match', 'FR', 100, TRUE)
ON CONFLICT DO NOTHING;

-- APAC Rules
INSERT INTO geography_region_rules (region_id, rule_name, country_code, priority, is_active)
VALUES 
    ('a1b2c3d4-4444-4000-8000-000000000004', 'Australia - Country Match', 'AU', 100, TRUE),
    ('a1b2c3d4-4444-4000-8000-000000000004', 'Singapore - Country Match', 'SG', 100, TRUE),
    ('a1b2c3d4-4444-4000-8000-000000000004', 'Japan - Country Match', 'JP', 100, TRUE)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 3. ASSIGN EXISTING DCAs TO REGIONS
-- ===========================================

-- Get existing India DCAs and assign to India region
INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active)
SELECT 
    'a1b2c3d4-1111-4000-8000-000000000001',
    d.id,
    ROW_NUMBER() OVER () = 1,  -- First one is primary
    ROW_NUMBER() OVER (),
    TRUE
FROM dcas d
WHERE d.region = 'INDIA'
ON CONFLICT (region_id, dca_id) DO NOTHING;

-- Get existing America DCAs and assign to America region
INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active)
SELECT 
    'a1b2c3d4-2222-4000-8000-000000000002',
    d.id,
    ROW_NUMBER() OVER () = 1,
    ROW_NUMBER() OVER (),
    TRUE
FROM dcas d
WHERE d.region = 'AMERICA'
ON CONFLICT (region_id, dca_id) DO NOTHING;

-- ===========================================
-- 4. UPDATE EXISTING CASES WITH REGION_ID
-- ===========================================

-- Update India cases
UPDATE cases SET region_id = 'a1b2c3d4-1111-4000-8000-000000000001'
WHERE region = 'INDIA' AND region_id IS NULL;

-- Update America cases
UPDATE cases SET region_id = 'a1b2c3d4-2222-4000-8000-000000000002'
WHERE region = 'AMERICA' AND region_id IS NULL;

-- ===========================================
-- 5. CREATE ESCALATION MATRICES FOR EACH REGION
-- ===========================================

-- India Escalation Matrix
INSERT INTO escalation_matrices (id, region_id, name, description, is_active)
VALUES (
    'e1e2e3e4-1111-4000-8000-000000000001',
    'a1b2c3d4-1111-4000-8000-000000000001',
    'India Standard Escalation',
    'Standard escalation matrix for India region',
    TRUE
) ON CONFLICT DO NOTHING;

-- America Escalation Matrix
INSERT INTO escalation_matrices (id, region_id, name, description, is_active)
VALUES (
    'e1e2e3e4-2222-4000-8000-000000000002',
    'a1b2c3d4-2222-4000-8000-000000000002',
    'America Standard Escalation',
    'Standard escalation matrix for America region',
    TRUE
) ON CONFLICT DO NOTHING;

-- ===========================================
-- 6. CREATE ESCALATION LEVELS
-- ===========================================

-- India L1 Escalation
INSERT INTO escalation_matrix_levels (
    matrix_id, level, level_name, escalation_type, 
    trigger_after_hours, assigned_role, notification_channels
) VALUES 
    ('e1e2e3e4-1111-4000-8000-000000000001', 1, 'L1 - Team Lead', 'SLA_BREACH', 24, 'DCA_MANAGER', '{IN_APP, EMAIL}'),
    ('e1e2e3e4-1111-4000-8000-000000000001', 2, 'L2 - Manager', 'SLA_BREACH', 48, 'FEDEX_MANAGER', '{IN_APP, EMAIL}'),
    ('e1e2e3e4-1111-4000-8000-000000000001', 3, 'L3 - Director', 'SLA_BREACH', 72, 'FEDEX_ADMIN', '{IN_APP, EMAIL}')
ON CONFLICT (matrix_id, level, escalation_type) DO NOTHING;

-- America L1-L3 Escalation
INSERT INTO escalation_matrix_levels (
    matrix_id, level, level_name, escalation_type, 
    trigger_after_hours, assigned_role, notification_channels
) VALUES 
    ('e1e2e3e4-2222-4000-8000-000000000002', 1, 'L1 - Team Lead', 'SLA_BREACH', 24, 'DCA_MANAGER', '{IN_APP, EMAIL}'),
    ('e1e2e3e4-2222-4000-8000-000000000002', 2, 'L2 - Manager', 'SLA_BREACH', 48, 'FEDEX_MANAGER', '{IN_APP, EMAIL}'),
    ('e1e2e3e4-2222-4000-8000-000000000002', 3, 'L3 - Director', 'SLA_BREACH', 72, 'FEDEX_ADMIN', '{IN_APP, EMAIL}')
ON CONFLICT (matrix_id, level, escalation_type) DO NOTHING;

-- Link regions to their escalation matrices
UPDATE regions SET escalation_matrix_id = 'e1e2e3e4-1111-4000-8000-000000000001' 
WHERE region_code = 'IN-ALL';

UPDATE regions SET escalation_matrix_id = 'e1e2e3e4-2222-4000-8000-000000000002' 
WHERE region_code = 'US-ALL';

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

SELECT 'Region seed data migration completed successfully!' AS result;
