-- ===========================================
-- FedEx DCA Control Tower - Seed Data Part 2
-- ===========================================
-- Users, SLA Templates, and Cases
-- ===========================================

-- ===========================================
-- USERS
-- ===========================================
INSERT INTO users (id, email, full_name, role, organization_id, dca_id, is_active, is_verified, timezone) VALUES
  -- FedEx Users
  ('20000000-0000-0000-0000-000000000001', 'admin@fedex.com', 'System Administrator', 'SUPER_ADMIN', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/New_York'),
  ('20000000-0000-0000-0000-000000000002', 'india.manager@fedex.com', 'Priya Sharma', 'FEDEX_MANAGER', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'Asia/Kolkata'),
  ('20000000-0000-0000-0000-000000000003', 'us.manager@fedex.com', 'Jennifer Martinez', 'FEDEX_MANAGER', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/New_York'),
  ('20000000-0000-0000-0000-000000000004', 'analyst@fedex.com', 'Robert Chen', 'FEDEX_ANALYST', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/Chicago'),
  ('20000000-0000-0000-0000-000000000005', 'auditor@fedex.com', 'Lisa Thompson', 'AUDITOR', '00000000-0000-0000-0000-000000000001', NULL, TRUE, TRUE, 'America/Los_Angeles'),
  -- India DCA Users
  ('20000000-0000-0000-0000-000000000010', 'rajesh.sharma@tatarecovery.in', 'Rajesh Sharma', 'DCA_ADMIN', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', TRUE, TRUE, 'Asia/Kolkata'),
  ('20000000-0000-0000-0000-000000000011', 'agent1@tatarecovery.in', 'Ankit Verma', 'DCA_AGENT', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', TRUE, TRUE, 'Asia/Kolkata'),
  ('20000000-0000-0000-0000-000000000012', 'priya.patel@ril.in', 'Priya Patel', 'DCA_ADMIN', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', TRUE, TRUE, 'Asia/Kolkata'),
  ('20000000-0000-0000-0000-000000000013', 'vikram.reddy@infosys.in', 'Vikram Reddy', 'DCA_ADMIN', '00000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000012', TRUE, TRUE, 'Asia/Kolkata'),
  -- America DCA Users
  ('20000000-0000-0000-0000-000000000020', 'john.smith@apexcollections.com', 'John Smith', 'DCA_ADMIN', '00000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000020', TRUE, TRUE, 'America/New_York'),
  ('20000000-0000-0000-0000-000000000021', 'agent1@apexcollections.com', 'Mike Johnson', 'DCA_AGENT', '00000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000020', TRUE, TRUE, 'America/New_York'),
  ('20000000-0000-0000-0000-000000000022', 'sarah.j@libertyrecovery.com', 'Sarah Johnson', 'DCA_ADMIN', '00000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000021', TRUE, TRUE, 'America/Los_Angeles'),
  ('20000000-0000-0000-0000-000000000023', 'm.brown@eagledebt.com', 'Michael Brown', 'DCA_ADMIN', '00000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000022', TRUE, TRUE, 'America/Chicago');

-- ===========================================
-- SLA TEMPLATES
-- ===========================================
INSERT INTO sla_templates (id, name, sla_type, description, duration_hours, business_hours_only, is_active, auto_escalate_on_breach) VALUES
  ('30000000-0000-0000-0000-000000000001', 'First Contact - Standard', 'FIRST_CONTACT', 'Contact customer within 48 business hours', 48, TRUE, TRUE, TRUE),
  ('30000000-0000-0000-0000-000000000002', 'First Contact - High Priority', 'FIRST_CONTACT', 'Contact within 24 hours for high priority', 24, TRUE, TRUE, TRUE),
  ('30000000-0000-0000-0000-000000000003', 'First Contact - Critical', 'FIRST_CONTACT', 'Contact within 4 hours for critical', 4, FALSE, TRUE, TRUE),
  ('30000000-0000-0000-0000-000000000004', 'Weekly Update', 'WEEKLY_UPDATE', 'Weekly status update on active cases', 168, TRUE, TRUE, FALSE),
  ('30000000-0000-0000-0000-000000000005', 'Dispute Response', 'RESPONSE_TO_DISPUTE', 'Respond to disputes within 24 hours', 24, TRUE, TRUE, TRUE);

SELECT 'Users and SLA Templates created!' AS result;
