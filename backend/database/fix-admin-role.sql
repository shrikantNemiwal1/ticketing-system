-- Fix PostgreSQL constraint to allow ADMIN role
-- Run this script to update the database schema

-- Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new check constraint that includes ADMIN
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('EMPLOYEE', 'IT_SUPPORT', 'ADMIN'));

-- Verify the constraint was updated
SELECT conname, conrelid::regclass, consrc 
FROM pg_constraint 
WHERE conname = 'users_role_check';

-- Show current table structure
\d users;
