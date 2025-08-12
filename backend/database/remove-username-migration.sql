-- Migration script to remove username column from users table
-- Run this script to update the database schema for email-only authentication

-- First backup existing data if needed
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- Drop the existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Drop the username column
ALTER TABLE users DROP COLUMN IF EXISTS username;

-- Add unique constraint to email if not exists
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add back the role constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('EMPLOYEE', 'IT_SUPPORT', 'ADMIN'));

-- Verify the changes
\d users;
