-- ===========================================
-- Migration 039: State-Scoped DCA User Creation
-- ===========================================
-- Purpose: Enable DCA_MANAGER delegated agent creation with state scoping
-- Reference: MASTER UI GOVERNANCE & DESIGN SPEC v1.0
-- ===========================================

-- 1. Add state_code column to users table
-- DCA_MANAGER will have a state assigned by DCA_ADMIN
-- DCA_AGENT will inherit state from their creator
ALTER TABLE users ADD COLUMN IF NOT EXISTS state_code VARCHAR(10);

-- 2. Add can_create_agents flag for DCA_MANAGER
-- DCA_ADMIN can grant/revoke this right
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_create_agents BOOLEAN DEFAULT false;

-- 3. Add created_by for user creation audit trail
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id);

-- 4. Create index for state-scoped queries
CREATE INDEX IF NOT EXISTS idx_users_state_code ON users(state_code) WHERE state_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_can_create ON users(can_create_agents) WHERE can_create_agents = true;

-- 5. Add comment for documentation
COMMENT ON COLUMN users.state_code IS 'State/province code for DCA users. DCA_MANAGER has assigned state, DCA_AGENT inherits from creator.';
COMMENT ON COLUMN users.can_create_agents IS 'Flag indicating if DCA_MANAGER can create DCA_AGENT users. Controlled by DCA_ADMIN.';
COMMENT ON COLUMN users.created_by_user_id IS 'User who created this user account. For audit trail.';

-- 6. Update existing DCA_MANAGER users to have can_create_agents = true by default
-- (Existing managers get creation rights, new ones will be controlled by DCA_ADMIN)
UPDATE users 
SET can_create_agents = true 
WHERE role = 'DCA_MANAGER' AND can_create_agents IS NULL;

-- 7. Create audit function for user creation rights changes
CREATE OR REPLACE FUNCTION log_creation_rights_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.can_create_agents IS DISTINCT FROM NEW.can_create_agents THEN
        INSERT INTO audit_logs (
            action,
            severity,
            user_id,
            resource_type,
            resource_id,
            details
        ) VALUES (
            CASE WHEN NEW.can_create_agents THEN 'CREATION_RIGHT_GRANTED' ELSE 'CREATION_RIGHT_REVOKED' END,
            'INFO',
            NEW.updated_by,
            'USER',
            NEW.id,
            jsonb_build_object(
                'target_user_id', NEW.id,
                'target_email', NEW.email,
                'previous_value', OLD.can_create_agents,
                'new_value', NEW.can_create_agents
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for creation rights changes
DROP TRIGGER IF EXISTS trigger_log_creation_rights ON users;
CREATE TRIGGER trigger_log_creation_rights
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.can_create_agents IS DISTINCT FROM NEW.can_create_agents)
    EXECUTE FUNCTION log_creation_rights_change();

-- 9. Add updated_by column if not exists (for audit)
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

SELECT 'Migration 039: State-scoped user creation schema complete' AS result;
