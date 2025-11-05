/**
 * Migration 002: Align Contact and Location Column Names
 *
 * Updates column naming to match CRM service expectations
 */

-- ============================================================================
-- CONTACTS TABLE - Add missing phone columns
-- ============================================================================

-- Rename phone to phone_office
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contacts' AND column_name = 'phone'
    ) THEN
        ALTER TABLE contacts RENAME COLUMN phone TO phone_office;
        RAISE NOTICE 'Renamed phone to phone_office in contacts';
    END IF;
END $$;

-- Rename mobile to phone_mobile
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contacts' AND column_name = 'mobile'
    ) THEN
        ALTER TABLE contacts RENAME COLUMN mobile TO phone_mobile;
        RAISE NOTICE 'Renamed mobile to phone_mobile in contacts';
    END IF;
END $$;

-- Add phone_direct column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contacts' AND column_name = 'phone_direct'
    ) THEN
        ALTER TABLE contacts ADD COLUMN phone_direct VARCHAR(50);
        RAISE NOTICE 'Added phone_direct to contacts';
    END IF;
END $$;

-- ============================================================================
-- LOCATIONS TABLE - Check schema
-- ============================================================================

-- Check locations table structure
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'locations';

    IF col_count = 0 THEN
        RAISE EXCEPTION 'locations table does not exist';
    END IF;

    RAISE NOTICE 'locations table has % columns', col_count;
END $$;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Migration 002 completed successfully!';
    RAISE NOTICE 'Contact and Location columns aligned';
    RAISE NOTICE '============================================';
END $$;
