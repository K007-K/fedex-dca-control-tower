-- ============================================================
-- MIGRATION 045: Fix SYSTEM-only assignment trigger
-- ============================================================
-- BUG FIX: The trigger in migration 027 checks app.actor_type 
-- session variable, but Supabase REST API (PostgREST) cannot 
-- set PostgreSQL session variables per-request.
--
-- The createAdminClient() uses service_role key which maps to
-- the 'service_role' PostgreSQL role. This role should be 
-- allowed to modify assignment fields since it's used by the
-- SYSTEM allocation service.
--
-- FIX: Also allow current_user = 'service_role' to bypass
-- the assignment protection trigger.
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_human_assignment_update()
RETURNS TRIGGER AS $$
DECLARE
    session_actor text;
    pg_role text;
BEGIN
    -- Get the PostgreSQL role making this request
    pg_role := current_user;
    
    -- Allow service_role (used by createAdminClient / SYSTEM services)
    -- Service role is the backend system identity in Supabase
    IF pg_role = 'service_role' THEN
        RETURN NEW;
    END IF;
    
    -- Get the current session's actor type (set by API layer)
    session_actor := current_setting('app.actor_type', true);
    
    -- If session actor is explicitly SYSTEM, allow
    IF session_actor = 'SYSTEM' THEN
        RETURN NEW;
    END IF;
    
    -- Block human actors from modifying assignment fields
    IF (OLD.assigned_dca_id IS DISTINCT FROM NEW.assigned_dca_id) THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: assigned_dca_id can only be modified by SYSTEM actor. Human override is not permitted.';
    END IF;
    
    IF (OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id) THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: assigned_agent_id can only be modified by SYSTEM actor. Human override is not permitted.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update documentation
COMMENT ON FUNCTION prevent_human_assignment_update() IS 
'Trigger function to enforce SYSTEM-only assignment of DCAs and agents. 
Allows service_role (backend SYSTEM services) and sessions with app.actor_type=SYSTEM.
Blocks all other actors from modifying assigned_dca_id or assigned_agent_id.';

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Migration 045: Fixed SYSTEM-only assignment trigger to allow service_role' AS result;
