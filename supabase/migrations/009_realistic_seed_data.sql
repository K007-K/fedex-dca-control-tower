-- ===========================================
-- FedEx DCA Control Tower - Clear & Reseed Data
-- ===========================================
-- Run AFTER 008_add_region.sql migration
-- ===========================================

-- Clear existing data (in correct order for foreign keys)
TRUNCATE notifications CASCADE;
TRUNCATE sla_logs CASCADE;
TRUNCATE case_actions CASCADE;
TRUNCATE escalations CASCADE;
TRUNCATE cases CASCADE;
TRUNCATE users CASCADE;
TRUNCATE dcas CASCADE;
TRUNCATE organizations CASCADE;
TRUNCATE sla_templates CASCADE;

-- ===========================================
-- ORGANIZATIONS
-- ===========================================
INSERT INTO organizations (id, name, type, email, phone, region) VALUES
  ('00000000-0000-0000-0000-000000000001', 'FedEx Corporation', 'FEDEX', 'admin@fedex.com', '+1-800-463-3339', 'AMERICA'),
  -- India DCAs
  ('00000000-0000-0000-0000-000000000010', 'Tata Recovery Services', 'DCA', 'contact@tatarecovery.in', '+91-22-6789-0001', 'INDIA'),
  ('00000000-0000-0000-0000-000000000011', 'Reliance Collections', 'DCA', 'collections@ril.in', '+91-22-6789-0002', 'INDIA'),
  ('00000000-0000-0000-0000-000000000012', 'Infosys Debt Solutions', 'DCA', 'debt@infosys.in', '+91-80-6789-0003', 'INDIA'),
  ('00000000-0000-0000-0000-000000000013', 'Mahindra Recovery', 'DCA', 'recovery@mahindra.in', '+91-22-6789-0004', 'INDIA'),
  ('00000000-0000-0000-0000-000000000014', 'Bajaj Finance Collections', 'DCA', 'collections@bajaj.in', '+91-20-6789-0005', 'INDIA'),
  -- America DCAs
  ('00000000-0000-0000-0000-000000000020', 'Apex Collections Inc', 'DCA', 'contact@apexcollections.com', '+1-212-555-0101', 'AMERICA'),
  ('00000000-0000-0000-0000-000000000021', 'Liberty Recovery Partners', 'DCA', 'info@libertyrecovery.com', '+1-415-555-0102', 'AMERICA'),
  ('00000000-0000-0000-0000-000000000022', 'Eagle Debt Solutions', 'DCA', 'support@eagledebt.com', '+1-312-555-0103', 'AMERICA'),
  ('00000000-0000-0000-0000-000000000023', 'Pioneer Collections', 'DCA', 'hello@pioneercollect.com', '+1-713-555-0104', 'AMERICA'),
  ('00000000-0000-0000-0000-000000000024', 'Summit Recovery Group', 'DCA', 'info@summitrecovery.com', '+1-305-555-0105', 'AMERICA');

-- ===========================================
-- DCAs
-- ===========================================
INSERT INTO dcas (id, organization_id, name, legal_name, status, performance_score, recovery_rate, sla_compliance_rate, capacity_limit, capacity_used, specializations, geographic_coverage, primary_contact_name, primary_contact_email, primary_contact_phone, commission_rate, region) VALUES
  -- India DCAs
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 'Tata Recovery Services', 'Tata Recovery Services Pvt Ltd', 'ACTIVE', 92.5, 78.3, 96.2, 600, 312, '["B2B", "ENTERPRISE", "MANUFACTURING"]', '["IN-MH", "IN-GJ", "IN-KA"]', 'Rajesh Sharma', 'rajesh.sharma@tatarecovery.in', '+91-22-6789-0001', 10.5, 'INDIA'),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'Reliance Collections', 'Reliance Collections Ltd', 'ACTIVE', 88.2, 72.5, 91.7, 800, 523, '["B2B", "B2C", "TELECOM"]', '["IN-MH", "IN-DL", "IN-TN"]', 'Priya Patel', 'priya.patel@ril.in', '+91-22-6789-0002', 9.0, 'INDIA'),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 'Infosys Debt Solutions', 'Infosys Debt Solutions Pvt Ltd', 'ACTIVE', 85.1, 68.4, 89.5, 500, 256, '["B2B", "IT", "SERVICES"]', '["IN-KA", "IN-TN", "IN-AP"]', 'Vikram Reddy', 'vikram.reddy@infosys.in', '+91-80-6789-0003', 11.0, 'INDIA'),
  ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013', 'Mahindra Recovery', 'Mahindra Recovery Services Ltd', 'ACTIVE', 79.8, 62.1, 84.3, 400, 287, '["B2B", "AUTOMOTIVE", "EQUIPMENT"]', '["IN-MH", "IN-UP", "IN-RJ"]', 'Amit Kumar', 'amit.kumar@mahindra.in', '+91-22-6789-0004', 12.0, 'INDIA'),
  ('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014', 'Bajaj Finance Collections', 'Bajaj Finance Collections Pvt Ltd', 'SUSPENDED', 48.5, 35.2, 58.1, 300, 45, '["B2C", "RETAIL", "CONSUMER"]', '["IN-MH", "IN-MP"]', 'Sneha Joshi', 'sneha.joshi@bajaj.in', '+91-20-6789-0005', 8.5, 'INDIA'),
  -- America DCAs
  ('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000020', 'Apex Collections Inc', 'Apex Collections Incorporated', 'ACTIVE', 89.5, 75.3, 94.2, 700, 385, '["B2B", "HIGH_VALUE", "COMMERCIAL"]', '["US-NY", "US-NJ", "US-PA"]', 'John Smith', 'john.smith@apexcollections.com', '+1-212-555-0101', 12.5, 'AMERICA'),
  ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000021', 'Liberty Recovery Partners', 'Liberty Recovery Partners LLC', 'ACTIVE', 82.2, 69.5, 88.7, 850, 523, '["B2B", "TECH", "STARTUP"]', '["US-CA", "US-WA", "US-OR"]', 'Sarah Johnson', 'sarah.j@libertyrecovery.com', '+1-415-555-0102', 11.0, 'AMERICA'),
  ('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000022', 'Eagle Debt Solutions', 'Eagle Debt Solutions Corp', 'ACTIVE', 94.1, 82.4, 97.8, 400, 198, '["HIGH_VALUE", "LEGAL", "DISPUTED"]', '["US-IL", "US-OH", "US-MI"]', 'Michael Brown', 'm.brown@eagledebt.com', '+1-312-555-0103', 15.0, 'AMERICA'),
  ('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000023', 'Pioneer Collections', 'Pioneer Collections Agency Inc', 'ACTIVE', 73.8, 58.2, 81.4, 1000, 712, '["B2C", "VOLUME", "SMALL_VALUE"]', '["US-TX", "US-OK", "US-LA"]', 'Emily Davis', 'emily@pioneercollect.com', '+1-713-555-0104', 8.5, 'AMERICA'),
  ('10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000024', 'Summit Recovery Group', 'Summit Recovery Group Ltd', 'SUSPENDED', 42.3, 28.1, 52.8, 500, 89, '["B2B", "RETAIL"]', '["US-FL", "US-GA"]', 'David Wilson', 'd.wilson@summitrecovery.com', '+1-305-555-0105', 10.0, 'AMERICA');

SELECT 'Organizations and DCAs created!' AS result;
