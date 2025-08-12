-- PostgreSQL Database Setup for IT Support Ticket System
-- Run these commands as postgres superuser

-- Create database
CREATE DATABASE ticketing_system;

-- Create application user
CREATE USER ticketing_user WITH PASSWORD 'ticketing_password';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE ticketing_system TO ticketing_user;

-- Connect to the database
\c ticketing_system;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ticketing_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ticketing_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ticketing_user;

-- Make ticketing_user the owner of the database (optional but recommended)
ALTER DATABASE ticketing_system OWNER TO ticketing_user;
