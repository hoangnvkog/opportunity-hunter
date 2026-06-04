-- ============================================================================
-- Migration: 00000000000001_extensions.sql
-- Purpose : Enable required PostgreSQL extensions for Opportunity Hunter.
-- Notes   : pgcrypto provides gen_random_uuid().
-- ============================================================================

create extension if not exists "pgcrypto";
