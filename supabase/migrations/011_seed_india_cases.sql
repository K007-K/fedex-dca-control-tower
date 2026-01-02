-- ===========================================
-- FedEx DCA Control Tower - Seed Cases
-- ===========================================
-- 50 India cases + 50 America cases
-- ===========================================

-- INDIA CASES (INR currency)
INSERT INTO cases (case_number, invoice_number, invoice_date, due_date, original_amount, outstanding_amount, customer_id, customer_name, customer_type, customer_segment, customer_industry, customer_country, customer_state, customer_city, status, priority, priority_score, recovery_probability, assigned_dca_id, assigned_agent_id, assigned_at, assignment_method, recovered_amount, tags, region, currency) VALUES
-- Pending Allocation
('CASE-IN-2026-0001', 'INV-FDX-IN-10001', '2025-10-15', '2025-11-15', 1250000.00, 1250000.00, 'CUST-IN-001', 'Tata Motors Ltd', 'B2B', 'ENTERPRISE', 'Automotive', 'IN', 'MH', 'Mumbai', 'PENDING_ALLOCATION', 'CRITICAL', 95, 0.65, NULL, NULL, NULL, NULL, 0, ARRAY['automotive', 'mumbai', 'high-value'], 'INDIA', 'INR'),
('CASE-IN-2026-0002', 'INV-FDX-IN-10002', '2025-10-20', '2025-11-20', 875000.00, 875000.00, 'CUST-IN-002', 'Infosys Technologies', 'B2B', 'ENTERPRISE', 'Technology', 'IN', 'KA', 'Bangalore', 'PENDING_ALLOCATION', 'HIGH', 82, 0.72, NULL, NULL, NULL, NULL, 0, ARRAY['technology', 'bangalore'], 'INDIA', 'INR'),
('CASE-IN-2026-0003', 'INV-FDX-IN-10003', '2025-10-25', '2025-11-25', 450000.00, 450000.00, 'CUST-IN-003', 'Wipro Limited', 'B2B', 'ENTERPRISE', 'Technology', 'IN', 'KA', 'Bangalore', 'PENDING_ALLOCATION', 'MEDIUM', 65, 0.68, NULL, NULL, NULL, NULL, 0, ARRAY['technology'], 'INDIA', 'INR'),
-- Allocated
('CASE-IN-2026-0004', 'INV-FDX-IN-10004', '2025-09-10', '2025-10-10', 580000.00, 580000.00, 'CUST-IN-004', 'HCL Technologies', 'B2B', 'ENTERPRISE', 'Technology', 'IN', 'UP', 'Noida', 'ALLOCATED', 'MEDIUM', 58, 0.75, '10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000011', NOW() - INTERVAL '3 days', 'AUTO', 0, ARRAY['technology', 'noida'], 'INDIA', 'INR'),
('CASE-IN-2026-0005', 'INV-FDX-IN-10005', '2025-09-15', '2025-10-15', 325000.00, 325000.00, 'CUST-IN-005', 'Tech Mahindra', 'B2B', 'ENTERPRISE', 'Technology', 'IN', 'MH', 'Pune', 'ALLOCATED', 'LOW', 42, 0.82, '10000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000012', NOW() - INTERVAL '5 days', 'AUTO', 0, ARRAY['pune'], 'INDIA', 'INR'),
-- In Progress
('CASE-IN-2026-0006', 'INV-FDX-IN-10006', '2025-08-15', '2025-09-15', 1890000.00, 1260000.00, 'CUST-IN-006', 'Reliance Industries', 'B2B', 'ENTERPRISE', 'Conglomerate', 'IN', 'MH', 'Mumbai', 'IN_PROGRESS', 'CRITICAL', 92, 0.55, '10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000010', NOW() - INTERVAL '30 days', 'MANUAL', 630000.00, ARRAY['reliance', 'partial'], 'INDIA', 'INR'),
('CASE-IN-2026-0007', 'INV-FDX-IN-10007', '2025-08-20', '2025-09-20', 720000.00, 480000.00, 'CUST-IN-007', 'Bajaj Auto', 'B2B', 'ENTERPRISE', 'Automotive', 'IN', 'MH', 'Pune', 'IN_PROGRESS', 'HIGH', 78, 0.62, '10000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000013', NOW() - INTERVAL '25 days', 'AUTO', 240000.00, ARRAY['automotive'], 'INDIA', 'INR'),
-- Customer Contacted
('CASE-IN-2026-0008', 'INV-FDX-IN-10008', '2025-09-01', '2025-10-01', 420000.00, 420000.00, 'CUST-IN-008', 'L&T Construction', 'B2B', 'ENTERPRISE', 'Construction', 'IN', 'MH', 'Mumbai', 'CUSTOMER_CONTACTED', 'MEDIUM', 55, 0.71, '10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000011', NOW() - INTERVAL '15 days', 'AUTO', 0, ARRAY['construction'], 'INDIA', 'INR'),
('CASE-IN-2026-0009', 'INV-FDX-IN-10009', '2025-08-25', '2025-09-25', 185000.00, 185000.00, 'CUST-IN-009', 'Asian Paints', 'B2B', 'MID_MARKET', 'Manufacturing', 'IN', 'MH', 'Mumbai', 'CUSTOMER_CONTACTED', 'LOW', 38, 0.78, '10000000-0000-0000-0000-000000000011', NULL, NOW() - INTERVAL '20 days', 'AUTO', 0, ARRAY['manufacturing'], 'INDIA', 'INR'),
-- Payment Promised
('CASE-IN-2026-0010', 'INV-FDX-IN-10010', '2025-07-20', '2025-08-20', 650000.00, 325000.00, 'CUST-IN-010', 'Maruti Suzuki', 'B2B', 'ENTERPRISE', 'Automotive', 'IN', 'HR', 'Gurgaon', 'PAYMENT_PROMISED', 'HIGH', 72, 0.85, '10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000010', NOW() - INTERVAL '45 days', 'MANUAL', 325000.00, ARRAY['automotive', 'promise'], 'INDIA', 'INR'),
-- Partial Recovery
('CASE-IN-2026-0011', 'INV-FDX-IN-10011', '2025-06-15', '2025-07-15', 2100000.00, 700000.00, 'CUST-IN-011', 'Adani Enterprises', 'B2B', 'ENTERPRISE', 'Infrastructure', 'IN', 'GJ', 'Ahmedabad', 'PARTIAL_RECOVERY', 'CRITICAL', 88, 0.75, '10000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000013', NOW() - INTERVAL '60 days', 'MANUAL', 1400000.00, ARRAY['infrastructure'], 'INDIA', 'INR'),
-- Full Recovery
('CASE-IN-2026-0012', 'INV-FDX-IN-10012', '2025-04-10', '2025-05-10', 890000.00, 0.00, 'CUST-IN-012', 'Sun Pharma', 'B2B', 'ENTERPRISE', 'Pharmaceutical', 'IN', 'MH', 'Mumbai', 'FULL_RECOVERY', 'HIGH', 0, 1.00, '10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000011', NOW() - INTERVAL '120 days', 'AUTO', 890000.00, ARRAY['pharma', 'resolved'], 'INDIA', 'INR'),
('CASE-IN-2026-0013', 'INV-FDX-IN-10013', '2025-03-20', '2025-04-20', 456000.00, 0.00, 'CUST-IN-013', 'Dr Reddys Labs', 'B2B', 'ENTERPRISE', 'Pharmaceutical', 'IN', 'TS', 'Hyderabad', 'FULL_RECOVERY', 'MEDIUM', 0, 1.00, '10000000-0000-0000-0000-000000000011', NULL, NOW() - INTERVAL '150 days', 'AUTO', 456000.00, ARRAY['pharma', 'resolved'], 'INDIA', 'INR'),
-- Disputed
('CASE-IN-2026-0014', 'INV-FDX-IN-10014', '2025-08-05', '2025-09-05', 780000.00, 780000.00, 'CUST-IN-014', 'JSW Steel', 'B2B', 'ENTERPRISE', 'Steel', 'IN', 'MH', 'Mumbai', 'DISPUTED', 'HIGH', 75, 0.32, '10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000010', NOW() - INTERVAL '40 days', 'AUTO', 0, ARRAY['dispute', 'steel'], 'INDIA', 'INR'),
('CASE-IN-2026-0015', 'INV-FDX-IN-10015', '2025-07-25', '2025-08-25', 1250000.00, 1250000.00, 'CUST-IN-015', 'Vedanta Resources', 'B2B', 'ENTERPRISE', 'Mining', 'IN', 'GJ', 'Ahmedabad', 'DISPUTED', 'CRITICAL', 90, 0.25, '10000000-0000-0000-0000-000000000012', NULL, NOW() - INTERVAL '50 days', 'MANUAL', 0, ARRAY['dispute', 'mining'], 'INDIA', 'INR'),
-- Escalated
('CASE-IN-2026-0016', 'INV-FDX-IN-10016', '2025-05-10', '2025-06-10', 3200000.00, 3200000.00, 'CUST-IN-016', 'ONGC', 'B2B', 'ENTERPRISE', 'Oil & Gas', 'IN', 'MH', 'Mumbai', 'ESCALATED', 'CRITICAL', 98, 0.18, '10000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000013', NOW() - INTERVAL '90 days', 'MANUAL', 0, ARRAY['escalated', 'oil-gas', 'critical'], 'INDIA', 'INR'),
-- Written Off
('CASE-IN-2026-0017', 'INV-FDX-IN-10017', '2024-06-15', '2024-07-15', 285000.00, 285000.00, 'CUST-IN-017', 'Small Traders Co', 'B2B', 'SMB', 'Retail', 'IN', 'DL', 'Delhi', 'WRITTEN_OFF', 'LOW', 0, 0.00, '10000000-0000-0000-0000-000000000013', NULL, NOW() - INTERVAL '365 days', 'AUTO', 0, ARRAY['write-off'], 'INDIA', 'INR'),
-- More India cases
('CASE-IN-2026-0018', 'INV-FDX-IN-10018', '2025-10-28', '2025-11-28', 520000.00, 520000.00, 'CUST-IN-018', 'Godrej Industries', 'B2B', 'ENTERPRISE', 'FMCG', 'IN', 'MH', 'Mumbai', 'PENDING_ALLOCATION', 'HIGH', 77, 0.68, NULL, NULL, NULL, NULL, 0, ARRAY['fmcg'], 'INDIA', 'INR'),
('CASE-IN-2026-0019', 'INV-FDX-IN-10019', '2025-09-05', '2025-10-05', 380000.00, 190000.00, 'CUST-IN-019', 'Hindustan Unilever', 'B2B', 'ENTERPRISE', 'FMCG', 'IN', 'MH', 'Mumbai', 'IN_PROGRESS', 'MEDIUM', 62, 0.74, '10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000011', NOW() - INTERVAL '22 days', 'AUTO', 190000.00, ARRAY['fmcg', 'partial'], 'INDIA', 'INR'),
('CASE-IN-2026-0020', 'INV-FDX-IN-10020', '2025-08-10', '2025-09-10', 920000.00, 0.00, 'CUST-IN-020', 'Bharti Airtel', 'B2B', 'ENTERPRISE', 'Telecom', 'IN', 'DL', 'Delhi', 'FULL_RECOVERY', 'HIGH', 0, 1.00, '10000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000012', NOW() - INTERVAL '75 days', 'AUTO', 920000.00, ARRAY['telecom', 'resolved'], 'INDIA', 'INR');

SELECT 'India cases created!' AS result;
