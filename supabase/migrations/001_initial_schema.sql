-- ===========================================
-- FedEx DCA Control Tower - Database Schema
-- ===========================================
-- Run this migration in Supabase SQL Editor
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE case_status AS ENUM (
  'PENDING_ALLOCATION',
  'ALLOCATED',
  'IN_PROGRESS',
  'CUSTOMER_CONTACTED',
  'PAYMENT_PROMISED',
  'PARTIAL_RECOVERY',
  'FULL_RECOVERY',
  'DISPUTED',
  'ESCALATED',
  'LEGAL_ACTION',
  'WRITTEN_OFF',
  'CLOSED'
);

CREATE TYPE case_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE dca_status AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED', 'PENDING_APPROVAL');

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'FEDEX_ADMIN',
  'FEDEX_MANAGER',
  'FEDEX_ANALYST',
  'DCA_ADMIN',
  'DCA_MANAGER',
  'DCA_AGENT',
  'AUDITOR',
  'READONLY'
);

CREATE TYPE sla_type AS ENUM (
  'FIRST_CONTACT',
  'WEEKLY_UPDATE',
  'MONTHLY_REPORT',
  'RESPONSE_TO_DISPUTE',
  'RECOVERY_TARGET',
  'DOCUMENTATION_SUBMISSION'
);

CREATE TYPE sla_status AS ENUM ('PENDING', 'MET', 'BREACHED', 'EXEMPT');

CREATE TYPE contact_method AS ENUM ('PHONE', 'EMAIL', 'SMS', 'LETTER', 'IN_PERSON', 'LEGAL_NOTICE');

CREATE TYPE contact_outcome AS ENUM (
  'NO_ANSWER',
  'WRONG_NUMBER',
  'VOICEMAIL',
  'SPOKE_WITH_CUSTOMER',
  'PAYMENT_COMMITTED',
  'DISPUTE_RAISED',
  'CALLBACK_REQUESTED',
  'REFUSED_TO_PAY',
  'BANKRUPTCY_DECLARED'
);

CREATE TYPE escalation_type AS ENUM (
  'SLA_BREACH',
  'REPEATED_BREACH',
  'NO_PROGRESS',
  'CUSTOMER_COMPLAINT',
  'DCA_PERFORMANCE',
  'HIGH_VALUE',
  'FRAUD_SUSPECTED',
  'LEGAL_REQUIRED',
  'MANUAL'
);

CREATE TYPE escalation_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TYPE notification_type AS ENUM (
  'SLA_WARNING',
  'SLA_BREACH',
  'CASE_ASSIGNED',
  'PAYMENT_RECEIVED',
  'ESCALATION_CREATED',
  'DISPUTE_RAISED',
  'PERFORMANCE_ALERT',
  'SYSTEM_ALERT'
);

CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- ===========================================
-- ORGANIZATIONS TABLE
-- ===========================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('FEDEX', 'DCA')),
  email VARCHAR(255),
  phone VARCHAR(50),
  address JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- DCAs TABLE
-- ===========================================

CREATE TABLE dcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  registration_number VARCHAR(100),
  status dca_status DEFAULT 'PENDING_APPROVAL',
  
  -- Performance Metrics
  performance_score DECIMAL(5,2) DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
  recovery_rate DECIMAL(5,2) DEFAULT 0,
  sla_compliance_rate DECIMAL(5,2) DEFAULT 0,
  avg_recovery_time_days INT,
  total_cases_handled INT DEFAULT 0,
  total_amount_recovered DECIMAL(15,2) DEFAULT 0,
  
  -- Capacity Management
  capacity_limit INT DEFAULT 100,
  capacity_used INT DEFAULT 0,
  max_case_value DECIMAL(15,2),
  min_case_value DECIMAL(15,2),
  
  -- Specializations
  specializations JSONB,
  geographic_coverage JSONB,
  
  -- Compliance
  certifications JSONB,
  license_expiry DATE,
  insurance_valid_until DATE,
  last_audit_date DATE,
  audit_score DECIMAL(5,2),
  
  -- Contract
  contract_start_date DATE,
  contract_end_date DATE,
  commission_rate DECIMAL(5,2),
  
  -- Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- ===========================================
