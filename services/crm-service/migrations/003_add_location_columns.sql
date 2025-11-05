/**
 * Migration 003: Add Missing Columns to Locations
 *
 * Adds state, coordinates, and location_type to locations table
 */

-- Add state column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'locations' AND column_name = 'state'
    ) THEN
        ALTER TABLE locations ADD COLUMN state VARCHAR(100);
        RAISE NOTICE 'Added state column to locations';
    END IF;
END $$;

-- Add latitude column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'locations' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE locations ADD COLUMN latitude DECIMAL(10, 7);
        RAISE NOTICE 'Added latitude column to locations';
    END IF;
END $$;

-- Add longitude column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'locations' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE locations ADD COLUMN longitude DECIMAL(10, 7);
        RAISE NOTICE 'Added longitude column to locations';
    END IF;
END $$;

-- Add location_type column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'locations' AND column_name = 'location_type'
    ) THEN
        ALTER TABLE locations ADD COLUMN location_type VARCHAR(50);
        RAISE NOTICE 'Added location_type column to locations';
    END IF;
END $$;

-- Update country column size (code expects VARCHAR(3), table has VARCHAR(2))
DO $$
BEGIN
    ALTER TABLE locations ALTER COLUMN country TYPE VARCHAR(3);
    RAISE NOTICE 'Updated country column type to VARCHAR(3)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Country column type update failed or already correct: %', SQLERRM;
END $$;

-- Update country constraint to allow 3-letter codes (DEU, AUT, CHE)
DO $$
BEGIN
    -- Drop old constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'locations' AND constraint_name = 'locations_country_check'
    ) THEN
        ALTER TABLE locations DROP CONSTRAINT locations_country_check;
    END IF;

    -- Add new constraint
    ALTER TABLE locations ADD CONSTRAINT locations_country_check
        CHECK (country IN ('DEU', 'AUT', 'CHE', 'DE', 'AT', 'CH'));

    RAISE NOTICE 'Updated country constraint to support 3-letter codes';
END $$;

-- Add location_type constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'locations' AND constraint_name = 'locations_type_check'
    ) THEN
        ALTER TABLE locations ADD CONSTRAINT locations_type_check
            CHECK (location_type IN ('headquarters', 'branch', 'datacenter', 'remote'));
        RAISE NOTICE 'Added location_type constraint';
    END IF;
END $$;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Migration 003 completed successfully!';
    RAISE NOTICE 'Locations table updated';
    RAISE NOTICE '============================================';
END $$;
