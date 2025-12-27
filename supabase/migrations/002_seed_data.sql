-- ===========================================
-- FedEx DCA Control Tower - Seed Data
-- ===========================================
-- Run this AFTER the schema migration is complete
-- ===========================================

-- ===========================================
-- ORGANIZATIONS
-- ===========================================

INSERT INTO organizations (id, name, type, email, phone) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'FedEx Corporation', 'FEDEX', 'admin@fedex.com', '+1-800-463-3339'),
  ('00000000-0000-0000-0000-000000000002', 'Apex Collections Inc', 'DCA', 'contact@apexcollections.com', '+1-555-0101'),
  ('00000000-0000-0000-0000-000000000003', 'Global Recovery Partners', 'DCA', 'info@globalrecovery.com', '+1-555-0102'),
  ('00000000-0000-0000-0000-000000000004', 'Premier Debt Solutions', 'DCA', 'support@premierdebt.com', '+1-555-0103'),
  ('00000000-0000-0000-0000-000000000005', 'Swift Collections Agency', 'DCA', 'hello@swiftcollections.com', '+1-555-0104'),
  ('00000000-0000-0000-0000-000000000006', 'Pacific Recovery Services', 'DCA', 'info@pacificrecovery.com', '+1-555-0105');

-- ===========================================
-- DCAs
-- ===========================================

INSERT INTO dcas (id, organization_id, name, legal_name, status, performance_score, recovery_rate, sla_compliance_rate, capacity_limit, capacity_used, specializations, geographic_coverage, primary_contact_name, primary_contact_email, primary_contact_phone, commission_rate) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Apex Collections Inc', 'Apex Collections Incorporated', 'ACTIVE', 85.5, 72.3, 94.2, 500, 245, '["B2B", "HIGH_VALUE", "COMMERCIAL"]', '["US", "CA", "MX"]', 'John Smith', 'john.smith@apexcollections.com', '+1-555-0101', 12.5),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Global Recovery Partners', 'Global Recovery Partners LLC', 'ACTIVE', 78.2, 68.5, 89.7, 750, 423, '["B2B", "B2C", "INTERNATIONAL"]', '["US", "UK", "DE", "FR"]', 'Sarah Johnson', 'sarah.j@globalrecovery.com', '+1-555-0102', 11.0),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Premier Debt Solutions', 'Premier Debt Solutions Corp', 'ACTIVE', 92.1, 81.4, 97.8, 300, 156, '["HIGH_VALUE", "LEGAL", "DISPUTED"]', '["US", "CA"]', 'Michael Brown', 'm.brown@premierdebt.com', '+1-555-0103', 15.0),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Swift Collections Agency', 'Swift Collections Agency Inc', 'ACTIVE', 71.8, 59.2, 82.4, 1000, 612, '["B2C", "SMALL_VALUE", "VOLUME"]', '["US"]', 'Emily Davis', 'emily@swiftcollections.com', '+1-555-0104', 8.5),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Pacific Recovery Services', 'Pacific Recovery Services Ltd', 'SUSPENDED', 45.3, 32.1, 56.8, 400, 89, '["B2B", "RETAIL"]', '["US", "AU", "NZ"]', 'David Wilson', 'd.wilson@pacificrecovery.com', '+1-555-0105', 10.0);

-- ===========================================
-- USERS
-- ===========================================

