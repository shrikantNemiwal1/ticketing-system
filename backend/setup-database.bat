@echo off
REM IT Support Ticket System - Database Setup Script for Windows
REM This script automates the PostgreSQL database setup

setlocal enabledelayedexpansion

echo 🚀 Setting up IT Support Ticket System Database...

REM Configuration
set DB_NAME=ticketing_system
set DB_USER=ticketing_user
set DB_PASSWORD=ticketing_password
set DB_HOST=localhost
set DB_PORT=5432

REM Check if PostgreSQL is available
echo 📡 Checking PostgreSQL connection...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL not found in PATH. 
    echo 💡 Please add PostgreSQL bin directory to PATH or use --docker option
    echo.
    echo For PostgreSQL 17: C:\Program Files\PostgreSQL\17\bin
    echo.
    if "%1"=="--docker" goto :docker_setup
    echo Use "%0 --docker" to start PostgreSQL with Docker
    pause
    exit /b 1
)

REM Test PostgreSQL connection
echo 🔍 Testing PostgreSQL connection...
echo SELECT version(); | psql -h %DB_HOST% -p %DB_PORT% -U postgres >nul 2>&1
if errorlevel 1 (
    echo ❌ Cannot connect to PostgreSQL. Please ensure it's running.
    if "%1"=="--docker" goto :docker_setup
    echo 💡 Use "%0 --docker" to start PostgreSQL with Docker
    pause
    exit /b 1
)

echo ✅ PostgreSQL is running

:setup_database
echo 🗄️ Creating database and user...

REM Create database
echo CREATE DATABASE %DB_NAME%; | psql -h %DB_HOST% -p %DB_PORT% -U postgres >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Database %DB_NAME% might already exist
) else (
    echo ✅ Database created
)

REM Create user
echo CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%'; | psql -h %DB_HOST% -p %DB_PORT% -U postgres >nul 2>&1
if errorlevel 1 (
    echo ⚠️ User %DB_USER% might already exist
) else (
    echo ✅ User created
)

REM Grant privileges
echo GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%; | psql -h %DB_HOST% -p %DB_PORT% -U postgres
echo GRANT ALL ON SCHEMA public TO %DB_USER%; | psql -h %DB_HOST% -p %DB_PORT% -U postgres -d %DB_NAME%
echo GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %DB_USER%; | psql -h %DB_HOST% -p %DB_PORT% -U postgres -d %DB_NAME%
echo GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %DB_USER%; | psql -h %DB_HOST% -p %DB_PORT% -U postgres -d %DB_NAME%

echo ✅ Privileges granted

REM Test connection with application user
echo 🔍 Testing database connection...
set PGPASSWORD=%DB_PASSWORD%
echo SELECT current_database(), current_user; | psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% >nul 2>&1
if errorlevel 1 (
    echo ❌ Database connection failed
    pause
    exit /b 1
)
echo ✅ Database connection successful

goto :success

:docker_setup
echo 🐳 Starting PostgreSQL with Docker...

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found. Please install Docker or PostgreSQL manually.
    pause
    exit /b 1
)

REM Check if container already exists
docker ps -a --format "{{.Names}}" | findstr /r "^ticketing-postgres$" >nul 2>&1
if not errorlevel 1 (
    echo 📦 Container already exists. Starting...
    docker start ticketing-postgres
) else (
    echo 📦 Creating new PostgreSQL container...
    docker run --name ticketing-postgres -e POSTGRES_DB=%DB_NAME% -e POSTGRES_USER=%DB_USER% -e POSTGRES_PASSWORD=%DB_PASSWORD% -p %DB_PORT%:5432 -d postgres:15
)

echo ⏳ Waiting for PostgreSQL to start...
timeout /t 15 /nobreak >nul

REM Test Docker PostgreSQL connection
set PGPASSWORD=%DB_PASSWORD%
echo SELECT version(); | psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% >nul 2>&1
if errorlevel 1 (
    echo ❌ Failed to connect to Docker PostgreSQL
    pause
    exit /b 1
)
echo ✅ Docker PostgreSQL is ready

:success
echo.
echo 🎉 Database setup completed successfully!
echo.
echo 📊 Database Information:
echo   Host: %DB_HOST%:%DB_PORT%
echo   Database: %DB_NAME%
echo   Username: %DB_USER%
echo   Password: %DB_PASSWORD%
echo.
echo 🚀 You can now run the application with:
echo   mvn spring-boot:run
echo.
echo 📱 API will be available at: http://localhost:8080
echo 📚 Swagger UI: http://localhost:8080/swagger-ui.html
echo.
pause