-- USERS TABLE
-- ===========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  
  -- Organization Links
  organization_id UUID REFERENCES organizations(id),
  dca_id UUID REFERENCES dcas(id),
  
  -- Profile
  phone VARCHAR(50),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en-US',
  
  -- Permissions
  permissions JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  
  -- Preferences
  notification_preferences JSONB,
  ui_preferences JSONB,
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- CASES TABLE
-- ===========================================

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Invoice Details
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  original_amount DECIMAL(15,2) NOT NULL,
  outstanding_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Customer Information
  customer_id VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_type VARCHAR(50),
  customer_segment VARCHAR(50),
  customer_industry VARCHAR(100),
  customer_country VARCHAR(2),
  customer_state VARCHAR(50),
  customer_city VARCHAR(100),
  customer_contact JSONB,
  customer_credit_score INT,
  customer_payment_history JSONB,
  
  -- Case Metadata
  status case_status DEFAULT 'PENDING_ALLOCATION',
  priority case_priority DEFAULT 'MEDIUM',
  
  -- AI Scores
  priority_score INT CHECK (priority_score >= 0 AND priority_score <= 100),
  recovery_probability DECIMAL(5,4) CHECK (recovery_probability >= 0 AND recovery_probability <= 1),
  ai_confidence_score DECIMAL(5,4),
  risk_score INT,
  last_scored_at TIMESTAMPTZ,
  
  -- Assignment
  assigned_dca_id UUID REFERENCES dcas(id),
  assigned_agent_id UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  assignment_method VARCHAR(50),
  
  -- Recovery Details
  recovered_amount DECIMAL(15,2) DEFAULT 0,
  last_payment_date DATE,
  payment_plan_active BOOLEAN DEFAULT FALSE,
  payment_plan_details JSONB,
  
  -- Dispute Management
  is_disputed BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  dispute_opened_at TIMESTAMPTZ,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution TEXT,
  
  -- Legal Status
  legal_action_initiated BOOLEAN DEFAULT FALSE,
  legal_action_date DATE,
  legal_case_number VARCHAR(100),
  judgement_amount DECIMAL(15,2),
  judgement_date DATE,
  
  -- Closure
  closed_at TIMESTAMPTZ,
  closure_reason VARCHAR(100),
  write_off_amount DECIMAL(15,2),
  write_off_date DATE,
  
  -- ROE Recommendations
  roe_recommendations JSONB,
  roe_last_updated TIMESTAMPTZ,
  
  -- Tracking
  first_contact_date DATE,
  last_contact_date DATE,
  contact_attempts INT DEFAULT 0,
  successful_contacts INT DEFAULT 0,
  
  -- Flags
  high_priority_flag BOOLEAN DEFAULT FALSE,
  vip_customer BOOLEAN DEFAULT FALSE,
  fraud_suspected BOOLEAN DEFAULT FALSE,
  bankruptcy_flag BOOLEAN DEFAULT FALSE,
  
  -- Documents
  document_urls JSONB,
  
  -- Metadata
  tags TEXT[],
  internal_notes TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ===========================================
-- SLA TEMPLATES TABLE
-- ===========================================

CREATE TABLE sla_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sla_type sla_type NOT NULL,
  description TEXT,
  
  -- Time constraints
  duration_hours INT NOT NULL,
  business_hours_only BOOLEAN DEFAULT TRUE,
  
  -- Applicability
  applicable_to JSONB,
  
  -- Actions
  breach_notification_to TEXT[],
  auto_escalate_on_breach BOOLEAN DEFAULT FALSE,
  escalation_rules JSONB,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SLA LOGS TABLE
-- ===========================================

CREATE TABLE sla_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  sla_template_id UUID REFERENCES sla_templates(id),
  sla_type sla_type NOT NULL,
  
  -- Timeline
  started_at TIMESTAMPTZ NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Status
  status sla_status DEFAULT 'PENDING',
  breach_duration_minutes INT,
  
  -- Exemption
  is_exempt BOOLEAN DEFAULT FALSE,
  exemption_reason TEXT,
  exempted_by UUID REFERENCES users(id),
  exempted_at TIMESTAMPTZ,
  
  -- Notifications
  warning_sent BOOLEAN DEFAULT FALSE,
  warning_sent_at TIMESTAMPTZ,
  breach_notification_sent BOOLEAN DEFAULT FALSE,
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- CASE ACTIONS TABLE
-- ===========================================

