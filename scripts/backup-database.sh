#!/bin/bash

# TrenderAI Database Backup Script
# This script creates a backup of the PostgreSQL database

set -e  # Exit on any error

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="trenderai-db-backup-${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting TrenderAI Database Backup...${NC}"
echo -e "${BLUE}📅 Timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}📁 Backup Name: ${BACKUP_NAME}.sql${NC}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    echo -e "${YELLOW}💡 Please set DATABASE_URL before running this script${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL is set${NC}"

# Extract database info from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo -e "${BLUE}📊 Database Info:${NC}"
echo -e "  Host: ${DB_HOST:-Not available}"
echo -e "  Port: ${DB_PORT:-5432}"
echo -e "  Database: ${DB_NAME:-Not available}"
echo -e "  User: ${DB_USER:-Not available}"
echo ""

if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo -e "${RED}❌ Could not parse DATABASE_URL properly${NC}"
    echo -e "${YELLOW}💡 Please check your DATABASE_URL format${NC}"
    exit 1
fi

# Create database dump
echo -e "${YELLOW}🗄️  Creating database dump...${NC}"

PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \
    --no-password --verbose --clean --no-owner --no-privileges \
    > "${BACKUP_DIR}/${BACKUP_NAME}.sql" 2>/dev/null || {
    echo -e "${RED}❌ Database backup failed${NC}"
    echo -e "${YELLOW}💡 Please check your database connection and credentials${NC}"
    exit 1
}

echo -e "${GREEN}✅ Database dump created${NC}"

# Create backup metadata
echo -e "${YELLOW}📋 Creating backup metadata...${NC}"

cat > "${BACKUP_DIR}/${BACKUP_NAME}-info.txt" << EOF
TrenderAI Database Backup
========================

Backup Date: $(date)
Backup Timestamp: ${TIMESTAMP}
Backup Type: PostgreSQL Database Backup
File: ${BACKUP_NAME}.sql

Database Info:
- Host: ${DB_HOST}
- Port: ${DB_PORT:-5432}
- Database: ${DB_NAME}
- User: ${DB_USER}

Backup Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}.sql" | cut -f1)

Tables Included:
- TrendRecord (main trends data)
- content_items (NYTimes data)
- twitter_authors, twitter_tweets, normalized_content (Twitter data)
- nyt_concept_cache (NYTimes semantic cache)
- ingestion_cursors (data ingestion tracking)

System Info:
- OS: $(uname -s)
- Architecture: $(uname -m)
- PostgreSQL Client: $(pg_dump --version 2>/dev/null || echo "Not available")

EOF

echo -e "${GREEN}✅ Backup metadata created${NC}"

# Cleanup old database backups (keep last 5)
echo -e "${YELLOW}🧹 Cleaning up old database backups...${NC}"

# Keep only the last 5 database backups
ls -t trenderai-db-backup-*.sql 2>/dev/null | tail -n +6 | xargs -r rm -f
ls -t trenderai-db-backup-*-info.txt 2>/dev/null | tail -n +6 | xargs -r rm -f

echo -e "${GREEN}✅ Old database backups cleaned up${NC}"

# Final summary
echo ""
echo -e "${GREEN}🎉 Database backup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Backup Summary:${NC}"
echo -e "  📁 Location: ${BACKUP_DIR}/${BACKUP_NAME}.sql"
echo -e "  📏 Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}.sql" | cut -f1)"
echo -e "  📅 Date: $(date)"
echo ""
echo -e "${BLUE}📋 Backup Contents:${NC}"
echo -e "  ✅ All database tables and data"
echo -e "  ✅ Schema definitions"
echo -e "  ✅ Indexes and constraints"
echo -e "  ✅ Clean format for easy restoration"
echo ""
echo -e "${YELLOW}💡 To restore from this backup:${NC}"
echo -e "  1. Create a new database (if needed)"
echo -e "  2. Restore: psql -h ${DB_HOST} -p ${DB_PORT:-5432} -U ${DB_USER} -d ${DB_NAME} < ${BACKUP_NAME}.sql"
echo -e "  3. Or use: PGPASSWORD='your_password' psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} < ${BACKUP_NAME}.sql"
echo ""
echo -e "${GREEN}✨ Database backup process completed!${NC}"
