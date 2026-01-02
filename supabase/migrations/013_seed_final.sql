-- ===========================================
-- FedEx DCA Control Tower - Final Seed Data
-- ===========================================
-- Escalations, Notifications, SLA Logs
-- ===========================================

-- ===========================================
-- ESCALATIONS
-- ===========================================
INSERT INTO escalations (case_id, escalation_type, priority, title, description, escalated_by, assigned_to, status)
SELECT c.id, 'SLA_BREACH', 'CRITICAL', 'SLA Breach - First Contact', 'Customer not contacted within SLA timeframe', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'OPEN'
FROM cases c WHERE c.case_number = 'CASE-IN-2026-0016' LIMIT 1;

INSERT INTO escalations (case_id, escalation_type, priority, title, description, escalated_by, assigned_to, status)
SELECT c.id, 'HIGH_VALUE', 'HIGH', 'High Value Case - No Progress', 'Critical high-value case with no recovery progress in 60 days', '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'IN_PROGRESS'
FROM cases c WHERE c.case_number = 'CASE-US-2026-0016' LIMIT 1;

INSERT INTO escalations (case_id, escalation_type, priority, title, description, escalated_by, assigned_to, status)
SELECT c.id, 'CUSTOMER_COMPLAINT', 'HIGH', 'Customer Dispute - Investigation Required', 'Customer disputing invoice validity', '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'OPEN'
FROM cases c WHERE c.case_number = 'CASE-IN-2026-0014' LIMIT 1;

INSERT INTO escalations (case_id, escalation_type, priority, title, description, escalated_by, assigned_to, status)
SELECT c.id, 'DCA_PERFORMANCE', 'MEDIUM', 'DCA Performance Issue', 'Bajaj Finance Collections SLA compliance below threshold', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'OPEN'
FROM cases c WHERE c.case_number = 'CASE-IN-2026-0017' LIMIT 1;

INSERT INTO escalations (case_id, escalation_type, priority, title, description, escalated_by, assigned_to, status)
SELECT c.id, 'FRAUD_SUSPECTED', 'CRITICAL', 'Suspected Fraudulent Invoice', 'Customer claims invoice was not authorized', '20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'OPEN'
FROM cases c WHERE c.case_number = 'CASE-US-2026-0015' LIMIT 1;

-- ===========================================
-- NOTIFICATIONS
-- ===========================================
INSERT INTO notifications (recipient_id, notification_type, title, message, channels, priority) VALUES
  ('20000000-0000-0000-0000-000000000002', 'CASE_ASSIGNED', 'New High-Value Cases - India Region', '5 new cases totaling ₹42,50,000 assigned in India region.', ARRAY['IN_APP', 'EMAIL']::notification_channel[], 'HIGH'),
  ('20000000-0000-0000-0000-000000000003', 'CASE_ASSIGNED', 'New High-Value Cases - America Region', '3 new cases totaling $285,000 assigned in America region.', ARRAY['IN_APP', 'EMAIL']::notification_channel[], 'HIGH'),
  ('20000000-0000-0000-0000-000000000010', 'SLA_WARNING', 'SLA Warning: First Contact Due', 'Case CASE-IN-2026-0004 first contact SLA due in 8 hours.', ARRAY['IN_APP']::notification_channel[], 'NORMAL'),
  ('20000000-0000-0000-0000-000000000020', 'SLA_WARNING', 'SLA Warning: First Contact Due', 'Case CASE-US-2026-0004 first contact SLA due in 6 hours.', ARRAY['IN_APP']::notification_channel[], 'NORMAL'),
  ('20000000-0000-0000-0000-000000000001', 'PERFORMANCE_ALERT', 'DCA Performance Below Threshold', 'Bajaj Finance Collections (India) performance score dropped below 50%.', ARRAY['IN_APP', 'EMAIL']::notification_channel[], 'URGENT'),
  ('20000000-0000-0000-0000-000000000001', 'PERFORMANCE_ALERT', 'DCA Performance Below Threshold', 'Summit Recovery Group (America) performance score dropped below 50%.', ARRAY['IN_APP', 'EMAIL']::notification_channel[], 'URGENT'),
  ('20000000-0000-0000-0000-000000000002', 'ESCALATION_CREATED', 'Critical Case Escalated - India', 'Case CASE-IN-2026-0016 (ONGC) escalated - no progress in 90 days.', ARRAY['IN_APP', 'EMAIL']::notification_channel[], 'HIGH'),
  ('20000000-0000-0000-0000-000000000003', 'ESCALATION_CREATED', 'Critical Case Escalated - America', 'Case CASE-US-2026-0016 (Berkshire Hathaway) escalated - high value.', ARRAY['IN_APP', 'EMAIL']::notification_channel[], 'HIGH'),
  ('20000000-0000-0000-0000-000000000004', 'PAYMENT_RECEIVED', 'Large Payment Received', 'Payment of ₹14,00,000 received for case CASE-IN-2026-0011 (Adani Enterprises).', ARRAY['IN_APP']::notification_channel[], 'NORMAL'),
  ('20000000-0000-0000-0000-000000000004', 'PAYMENT_RECEIVED', 'Large Payment Received', 'Payment of $140,000 received for case CASE-US-2026-0011 (ExxonMobil).', ARRAY['IN_APP']::notification_channel[], 'NORMAL');

