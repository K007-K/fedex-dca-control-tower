-- ===========================================
-- FedEx DCA Control Tower - Escalation Matrix Schema
-- Migration: 021_escalation_matrix.sql
-- ===========================================
-- Enterprise Region Governance - Phase 1 (continued)
-- Region-specific escalation matrices
-- ===========================================

-- ===========================================
-- 1. ESCALATION MATRICES TABLE
-- ===========================================
-- Each region can have its own escalation matrix

CREATE TABLE IF NOT EXISTS escalation_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
    
    -- Matrix Identity
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_matrices_region ON escalation_matrices(region_id);

-- ===========================================
-- 2. ESCALATION MATRIX LEVELS TABLE
-- ===========================================
-- Defines escalation levels (L1, L2, L3) per matrix

CREATE TABLE IF NOT EXISTS escalation_matrix_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matrix_id UUID NOT NULL REFERENCES escalation_matrices(id) ON DELETE CASCADE,
    
    -- Level Configuration
    level INT NOT NULL CHECK (level >= 1 AND level <= 5),
    level_name VARCHAR(50) NOT NULL,              -- 'L1 - Team Lead', 'L2 - Manager', 'L3 - Director'
    
    -- Trigger Configuration
    escalation_type VARCHAR(50) NOT NULL,         -- 'SLA_BREACH', 'NO_PROGRESS', 'HIGH_VALUE', etc.
    trigger_after_hours INT NOT NULL,             -- Hours after case assignment or previous level
    trigger_condition JSONB,                      -- Complex trigger conditions
    
    -- Assignment
    assigned_role VARCHAR(50),                    -- Role to escalate to
    assigned_user_id UUID REFERENCES users(id),   -- Specific user (optional)
    
    -- Notification Configuration
    notification_channels VARCHAR(20)[] DEFAULT '{IN_APP, EMAIL}',
    notification_template_id UUID,
    send_to_previous_assignee BOOLEAN DEFAULT TRUE,
    send_to_case_owner BOOLEAN DEFAULT TRUE,
    additional_recipients TEXT[],                 -- Email addresses
    
    -- Actions
    auto_reassign_dca BOOLEAN DEFAULT FALSE,
    auto_change_priority BOOLEAN DEFAULT FALSE,
    new_priority VARCHAR(20),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: One level per type per matrix
    UNIQUE(matrix_id, level, escalation_type)
);

CREATE INDEX IF NOT EXISTS idx_escalation_levels_matrix ON escalation_matrix_levels(matrix_id);
CREATE INDEX IF NOT EXISTS idx_escalation_levels_type ON escalation_matrix_levels(escalation_type);

-- ===========================================
-- 3. ADD FOREIGN KEY TO REGIONS
-- ===========================================

-- Add FK from regions to escalation_matrices (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_regions_escalation_matrix'
    ) THEN
        ALTER TABLE regions ADD CONSTRAINT fk_regions_escalation_matrix
            FOREIGN KEY (escalation_matrix_id) REFERENCES escalation_matrices(id);
    END IF;
END $$;

-- ===========================================
-- 4. ADD FK FROM SLA_TEMPLATES TO REGIONS
-- ===========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_regions_sla_template'
    ) THEN
        ALTER TABLE regions ADD CONSTRAINT fk_regions_sla_template
            FOREIGN KEY (default_sla_template_id) REFERENCES sla_templates(id);
    END IF;
END $$;

-- ===========================================
-- 5. FUNCTION FOR AUTOMATED ESCALATION
-- ===========================================

CREATE OR REPLACE FUNCTION check_and_create_escalation(
    p_case_id UUID,
    p_escalation_type VARCHAR(50)
) RETURNS UUID AS $$
DECLARE
    v_case RECORD;
    v_matrix_level RECORD;
    v_escalation_id UUID;
BEGIN
    -- Get case details
    SELECT c.*, r.escalation_matrix_id 
    INTO v_case
    FROM cases c
    LEFT JOIN regions r ON r.id = c.region_id
    WHERE c.id = p_case_id;
    
    IF v_case IS NULL OR v_case.escalation_matrix_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Find applicable escalation level
    SELECT * INTO v_matrix_level
    FROM escalation_matrix_levels
    WHERE matrix_id = v_case.escalation_matrix_id
      AND escalation_type = p_escalation_type
    ORDER BY level
    LIMIT 1;
    
    IF v_matrix_level IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Create escalation
    INSERT INTO escalations (
        case_id, 
        escalation_type, 
        title, 
        description, 
        severity,
        escalated_to
    ) VALUES (
        p_case_id,
        p_escalation_type::escalation_type,
        'Auto-escalated: ' || p_escalation_type,
        'System-generated escalation based on region escalation matrix',
        'HIGH',
        v_matrix_level.assigned_user_id
    ) RETURNING id INTO v_escalation_id;
    
    -- Update case priority if configured
    IF v_matrix_level.auto_change_priority AND v_matrix_level.new_priority IS NOT NULL THEN
        UPDATE cases SET priority = v_matrix_level.new_priority::case_priority WHERE id = p_case_id;
    END IF;
    
    RETURN v_escalation_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

SELECT 'Escalation Matrix Schema migration completed successfully!' AS result;