INSERT INTO users (id, email, full_name, role, organization_id, dca_id, is_active, is_verified, timezone) VALUES
  -- FedEx Users
  ('20000000-0000-0000-0000-000000000001', 'admin@fedex.com', 'System Administrator', 'SUPER_ADMIN', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/New_York'),
  ('20000000-0000-0000-0000-000000000002', 'collections.manager@fedex.com', 'Jennifer Martinez', 'FEDEX_MANAGER', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/New_York'),
  ('20000000-0000-0000-0000-000000000003', 'analyst@fedex.com', 'Robert Chen', 'FEDEX_ANALYST', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/Chicago'),
  ('20000000-0000-0000-0000-000000000004', 'auditor@fedex.com', 'Lisa Thompson', 'AUDITOR', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/Los_Angeles'),
  
  -- DCA Users - Apex Collections
  ('20000000-0000-0000-0000-000000000011', 'john.smith@apexcollections.com', 'John Smith', 'DCA_ADMIN', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', TRUE, TRUE, 'America/Denver'),
  ('20000000-0000-0000-0000-000000000012', 'agent1@apexcollections.com', 'Mike Johnson', 'DCA_AGENT', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', TRUE, TRUE, 'America/Denver'),
  
  -- DCA Users - Global Recovery
  ('20000000-0000-0000-0000-000000000021', 'sarah.j@globalrecovery.com', 'Sarah Johnson', 'DCA_ADMIN', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', TRUE, TRUE, 'Europe/London'),
  ('20000000-0000-0000-0000-000000000022', 'agent1@globalrecovery.com', 'Emma Williams', 'DCA_AGENT', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', TRUE, TRUE, 'Europe/London'),
  
  -- DCA Users - Premier Debt
  ('20000000-0000-0000-0000-000000000031', 'm.brown@premierdebt.com', 'Michael Brown', 'DCA_ADMIN', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', TRUE, TRUE, 'America/New_York');

-- ===========================================
-- SLA TEMPLATES
-- ===========================================

INSERT INTO sla_templates (id, name, sla_type, description, duration_hours, business_hours_only, is_active, auto_escalate_on_breach) VALUES
  ('30000000-0000-0000-0000-000000000001', 'First Contact - Standard', 'FIRST_CONTACT', 'Contact customer within 48 business hours of case assignment', 48, TRUE, TRUE, TRUE),
  ('30000000-0000-0000-0000-000000000002', 'First Contact - High Priority', 'FIRST_CONTACT', 'Contact customer within 24 business hours for high priority cases', 24, TRUE, TRUE, TRUE),
  ('30000000-0000-0000-0000-000000000003', 'First Contact - Critical', 'FIRST_CONTACT', 'Contact customer within 4 hours for critical cases', 4, FALSE, TRUE, TRUE),
  ('30000000-0000-0000-0000-000000000004', 'Weekly Update', 'WEEKLY_UPDATE', 'Provide weekly status update on active cases', 168, TRUE, TRUE, FALSE),
  ('30000000-0000-0000-0000-000000000005', 'Monthly Report', 'MONTHLY_REPORT', 'Submit monthly performance and portfolio report', 720, FALSE, TRUE, FALSE),
  ('30000000-0000-0000-0000-000000000006', 'Dispute Response', 'RESPONSE_TO_DISPUTE', 'Respond to customer disputes within 24 hours', 24, TRUE, TRUE, TRUE);

-- ===========================================
-- CASES (Sample - 50 cases)
-- ===========================================

-- Generate sample cases with various statuses
INSERT INTO cases (
  case_number, invoice_number, invoice_date, due_date, original_amount, outstanding_amount,
  customer_id, customer_name, customer_type, customer_segment, customer_industry, customer_country, customer_state, customer_city,
  status, priority, priority_score, recovery_probability,
  assigned_dca_id, assigned_agent_id, assigned_at, assignment_method,
  recovered_amount, tags
) VALUES
  -- Pending Allocation cases
  ('CASE-2025-000001', 'INV-FDX-2025-10001', '2024-10-15', '2024-11-15', 15250.00, 15250.00, 'CUST-001', 'Acme Corporation', 'B2B', 'ENTERPRISE', 'Manufacturing', 'US', 'CA', 'Los Angeles', 'PENDING_ALLOCATION', 'HIGH', 85, 0.72, NULL, NULL, NULL, NULL, 0, ARRAY['manufacturing', 'california']),
  ('CASE-2025-000002', 'INV-FDX-2025-10002', '2024-10-20', '2024-11-20', 8750.00, 8750.00, 'CUST-002', 'TechFlow Solutions', 'B2B', 'MID_MARKET', 'Technology', 'US', 'TX', 'Austin', 'PENDING_ALLOCATION', 'MEDIUM', 65, 0.58, NULL, NULL, NULL, NULL, 0, ARRAY['technology', 'texas']),
  ('CASE-2025-000003', 'INV-FDX-2025-10003', '2024-09-25', '2024-10-25', 42500.00, 42500.00, 'CUST-003', 'Global Logistics Inc', 'B2B', 'ENTERPRISE', 'Logistics', 'US', 'IL', 'Chicago', 'PENDING_ALLOCATION', 'CRITICAL', 95, 0.45, NULL, NULL, NULL, NULL, 0, ARRAY['logistics', 'critical']),
  
  -- Allocated and In Progress
  ('CASE-2025-000004', 'INV-FDX-2025-10004', '2024-09-10', '2024-10-10', 5200.00, 5200.00, 'CUST-004', 'Retail Express LLC', 'B2B', 'SMB', 'Retail', 'US', 'FL', 'Miami', 'ALLOCATED', 'LOW', 35, 0.82, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', NOW() - INTERVAL '5 days', 'AUTO', 0, ARRAY['retail', 'florida']),
  ('CASE-2025-000005', 'INV-FDX-2025-10005', '2024-08-15', '2024-09-15', 18900.00, 12600.00, 'CUST-005', 'Healthcare Partners', 'B2B', 'MID_MARKET', 'Healthcare', 'US', 'NY', 'New York', 'IN_PROGRESS', 'HIGH', 78, 0.65, '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000022', NOW() - INTERVAL '30 days', 'MANUAL', 6300.00, ARRAY['healthcare', 'partial']),
  ('CASE-2025-000006', 'INV-FDX-2025-10006', '2024-07-20', '2024-08-20', 31500.00, 21000.00, 'CUST-006', 'Automotive Dynamics', 'B2B', 'ENTERPRISE', 'Automotive', 'US', 'MI', 'Detroit', 'IN_PROGRESS', 'HIGH', 82, 0.55, '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000031', NOW() - INTERVAL '45 days', 'AUTO', 10500.00, ARRAY['automotive', 'enterprise']),
  
  -- Customer Contacted
  ('CASE-2025-000007', 'INV-FDX-2025-10007', '2024-08-01', '2024-09-01', 7800.00, 7800.00, 'CUST-007', 'Construction Plus', 'B2B', 'SMB', 'Construction', 'US', 'AZ', 'Phoenix', 'CUSTOMER_CONTACTED', 'MEDIUM', 52, 0.68, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', NOW() - INTERVAL '20 days', 'AUTO', 0, ARRAY['construction']),
  ('CASE-2025-000008', 'INV-FDX-2025-10008', '2024-07-15', '2024-08-15', 12300.00, 12300.00, 'CUST-008', 'Food Services Corp', 'B2B', 'MID_MARKET', 'Food & Beverage', 'US', 'WA', 'Seattle', 'CUSTOMER_CONTACTED', 'MEDIUM', 48, 0.71, '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000022', NOW() - INTERVAL '35 days', 'AUTO', 0, ARRAY['food', 'seattle']),
  
  -- Payment Promised
  ('CASE-2025-000009', 'INV-FDX-2025-10009', '2024-06-20', '2024-07-20', 9500.00, 9500.00, 'CUST-009', 'Energy Solutions Inc', 'B2B', 'MID_MARKET', 'Energy', 'US', 'CO', 'Denver', 'PAYMENT_PROMISED', 'LOW', 25, 0.88, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', NOW() - INTERVAL '60 days', 'AUTO', 0, ARRAY['energy', 'promise']),
  ('CASE-2025-000010', 'INV-FDX-2025-10010', '2024-06-01', '2024-07-01', 22000.00, 11000.00, 'CUST-010', 'Media Holdings LLC', 'B2B', 'ENTERPRISE', 'Media', 'US', 'CA', 'San Francisco', 'PAYMENT_PROMISED', 'MEDIUM', 55, 0.78, '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000031', NOW() - INTERVAL '75 days', 'MANUAL', 11000.00, ARRAY['media', 'partial']),
  
  -- Partial Recovery
  ('CASE-2025-000011', 'INV-FDX-2025-10011', '2024-05-15', '2024-06-15', 45000.00, 15000.00, 'CUST-011', 'Financial Services Group', 'B2B', 'ENTERPRISE', 'Finance', 'US', 'NY', 'New York', 'PARTIAL_RECOVERY', 'HIGH', 72, 0.92, '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000031', NOW() - INTERVAL '90 days', 'MANUAL', 30000.00, ARRAY['finance', 'progress']),
  ('CASE-2025-000012', 'INV-FDX-2025-10012', '2024-04-20', '2024-05-20', 8200.00, 3280.00, 'CUST-012', 'Consulting Partners', 'B2B', 'SMB', 'Consulting', 'US', 'MA', 'Boston', 'PARTIAL_RECOVERY', 'LOW', 32, 0.85, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', NOW() - INTERVAL '120 days', 'AUTO', 4920.00, ARRAY['consulting']),
  
  -- Full Recovery (Closed)
  ('CASE-2025-000013', 'INV-FDX-2025-10013', '2024-03-10', '2024-04-10', 16500.00, 0.00, 'CUST-013', 'Pharma Solutions', 'B2B', 'MID_MARKET', 'Pharmaceutical', 'US', 'NJ', 'Newark', 'FULL_RECOVERY', 'MEDIUM', 0, 1.00, '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000022', NOW() - INTERVAL '180 days', 'AUTO', 16500.00, ARRAY['pharma', 'resolved']),
  ('CASE-2025-000014', 'INV-FDX-2025-10014', '2024-02-15', '2024-03-15', 28700.00, 0.00, 'CUST-014', 'Tech Innovations Ltd', 'B2B', 'ENTERPRISE', 'Technology', 'US', 'CA', 'Palo Alto', 'FULL_RECOVERY', 'HIGH', 0, 1.00, '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000031', NOW() - INTERVAL '210 days', 'MANUAL', 28700.00, ARRAY['technology', 'resolved']),
  
  -- Disputed
  ('CASE-2025-000015', 'INV-FDX-2025-10015', '2024-08-05', '2024-09-05', 11200.00, 11200.00, 'CUST-015', 'Quality Manufacturing', 'B2B', 'SMB', 'Manufacturing', 'US', 'OH', 'Cleveland', 'DISPUTED', 'HIGH', 75, 0.35, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', NOW() - INTERVAL '40 days', 'AUTO', 0, ARRAY['dispute', 'manufacturing']),
  ('CASE-2025-000016', 'INV-FDX-2025-10016', '2024-07-25', '2024-08-25', 34500.00, 34500.00, 'CUST-016', 'Logistics United', 'B2B', 'ENTERPRISE', 'Logistics', 'US', 'GA', 'Atlanta', 'DISPUTED', 'CRITICAL', 88, 0.28, '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000031', NOW() - INTERVAL '50 days', 'MANUAL', 0, ARRAY['dispute', 'critical', 'logistics']),
  
  -- Escalated
  ('CASE-2025-000017', 'INV-FDX-2025-10017', '2024-05-10', '2024-06-10', 67000.00, 67000.00, 'CUST-017', 'Enterprise Holdings', 'B2B', 'ENTERPRISE', 'Holding Company', 'US', 'DE', 'Wilmington', 'ESCALATED', 'CRITICAL', 98, 0.22, '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000031', NOW() - INTERVAL '100 days', 'MANUAL', 0, ARRAY['escalated', 'critical', 'high-value']),
  
  -- Written Off
  ('CASE-2025-000018', 'INV-FDX-2025-10018', '2023-06-15', '2023-07-15', 4500.00, 4500.00, 'CUST-018', 'Small Retail Shop', 'B2B', 'SMB', 'Retail', 'US', 'AL', 'Birmingham', 'WRITTEN_OFF', 'LOW', 0, 0.00, '10000000-0000-0000-0000-000000000004', NULL, NOW() - INTERVAL '365 days', 'AUTO', 0, ARRAY['write-off', 'bankruptcy']),
  
  -- More sample cases for volume
  ('CASE-2025-000019', 'INV-FDX-2025-10019', '2024-10-25', '2024-11-25', 6800.00, 6800.00, 'CUST-019', 'Pacific Trading Co', 'B2B', 'SMB', 'Trading', 'US', 'OR', 'Portland', 'PENDING_ALLOCATION', 'MEDIUM', 58, 0.64, NULL, NULL, NULL, NULL, 0, ARRAY['trading']),
  ('CASE-2025-000020', 'INV-FDX-2025-10020', '2024-10-18', '2024-11-18', 23400.00, 23400.00, 'CUST-020', 'Industrial Supplies Inc', 'B2B', 'MID_MARKET', 'Industrial', 'US', 'PA', 'Pittsburgh', 'PENDING_ALLOCATION', 'HIGH', 79, 0.51, NULL, NULL, NULL, NULL, 0, ARRAY['industrial']),
  ('CASE-2025-000021', 'INV-FDX-2025-10021', '2024-09-05', '2024-10-05', 14700.00, 9800.00, 'CUST-021', 'Midwest Distributors', 'B2B', 'MID_MARKET', 'Distribution', 'US', 'MO', 'St. Louis', 'IN_PROGRESS', 'MEDIUM', 62, 0.67, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', NOW() - INTERVAL '25 days', 'AUTO', 4900.00, ARRAY['distribution']),
  ('CASE-2025-000022', 'INV-FDX-2025-10022', '2024-08-28', '2024-09-28', 8900.00, 8900.00, 'CUST-022', 'Software Systems LLC', 'B2B', 'SMB', 'Technology', 'US', 'NC', 'Raleigh', 'CUSTOMER_CONTACTED', 'LOW', 38, 0.75, '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000022', NOW() - INTERVAL '32 days', 'AUTO', 0, ARRAY['software']),
  ('CASE-2025-000023', 'INV-FDX-2025-10023', '2024-08-12', '2024-09-12', 52000.00, 39000.00, 'CUST-023', 'Aerospace Dynamics', 'B2B', 'ENTERPRISE', 'Aerospace', 'US', 'WA', 'Seattle', 'IN_PROGRESS', 'CRITICAL', 91, 0.48, '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000031', NOW() - INTERVAL '42 days', 'MANUAL', 13000.00, ARRAY['aerospace', 'critical']),
  ('CASE-2025-000024', 'INV-FDX-2025-10024', '2024-07-30', '2024-08-30', 7200.00, 0.00, 'CUST-024', 'Green Energy Corp', 'B2B', 'SMB', 'Energy', 'US', 'NV', 'Las Vegas', 'FULL_RECOVERY', 'LOW', 0, 1.00, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', NOW() - INTERVAL '55 days', 'AUTO', 7200.00, ARRAY['energy', 'resolved']),
  ('CASE-2025-000025', 'INV-FDX-2025-10025', '2024-09-15', '2024-10-15', 18500.00, 18500.00, 'CUST-025', 'Transportation Hub Inc', 'B2B', 'MID_MARKET', 'Transportation', 'US', 'TN', 'Nashville', 'ALLOCATED', 'MEDIUM', 55, 0.62, '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000022', NOW() - INTERVAL '8 days', 'AUTO', 0, ARRAY['transportation']);

-- ===========================================
-- CASE ACTIONS (Sample for cases)
-- ===========================================

INSERT INTO case_actions (case_id, action_type, action_description, contact_method, contact_outcome, contact_notes, performed_by, performed_by_role, performed_by_dca_id) 
SELECT 
  c.id,
  'CONTACT_ATTEMPT',
  'Initial contact attempt made',
  'PHONE',
  'NO_ANSWER',
  'Left voicemail requesting callback',
  '20000000-0000-0000-0000-000000000012',
  'DCA_AGENT',
  '10000000-0000-0000-0000-000000000001'
FROM cases c WHERE c.status NOT IN ('PENDING_ALLOCATION', 'WRITTEN_OFF', 'CLOSED') LIMIT 10;

INSERT INTO case_actions (case_id, action_type, action_description, contact_method, contact_outcome, contact_notes, performed_by, performed_by_role, performed_by_dca_id)
SELECT 
  c.id,
  'CONTACT_SUCCESS',
  'Successfully spoke with customer',
  'PHONE',
  'SPOKE_WITH_CUSTOMER',
  'Customer acknowledged debt, will review invoice',
  '20000000-0000-0000-0000-000000000022',
  'DCA_AGENT',
  '10000000-0000-0000-0000-000000000002'
FROM cases c WHERE c.status IN ('CUSTOMER_CONTACTED', 'PAYMENT_PROMISED', 'IN_PROGRESS') LIMIT 8;

INSERT INTO case_actions (case_id, action_type, action_description, payment_amount, payment_method, payment_reference, performed_by, performed_by_role, performed_by_dca_id)
SELECT 
  c.id,
  'PAYMENT_RECEIVED',
  'Partial payment received',
  c.recovered_amount,
  'WIRE',
  'WIRE-' || FLOOR(RANDOM() * 1000000)::TEXT,
  '20000000-0000-0000-0000-000000000031',
  'DCA_AGENT',
  '10000000-0000-0000-0000-000000000003'
FROM cases c WHERE c.recovered_amount > 0 LIMIT 10;

-- ===========================================
-- SLA LOGS (Sample)
-- ===========================================

INSERT INTO sla_logs (case_id, sla_template_id, sla_type, started_at, due_at, status)
SELECT 
  c.id,
  '30000000-0000-0000-0000-000000000001',
  'FIRST_CONTACT',
  c.assigned_at,
  c.assigned_at + INTERVAL '48 hours',
  CASE 
    WHEN c.first_contact_date IS NOT NULL THEN 'MET'::sla_status
    WHEN c.assigned_at + INTERVAL '48 hours' < NOW() THEN 'BREACHED'::sla_status
    ELSE 'PENDING'::sla_status
  END
FROM cases c 
WHERE c.assigned_dca_id IS NOT NULL 
LIMIT 15;

-- ===========================================
-- NOTIFICATIONS (Sample)
-- ===========================================

INSERT INTO notifications (recipient_id, notification_type, title, message, channels, priority)
VALUES
  ('20000000-0000-0000-0000-000000000002', 'CASE_ASSIGNED', 'New High-Value Case Assigned', '3 new cases totaling $76,150 have been assigned to Apex Collections.', ARRAY['IN_APP', 'EMAIL']::notification_channel[], 'HIGH'),
  ('20000000-0000-0000-0000-000000000011', 'SLA_WARNING', 'SLA Warning: First Contact Due', 'Case CASE-2025-000004 first contact SLA due in 8 hours.', ARRAY['IN_APP']::notification_channel[], 'NORMAL'),
  ('20000000-0000-0000-0000-000000000001', 'PERFORMANCE_ALERT', 'DCA Performance Below Threshold', 'Pacific Recovery Services performance score dropped below 50%.', ARRAY['IN_APP', 'EMAIL']::notification_channel[], 'URGENT'),
  ('20000000-0000-0000-0000-000000000003', 'ESCALATION_CREATED', 'Critical Case Escalated', 'Case CASE-2025-000017 has been escalated due to no progress in 90 days.', ARRAY['IN_APP', 'EMAIL']::notification_channel[], 'HIGH');

-- ===========================================
-- REFRESH MATERIALIZED VIEWS
-- ===========================================

REFRESH MATERIALIZED VIEW dashboard_metrics;
REFRESH MATERIALIZED VIEW dca_performance_metrics;

SELECT 'Seed data inserted successfully!' AS result;
