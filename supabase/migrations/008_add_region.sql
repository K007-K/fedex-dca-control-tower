-- ===========================================
-- FedEx DCA Control Tower - Add Region Support
-- ===========================================
-- Migration to add region and currency fields
-- ===========================================

-- Create region enum
DO $$ BEGIN
    CREATE TYPE region_type AS ENUM ('INDIA', 'AMERICA', 'EUROPE', 'APAC', 'LATAM', 'MIDDLE_EAST', 'AFRICA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create currency enum
DO $$ BEGIN
    CREATE TYPE currency_type AS ENUM ('USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'AED', 'SGD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add region and currency to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS region region_type DEFAULT 'AMERICA';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS currency currency_type DEFAULT 'USD';

-- Add region to dcas table
ALTER TABLE dcas ADD COLUMN IF NOT EXISTS region region_type DEFAULT 'AMERICA';

-- Add region to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS region region_type DEFAULT 'AMERICA';

-- Create index for region filtering
CREATE INDEX IF NOT EXISTS idx_cases_region ON cases(region);
CREATE INDEX IF NOT EXISTS idx_dcas_region ON dcas(region);

-- Update existing cases with default region (if any exist)
UPDATE cases SET region = 'AMERICA', currency = 'USD' WHERE region IS NULL;
UPDATE dcas SET region = 'AMERICA' WHERE region IS NULL;

SELECT 'Region migration completed successfully!' AS result;
