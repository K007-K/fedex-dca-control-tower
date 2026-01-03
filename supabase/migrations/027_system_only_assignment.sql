-- ============================================================
-- MIGRATION 027: SYSTEM-ONLY ASSIGNMENT ENFORCEMENT
-- ============================================================
-- Purpose: Add database-level protection to ensure that DCA and
-- agent assignment fields can ONLY be modified by SYSTEM actors.
-- 
-- This prevents any bypass of API-level security controls.
-- Even direct SQL updates from human sessions will be blocked.
-- ============================================================

-- Create a trigger function to block human assignment updates
CREATE OR REPLACE FUNCTION prevent_human_assignment_update()
RETURNS TRIGGER AS $$
DECLARE
    session_actor text;
BEGIN
    -- Get the current session's actor type
    -- This is set by the API layer when using admin client
    session_actor := current_setting('app.actor_type', true);
    
    -- If session actor is not explicitly set or is HUMAN
    -- block updates to assignment fields
    IF session_actor IS NULL OR session_actor != 'SYSTEM' THEN
        -- Check if assignment fields are being modified
        IF (OLD.assigned_dca_id IS DISTINCT FROM NEW.assigned_dca_id) THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: assigned_dca_id can only be modified by SYSTEM actor. Human override is not permitted.';
        END IF;
        
        IF (OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id) THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: assigned_agent_id can only be modified by SYSTEM actor. Human override is not permitted.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on cases table
DROP TRIGGER IF EXISTS trg_prevent_human_assignment_update ON cases;
CREATE TRIGGER trg_prevent_human_assignment_update
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION prevent_human_assignment_update();

-- Add comment for documentation
COMMENT ON FUNCTION prevent_human_assignment_update() IS 
'Trigger function to enforce SYSTEM-only assignment of DCAs and agents. 
Blocks any update to assigned_dca_id or assigned_agent_id unless 
the session has app.actor_type set to SYSTEM.';

COMMENT ON TRIGGER trg_prevent_human_assignment_update ON cases IS
'Prevents human actors from modifying assigned_dca_id or assigned_agent_id.
These fields are SYSTEM-controlled and can only be set through the 
automated allocation service.';

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================
-- Run this to verify the trigger exists:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'trg_prevent_human_assignment_update';
