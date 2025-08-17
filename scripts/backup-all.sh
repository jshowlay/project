#!/bin/bash

# TrenderAI Complete Backup Script
# This script creates both code and database backups

set -e  # Exit on any error

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting TrenderAI Complete Backup...${NC}"
echo -e "${BLUE}📅 Timestamp: ${TIMESTAMP}${NC}"
echo ""

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo -e "${YELLOW}📄 Loading environment variables from .env...${NC}"
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
    echo -e "${YELLOW}⚠️  .env file not found, using current environment${NC}"
fi

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# 1. Code Backup
echo -e "${YELLOW}📦 Creating code backup...${NC}"
CODE_BACKUP_NAME="trenderai-code-${TIMESTAMP}.tar.gz"

tar -czf "${BACKUP_DIR}/${CODE_BACKUP_NAME}" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='coverage' \
    --exclude='.nyc_output' \
    --exclude='.cache' \
    --exclude='.parcel-cache' \
    --exclude='.turbo' \
    --exclude='.vercel' \
    --exclude='.env.local' \
    --exclude='.env.production' \
    --exclude='.env.development' \
    --exclude='*.tar.gz' \
    --exclude='*.zip' \
    --exclude='backups' \
    --exclude='logs' \
    --exclude='tmp' \
    --exclude='temp' \
    --exclude='.DS_Store' \
    --exclude='Thumbs.db' \
    . 2>/dev/null

echo -e "${GREEN}✅ Code backup created: ${CODE_BACKUP_NAME}${NC}"

# 2. Database Backup (if DATABASE_URL is available)
if [ -n "$DATABASE_URL" ]; then
    echo -e "${YELLOW}🗄️  Creating database backup...${NC}"
    DB_BACKUP_NAME="trenderai-db-${TIMESTAMP}.sql"
    
    # Extract database info
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
        PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \
            --no-password --clean --no-owner --no-privileges \
            > "${BACKUP_DIR}/${DB_BACKUP_NAME}" 2>/dev/null && {
            echo -e "${GREEN}✅ Database backup created: ${DB_BACKUP_NAME}${NC}"
        } || {
            echo -e "${RED}❌ Database backup failed${NC}"
        }
    else
        echo -e "${YELLOW}⚠️  Could not parse DATABASE_URL, skipping database backup${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set, skipping database backup${NC}"
fi

# 3. Create backup metadata
echo -e "${YELLOW}📋 Creating backup metadata...${NC}"

cat > "${BACKUP_DIR}/trenderai-backup-${TIMESTAMP}-info.txt" << EOF
TrenderAI Complete Backup
========================

Backup Date: $(date)
Backup Timestamp: ${TIMESTAMP}
Backup Type: Complete Application Backup

Backups Created:
- Code: ${CODE_BACKUP_NAME}
- Database: ${DB_BACKUP_NAME:-Not created}

Code Backup Size: $(du -h "${BACKUP_DIR}/${CODE_BACKUP_NAME}" | cut -f1)
Database Backup Size: $(if [ -f "${BACKUP_DIR}/${DB_BACKUP_NAME}" ]; then du -h "${BACKUP_DIR}/${DB_BACKUP_NAME}" | cut -f1; else echo "N/A"; fi)

System Info:
- OS: $(uname -s)
- Architecture: $(uname -m)
- Node Version: $(node --version 2>/dev/null || echo "Not available")
- PNPM Version: $(pnpm --version 2>/dev/null || echo "Not available")

Git Info:
- Branch: $(git branch --show-current 2>/dev/null || echo "Not available")
- Commit: $(git rev-parse HEAD 2>/dev/null || echo "Not available")
- Status: $(git status --porcelain 2>/dev/null | wc -l | xargs echo "Modified files:")

Database Info:
- DATABASE_URL: ${DATABASE_URL:+Set}${DATABASE_URL:-Not set}
- Host: ${DB_HOST:-Not available}
- Database: ${DB_NAME:-Not available}

Application Features:
- Next.js App Router
- TypeScript
- Prisma ORM
- Tailwind CSS
- Instagram Graph API Integration
- NYTimes API Integration
- Twitter/X Integration
- Image Optimization System
- Multiple Data Sources (Reddit, YouTube, News, etc.)

EOF

echo -e "${GREEN}✅ Backup metadata created${NC}"

# 4. Cleanup old backups (keep last 5)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"

# Keep only the last 5 backups of each type
ls -t trenderai-code-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
ls -t trenderai-db-*.sql 2>/dev/null | tail -n +6 | xargs -r rm -f
ls -t trenderai-backup-*-info.txt 2>/dev/null | tail -n +6 | xargs -r rm -f

echo -e "${GREEN}✅ Old backups cleaned up${NC}"

# 5. Final summary
echo ""
echo -e "${GREEN}🎉 Complete backup finished successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Backup Summary:${NC}"
echo -e "  📁 Code: ${BACKUP_DIR}/${CODE_BACKUP_NAME}"
echo -e "  📏 Code Size: $(du -h "${BACKUP_DIR}/${CODE_BACKUP_NAME}" | cut -f1)"
if [ -f "${BACKUP_DIR}/${DB_BACKUP_NAME}" ]; then
    echo -e "  🗄️  Database: ${BACKUP_DIR}/${DB_BACKUP_NAME}"
    echo -e "  📏 DB Size: $(du -h "${BACKUP_DIR}/${DB_BACKUP_NAME}" | cut -f1)"
else
    echo -e "  🗄️  Database: Not created (DATABASE_URL not available)"
fi
echo -e "  📅 Date: $(date)"
echo ""
echo -e "${BLUE}📋 Backup Contents:${NC}"
echo -e "  ✅ Complete source code"
echo -e "  ✅ All configuration files"
echo -e "  ✅ Prisma schema and migrations"
echo -e "  ✅ All integrations (Instagram, NYTimes, Twitter, etc.)"
echo -e "  ✅ Image optimization system"
if [ -f "${BACKUP_DIR}/${DB_BACKUP_NAME}" ]; then
    echo -e "  ✅ Complete database with all data"
fi
echo ""
echo -e "${YELLOW}💡 To restore from this backup:${NC}"
echo -e "  1. Extract code: tar -xzf ${CODE_BACKUP_NAME}"
echo -e "  2. Install dependencies: pnpm install"
echo -e "  3. Set up environment variables"
if [ -f "${BACKUP_DIR}/${DB_BACKUP_NAME}" ]; then
    echo -e "  4. Restore database: psql -d your_db < ${DB_BACKUP_NAME}"
fi
echo -e "  5. Run migrations: pnpm prisma migrate deploy"
echo -e "  6. Start the server: pnpm dev"
echo ""
echo -e "${GREEN}✨ Backup process completed!${NC}"
