-- P1-7 FIX: Add days_past_due as a computed/virtual column
-- Run this in Supabase SQL Editor

-- Option 1: Create a view that includes computed days_past_due
CREATE OR REPLACE VIEW cases_with_dpd AS
SELECT 
    c.*,
    GREATEST(0, EXTRACT(DAY FROM NOW() - COALESCE(c.due_date, c.created_at + INTERVAL '30 days'))) AS days_past_due,
    CASE 
        WHEN COALESCE(c.due_date, c.created_at + INTERVAL '30 days') > NOW() THEN 'NOT_DUE'
        WHEN EXTRACT(DAY FROM NOW() - COALESCE(c.due_date, c.created_at + INTERVAL '30 days')) <= 30 THEN 'EARLY'
        WHEN EXTRACT(DAY FROM NOW() - COALESCE(c.due_date, c.created_at + INTERVAL '30 days')) <= 60 THEN 'MID'
        WHEN EXTRACT(DAY FROM NOW() - COALESCE(c.due_date, c.created_at + INTERVAL '30 days')) <= 90 THEN 'LATE'
        ELSE 'VERY_LATE'
    END AS aging_bucket
FROM cases c;

-- Grant access to the view
GRANT SELECT ON cases_with_dpd TO authenticated;

-- Option 2: Create a function to get days past due for a case
CREATE OR REPLACE FUNCTION get_days_past_due(case_id UUID)
RETURNS INTEGER AS $$
DECLARE
    due_date_val TIMESTAMPTZ;
    created_at_val TIMESTAMPTZ;
    dpd INTEGER;
BEGIN
    SELECT due_date, created_at INTO due_date_val, created_at_val
    FROM cases WHERE id = case_id;
    
    IF due_date_val IS NULL THEN
        due_date_val := created_at_val + INTERVAL '30 days';
    END IF;
    
    dpd := GREATEST(0, EXTRACT(DAY FROM NOW() - due_date_val));
    RETURN dpd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Option 3: Add a trigger to update a stored days_past_due column
-- First, add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'days_past_due_cached'
    ) THEN
        ALTER TABLE cases ADD COLUMN days_past_due_cached INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create a function to update days_past_due_cached
CREATE OR REPLACE FUNCTION update_days_past_due()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days_past_due_cached := GREATEST(0, 
        EXTRACT(DAY FROM NOW() - COALESCE(NEW.due_date, NEW.created_at + INTERVAL '30 days'))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
DROP TRIGGER IF EXISTS cases_dpd_trigger ON cases;
CREATE TRIGGER cases_dpd_trigger
    BEFORE INSERT OR UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_days_past_due();

-- Create a scheduled function to refresh all days_past_due values daily
-- (Run this via pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION refresh_all_days_past_due()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE cases 
    SET days_past_due_cached = GREATEST(0, 
        EXTRACT(DAY FROM NOW() - COALESCE(due_date, created_at + INTERVAL '30 days'))
    )
    WHERE status NOT IN ('CLOSED', 'FULL_RECOVERY');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run initial refresh
SELECT refresh_all_days_past_due();

-- Verify
SELECT 
    id, 
    case_number, 
    due_date, 
    created_at, 
    days_past_due_cached,
    get_days_past_due(id) as calculated_dpd
FROM cases 
LIMIT 5;
