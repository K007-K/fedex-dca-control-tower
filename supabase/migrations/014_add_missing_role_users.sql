-- ===========================================
-- Add Missing Role Users
-- ===========================================
-- Run this to add users for ALL roles
-- ===========================================

INSERT INTO users (id, email, full_name, role, organization_id, dca_id, is_active, is_verified, timezone) VALUES
  -- FEDEX_ADMIN (Full FedEx admin access)
  ('20000000-0000-0000-0000-000000000006', 'fedex.admin@fedex.com', 'David Wilson', 'FEDEX_ADMIN', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/New_York'),
  
  -- DCA_MANAGER (India)
  ('20000000-0000-0000-0000-000000000014', 'manager@tatarecovery.in', 'Suresh Kumar', 'DCA_MANAGER', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', TRUE, TRUE, 'Asia/Kolkata'),
  
  -- DCA_MANAGER (America)
  ('20000000-0000-0000-0000-000000000024', 'manager@apexcollections.com', 'James Miller', 'DCA_MANAGER', '00000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000020', TRUE, TRUE, 'America/New_York'),
  
  -- READONLY (View-only access)
  ('20000000-0000-0000-0000-000000000007', 'viewer@fedex.com', 'Emily Clark', 'READONLY', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/Chicago')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  organization_id = EXCLUDED.organization_id,
  dca_id = EXCLUDED.dca_id;

SELECT 'Missing role users added!' AS result;