-- ===========================================
-- SLA LOGS
-- ===========================================
INSERT INTO sla_logs (case_id, sla_template_id, sla_type, started_at, due_at, status)
SELECT c.id, '30000000-0000-0000-0000-000000000001', 'FIRST_CONTACT', c.assigned_at, c.assigned_at + INTERVAL '48 hours',
  CASE 
    WHEN c.first_contact_date IS NOT NULL THEN 'MET'::sla_status
    WHEN c.assigned_at + INTERVAL '48 hours' < NOW() THEN 'BREACHED'::sla_status
    ELSE 'PENDING'::sla_status
  END
FROM cases c WHERE c.assigned_dca_id IS NOT NULL LIMIT 20;

-- ===========================================
-- CASE ACTIONS (Sample)
-- ===========================================
INSERT INTO case_actions (case_id, action_type, action_description, contact_method, contact_outcome, performed_by, performed_by_role, performed_by_dca_id)
SELECT c.id, 'CONTACT_ATTEMPT', 'Initial contact attempt - phone call', 'PHONE', 'NO_ANSWER', '20000000-0000-0000-0000-000000000011', 'DCA_AGENT', '10000000-0000-0000-0000-000000000010'
FROM cases c WHERE c.region = 'INDIA' AND c.status NOT IN ('PENDING_ALLOCATION', 'WRITTEN_OFF') LIMIT 8;

INSERT INTO case_actions (case_id, action_type, action_description, contact_method, contact_outcome, performed_by, performed_by_role, performed_by_dca_id)
SELECT c.id, 'CONTACT_ATTEMPT', 'Initial contact attempt - phone call', 'PHONE', 'SPOKE_WITH_CUSTOMER', '20000000-0000-0000-0000-000000000021', 'DCA_AGENT', '10000000-0000-0000-0000-000000000020'
FROM cases c WHERE c.region = 'AMERICA' AND c.status NOT IN ('PENDING_ALLOCATION', 'WRITTEN_OFF') LIMIT 8;

INSERT INTO case_actions (case_id, action_type, action_description, payment_amount, payment_method, payment_reference, performed_by, performed_by_role, performed_by_dca_id)
SELECT c.id, 'PAYMENT_RECEIVED', 'Partial payment received', c.recovered_amount, 'WIRE', 'WIRE-' || FLOOR(RANDOM() * 1000000)::TEXT, '20000000-0000-0000-0000-000000000010', 'DCA_ADMIN', '10000000-0000-0000-0000-000000000010'
FROM cases c WHERE c.recovered_amount > 0 AND c.region = 'INDIA' LIMIT 5;

INSERT INTO case_actions (case_id, action_type, action_description, payment_amount, payment_method, payment_reference, performed_by, performed_by_role, performed_by_dca_id)
SELECT c.id, 'PAYMENT_RECEIVED', 'Partial payment received', c.recovered_amount, 'ACH', 'ACH-' || FLOOR(RANDOM() * 1000000)::TEXT, '20000000-0000-0000-0000-000000000020', 'DCA_ADMIN', '10000000-0000-0000-0000-000000000020'
FROM cases c WHERE c.recovered_amount > 0 AND c.region = 'AMERICA' LIMIT 5;

-- ===========================================
-- REFRESH MATERIALIZED VIEWS
-- ===========================================
REFRESH MATERIALIZED VIEW IF EXISTS dashboard_metrics;
REFRESH MATERIALIZED VIEW IF EXISTS dca_performance_metrics;

SELECT 'All seed data created successfully!' AS result;
SELECT 'Summary: 10 DCAs (5 India, 5 America), 40 Cases (20 each), 5 Escalations, 10 Notifications' AS summary;