CREATE TABLE case_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Action Details
  action_type VARCHAR(50) NOT NULL,
  action_description TEXT,
  
  -- Contact Details
  contact_method contact_method,
  contact_outcome contact_outcome,
  contact_duration_seconds INT,
  contact_notes TEXT,
  next_contact_scheduled DATE,
  
  -- Payment Details
  payment_amount DECIMAL(15,2),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  
  -- Status Change
  old_status case_status,
  new_status case_status,
  status_change_reason TEXT,
  
  -- Documents
  attached_documents JSONB,
  
  -- Actor
  performed_by UUID REFERENCES users(id),
  performed_by_role user_role,
  performed_by_dca_id UUID REFERENCES dcas(id),
  
  -- Customer Sentiment
  sentiment_score DECIMAL(3,2),
  sentiment_label VARCHAR(20),
  
  -- AI Recommendations
  roe_recommendation_used BOOLEAN DEFAULT FALSE,
  roe_recommendation_id VARCHAR(100),
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ESCALATIONS TABLE
-- ===========================================

CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id),
  escalation_type escalation_type NOT NULL,
  
  -- Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20),
  
  -- Status
  status escalation_status DEFAULT 'OPEN',
  
  -- Assignment
  escalated_to UUID REFERENCES users(id),
  escalated_from UUID REFERENCES users(id),
  escalated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Resolution
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_time_hours INT,
  
  -- Actions Taken
  case_reallocated BOOLEAN DEFAULT FALSE,
  new_dca_id UUID REFERENCES dcas(id),
  dca_penalized BOOLEAN DEFAULT FALSE,
  penalty_details JSONB,
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- NOTIFICATIONS TABLE
-- ===========================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES users(id),
  notification_type notification_type NOT NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Context
  related_case_id UUID REFERENCES cases(id),
  related_escalation_id UUID REFERENCES escalations(id),
  related_dca_id UUID REFERENCES dcas(id),
  
  -- Delivery
  channels notification_channel[] NOT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  -- Email/SMS Status
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMPTZ,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'NORMAL',
  
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- AUDIT LOGS TABLE
-- ===========================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  user_role user_role,
  user_ip INET,
  user_agent TEXT,
  
  -- Action
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  
  -- Details
  description TEXT,
  changes JSONB,
  
  -- Context
  request_id VARCHAR(100),
  session_id VARCHAR(100),
  api_endpoint TEXT,
  http_method VARCHAR(10),
  
  -- Result
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  -- Compliance
  compliance_relevant BOOLEAN DEFAULT FALSE,
  compliance_tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Make audit logs immutable
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ===========================================
-- INDEXES
-- ===========================================

-- Cases
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_priority ON cases(priority);
CREATE INDEX idx_cases_assigned_dca ON cases(assigned_dca_id) WHERE assigned_dca_id IS NOT NULL;
CREATE INDEX idx_cases_customer ON cases(customer_id);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX idx_cases_outstanding ON cases(outstanding_amount DESC);
CREATE INDEX idx_cases_score ON cases(priority_score DESC);
CREATE INDEX idx_cases_status_priority ON cases(status, priority);
CREATE INDEX idx_cases_dca_status ON cases(assigned_dca_id, status);

-- Full-text search
CREATE INDEX idx_cases_customer_name_trgm ON cases USING gin(customer_name gin_trgm_ops);
CREATE INDEX idx_cases_invoice_number_trgm ON cases USING gin(invoice_number gin_trgm_ops);

-- SLA Logs
CREATE INDEX idx_sla_logs_case ON sla_logs(case_id);
CREATE INDEX idx_sla_logs_status ON sla_logs(status);
CREATE INDEX idx_sla_logs_due_at ON sla_logs(due_at) WHERE status = 'PENDING';

-- Case Actions
CREATE INDEX idx_case_actions_case ON case_actions(case_id);
CREATE INDEX idx_case_actions_type ON case_actions(action_type);
CREATE INDEX idx_case_actions_created_at ON case_actions(created_at DESC);
CREATE INDEX idx_case_actions_performed_by ON case_actions(performed_by);

-- Notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

