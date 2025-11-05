/**
 * Migration 001: Update CRM Schema to Match Implementation Guide
 *
 * This migration updates the customers, contacts, and locations tables
 * to match the detailed schema in implementation/04-MODULE-CRM.md
 */

-- ============================================================================
-- CUSTOMERS TABLE MIGRATION
-- ============================================================================

-- Add tenant_id column (required for multi-tenancy)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers' AND column_name = 'tenant_id'
    ) THEN
        -- Add with a temporary default, will be updated later
        ALTER TABLE customers
        ADD COLUMN tenant_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440001'::UUID;

        RAISE NOTICE 'Added tenant_id column to customers';
    END IF;
END $$;

-- Add customer_number column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers' AND column_name = 'customer_number'
    ) THEN
        ALTER TABLE customers ADD COLUMN customer_number VARCHAR(50);
        RAISE NOTICE 'Added customer_number column to customers';
    END IF;
END $$;

-- Add display_name column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE customers ADD COLUMN display_name VARCHAR(255);
        RAISE NOTICE 'Added display_name column to customers';
    END IF;
END $$;

-- Add parent_customer_id for hierarchy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers' AND column_name = 'parent_customer_id'
    ) THEN
        ALTER TABLE customers ADD COLUMN parent_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added parent_customer_id column to customers';
    END IF;
END $$;

-- Update type column constraint
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'customers' AND constraint_name = 'customers_type_check'
    ) THEN
        ALTER TABLE customers DROP CONSTRAINT customers_type_check;
    END IF;

    -- Add new column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers' AND column_name = 'type'
    ) THEN
        ALTER TABLE customers ADD COLUMN type VARCHAR(50);
    END IF;

    -- Add new constraint
    ALTER TABLE customers ADD CONSTRAINT customers_type_check
        CHECK (type IN ('business', 'residential', 'nonprofit', 'government'));

    RAISE NOTICE 'Updated type column and constraint';
END $$;

-- Update tier column constraint
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'customers' AND constraint_name = 'customers_tier_check'
    ) THEN
        ALTER TABLE customers DROP CONSTRAINT customers_tier_check;
    END IF;

    -- Add new constraint with new tier values
    ALTER TABLE customers ADD CONSTRAINT customers_tier_check
        CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'trial'));

    RAISE NOTICE 'Updated tier constraint';
END $$;

-- Add contact information columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email') THEN
        ALTER TABLE customers ADD COLUMN email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'phone') THEN
        ALTER TABLE customers ADD COLUMN phone VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'website') THEN
        ALTER TABLE customers ADD COLUMN website VARCHAR(255);
    END IF;
    RAISE NOTICE 'Added contact columns to customers';
END $$;

-- Add address columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'address_line1') THEN
        ALTER TABLE customers ADD COLUMN address_line1 VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'address_line2') THEN
        ALTER TABLE customers ADD COLUMN address_line2 VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'city') THEN
        ALTER TABLE customers ADD COLUMN city VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'state') THEN
        ALTER TABLE customers ADD COLUMN state VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'postal_code') THEN
        ALTER TABLE customers ADD COLUMN postal_code VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'country') THEN
        ALTER TABLE customers ADD COLUMN country VARCHAR(3) DEFAULT 'DEU';
    END IF;
    RAISE NOTICE 'Added address columns to customers';
END $$;

-- Add billing/payment columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tax_id') THEN
        ALTER TABLE customers ADD COLUMN tax_id VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'payment_terms') THEN
        ALTER TABLE customers ADD COLUMN payment_terms INTEGER DEFAULT 30;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'currency') THEN
        ALTER TABLE customers ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR';
    END IF;
    RAISE NOTICE 'Added billing columns to customers';
END $$;

-- Add custom_fields (JSONB) and tags (array)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'custom_fields') THEN
        ALTER TABLE customers ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tags') THEN
        ALTER TABLE customers ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'notes') THEN
        ALTER TABLE customers ADD COLUMN notes TEXT;
    END IF;
    RAISE NOTICE 'Added custom_fields, tags, and notes columns';
END $$;

-- Add audit columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'created_by') THEN
        ALTER TABLE customers ADD COLUMN created_by UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'updated_by') THEN
        ALTER TABLE customers ADD COLUMN updated_by UUID;
    END IF;
    RAISE NOTICE 'Added audit columns to customers';
END $$;

-- Make tenant_id NOT NULL after adding it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers' AND column_name = 'tenant_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;
        RAISE NOTICE 'Made tenant_id NOT NULL';
    END IF;
END $$;

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_parent ON customers(parent_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON customers(customer_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE deleted_at IS NULL AND email IS NOT NULL;

-- ============================================================================
-- CONTACTS TABLE CHECK
-- ============================================================================

-- Verify contacts table has tenant_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contacts' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE contacts
        ADD COLUMN tenant_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440001'::UUID NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id) WHERE deleted_at IS NULL;
        RAISE NOTICE 'Added tenant_id to contacts';
    END IF;
END $$;

-- Add custom_fields to contacts if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'custom_fields') THEN
        ALTER TABLE contacts ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'notes') THEN
        ALTER TABLE contacts ADD COLUMN notes TEXT;
    END IF;
    RAISE NOTICE 'Added custom_fields and notes to contacts';
END $$;

-- ============================================================================
-- LOCATIONS TABLE CHECK
-- ============================================================================

-- Verify locations table has tenant_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'locations' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE locations
        ADD COLUMN tenant_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440001'::UUID NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations(tenant_id) WHERE deleted_at IS NULL;
        RAISE NOTICE 'Added tenant_id to locations';
    END IF;
END $$;

-- Add custom_fields to locations if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'custom_fields') THEN
        ALTER TABLE locations ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'notes') THEN
        ALTER TABLE locations ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'email') THEN
        ALTER TABLE locations ADD COLUMN email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'phone') THEN
        ALTER TABLE locations ADD COLUMN phone VARCHAR(50);
    END IF;
    RAISE NOTICE 'Added custom_fields, notes, email, and phone to locations';
END $$;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Migration 001 completed successfully!';
    RAISE NOTICE 'All CRM tables updated to match implementation guide';
    RAISE NOTICE '============================================';
END $$;
