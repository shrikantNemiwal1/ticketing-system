#!/bin/bash

# IT Support Ticket System - Database Setup Script
# This script automates the PostgreSQL database setup

set -e  # Exit on any error

echo "🚀 Setting up IT Support Ticket System Database..."

# Configuration
DB_NAME="ticketing_system"
DB_USER="ticketing_user"
DB_PASSWORD="ticketing_password"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
check_postgres() {
    echo "📡 Checking PostgreSQL connection..."
    if command -v psql > /dev/null 2>&1; then
        if psql -h $DB_HOST -p $DB_PORT -U postgres -c "SELECT version();" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL is running${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  PostgreSQL is installed but not accessible. Please check if it's running.${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ PostgreSQL not found. Please install PostgreSQL first.${NC}"
        return 1
    fi
}

# Create database and user
setup_database() {
    echo "🗄️  Creating database and user..."
    
    # Create database
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Database $DB_NAME already exists${NC}"
    }
    
    # Create user
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  User $DB_USER already exists${NC}"
    }
    
    # Grant privileges
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    
    # Connect to database and grant schema privileges
    psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
    psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
    
    echo -e "${GREEN}✅ Database setup completed${NC}"
}

# Test connection with application user
test_connection() {
    echo "🔍 Testing database connection..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT current_database(), current_user;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        exit 1
    fi
}

# Start Docker PostgreSQL if needed
start_docker_postgres() {
    echo "🐳 Starting PostgreSQL with Docker..."
    
    if ! command -v docker > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker not found. Please install Docker or PostgreSQL manually.${NC}"
        exit 1
    fi
    
    # Check if container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "^ticketing-postgres$"; then
        echo "📦 Container already exists. Starting..."
        docker start ticketing-postgres
    else
        echo "📦 Creating new PostgreSQL container..."
        docker run --name ticketing-postgres \
            -e POSTGRES_DB=$DB_NAME \
            -e POSTGRES_USER=$DB_USER \
            -e POSTGRES_PASSWORD=$DB_PASSWORD \
            -p $DB_PORT:5432 \
            -d postgres:15
    fi
    
    # Wait for PostgreSQL to start
    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 10
    
    # Test connection
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker PostgreSQL is ready${NC}"
    else
        echo -e "${RED}❌ Failed to connect to Docker PostgreSQL${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo "🎯 IT Support Ticket System Database Setup"
    echo "========================================="
    
    # Check if --docker flag is provided
    if [ "$1" = "--docker" ]; then
        start_docker_postgres
    else
        if ! check_postgres; then
            echo ""
            echo -e "${YELLOW}💡 Tip: Use '$0 --docker' to start PostgreSQL with Docker${NC}"
            exit 1
        fi
        setup_database
        test_connection
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
    echo ""
    echo "📊 Database Information:"
    echo "  Host: $DB_HOST:$DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  Username: $DB_USER"
    echo "  Password: $DB_PASSWORD"
    echo ""
    echo "🚀 You can now run the application with:"
    echo "  mvn spring-boot:run"
    echo ""
    echo "📱 API will be available at: http://localhost:8080"
    echo "📚 Swagger UI: http://localhost:8080/swagger-ui.html"
}

# Run main function with all arguments
main "$@"