-- DCAs
CREATE INDEX idx_dcas_status ON dcas(status);
CREATE INDEX idx_dcas_performance ON dcas(performance_score DESC);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_dca ON users(dca_id) WHERE dca_id IS NOT NULL;

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dcas_updated_at
  BEFORE UPDATE ON dcas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escalations_updated_at
  BEFORE UPDATE ON escalations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sla_templates_updated_at
  BEFORE UPDATE ON sla_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate case number
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.case_number IS NULL THEN
    NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('case_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1;

CREATE TRIGGER generate_case_number_trigger
  BEFORE INSERT ON cases
  FOR EACH ROW
  EXECUTE FUNCTION generate_case_number();

-- Auto-update DCA capacity
CREATE OR REPLACE FUNCTION update_dca_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.assigned_dca_id IS NOT NULL THEN
    UPDATE dcas SET capacity_used = capacity_used + 1 WHERE id = NEW.assigned_dca_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.assigned_dca_id IS DISTINCT FROM NEW.assigned_dca_id THEN
      IF OLD.assigned_dca_id IS NOT NULL THEN
        UPDATE dcas SET capacity_used = GREATEST(capacity_used - 1, 0) WHERE id = OLD.assigned_dca_id;
      END IF;
      IF NEW.assigned_dca_id IS NOT NULL THEN
        UPDATE dcas SET capacity_used = capacity_used + 1 WHERE id = NEW.assigned_dca_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.assigned_dca_id IS NOT NULL THEN
    UPDATE dcas SET capacity_used = GREATEST(capacity_used - 1, 0) WHERE id = OLD.assigned_dca_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dca_capacity
  AFTER INSERT OR UPDATE OR DELETE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_dca_capacity();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE dcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
CREATE POLICY service_role_bypass ON cases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_bypass ON dcas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_bypass ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_bypass ON case_actions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_bypass ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_bypass ON sla_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_bypass ON escalations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to read their own data
CREATE POLICY users_read_own ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY notifications_read_own ON notifications FOR SELECT TO authenticated
  USING (recipient_id IN (SELECT id FROM users WHERE auth.uid() = users.id));

-- Default deny for anonymous
CREATE POLICY anon_deny_cases ON cases FOR ALL TO anon USING (false);
CREATE POLICY anon_deny_dcas ON dcas FOR ALL TO anon USING (false);
CREATE POLICY anon_deny_users ON users FOR ALL TO anon USING (false);

-- ===========================================
-- MATERIALIZED VIEWS
-- ===========================================

CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) AS date,
  status,
  priority,
  COUNT(*) AS case_count,
  SUM(outstanding_amount) AS total_outstanding,
  SUM(recovered_amount) AS total_recovered,
  AVG(EXTRACT(DAY FROM NOW() - due_date)) AS avg_ageing,
  AVG(priority_score) AS avg_priority_score,
  AVG(recovery_probability) AS avg_recovery_probability
FROM cases
GROUP BY DATE_TRUNC('day', created_at), status, priority;

CREATE INDEX idx_dashboard_metrics_date ON dashboard_metrics(date);

CREATE MATERIALIZED VIEW dca_performance_metrics AS
SELECT 
  d.id AS dca_id,
  d.name AS dca_name,
  COUNT(c.id) AS total_cases,
  SUM(CASE WHEN c.status IN ('FULL_RECOVERY', 'PARTIAL_RECOVERY') THEN 1 ELSE 0 END) AS recovered_cases,
  SUM(c.recovered_amount) AS total_recovered,
  SUM(c.outstanding_amount) AS total_outstanding,
  AVG(EXTRACT(DAY FROM (c.closed_at - c.assigned_at))) AS avg_resolution_days,
  COUNT(s.id) FILTER (WHERE s.status = 'BREACHED') AS sla_breaches,
  COUNT(s.id) FILTER (WHERE s.status = 'MET') AS sla_met,
  CASE 
    WHEN COUNT(s.id) > 0 THEN (COUNT(s.id) FILTER (WHERE s.status = 'MET')::DECIMAL / COUNT(s.id) * 100) 
    ELSE 0 
  END AS sla_compliance_rate
FROM dcas d
LEFT JOIN cases c ON d.id = c.assigned_dca_id
LEFT JOIN sla_logs s ON c.id = s.case_id
GROUP BY d.id, d.name;

SELECT 'Database schema created successfully!' AS result;
