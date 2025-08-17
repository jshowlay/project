#!/bin/bash

# TrenderAI Full Backup Script
# This script creates a comprehensive backup of the entire application

set -e  # Exit on any error

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="trenderai-full-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting TrenderAI Full Backup...${NC}"
echo -e "${BLUE}📅 Timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}📁 Backup Path: ${BACKUP_PATH}${NC}"
echo ""

# Create backup directory
mkdir -p "${BACKUP_PATH}"
mkdir -p "${BACKUP_PATH}/code"
mkdir -p "${BACKUP_PATH}/database"
mkdir -p "${BACKUP_PATH}/config"
mkdir -p "${BACKUP_PATH}/logs"

echo -e "${GREEN}✅ Created backup directory structure${NC}"

# 1. Backup Code (excluding node_modules and other unnecessary files)
echo -e "${YELLOW}📦 Backing up source code...${NC}"

# Create a temporary file list for rsync
cat > /tmp/backup-include.txt << EOF
+ */
+ *.ts
+ *.tsx
+ *.js
+ *.jsx
+ *.json
+ *.md
+ *.sql
+ *.sh
+ *.yml
+ *.yaml
+ *.toml
+ *.env*
+ *.config.*
+ *.css
+ *.scss
+ *.html
+ *.txt
+ *.lock
+ *.log
- node_modules/
- .next/
- .git/
- dist/
- build/
- coverage/
- .nyc_output/
- .cache/
- .parcel-cache/
- .turbo/
- .vercel/
- .env.local
- .env.production
- .env.development
- *.tar.gz
- *.zip
- backups/
- logs/
- tmp/
- temp/
EOF

rsync -av --files-from=/tmp/backup-include.txt . "${BACKUP_PATH}/code/" > /dev/null 2>&1 || {
    echo -e "${RED}❌ Code backup failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Source code backed up${NC}"

# 2. Backup Database
echo -e "${YELLOW}🗄️  Backing up database...${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set, skipping database backup${NC}"
else
    # Extract database info from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ]; then
        # Create database dump
        PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \
            --no-password --verbose --clean --no-owner --no-privileges \
            > "${BACKUP_PATH}/database/dump.sql" 2>/dev/null || {
            echo -e "${RED}❌ Database backup failed${NC}"
        }
        
        if [ -f "${BACKUP_PATH}/database/dump.sql" ]; then
            echo -e "${GREEN}✅ Database backup completed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not parse DATABASE_URL, skipping database backup${NC}"
    fi
fi

# 3. Backup Configuration
echo -e "${YELLOW}⚙️  Backing up configuration...${NC}"

# Copy environment files (excluding sensitive ones)
cp .env.example "${BACKUP_PATH}/config/" 2>/dev/null || echo -e "${YELLOW}⚠️  .env.example not found${NC}"
cp next.config.js "${BACKUP_PATH}/config/" 2>/dev/null || echo -e "${YELLOW}⚠️  next.config.js not found${NC}"
cp tailwind.config.ts "${BACKUP_PATH}/config/" 2>/dev/null || echo -e "${YELLOW}⚠️  tailwind.config.ts not found${NC}"
cp postcss.config.js "${BACKUP_PATH}/config/" 2>/dev/null || echo -e "${YELLOW}⚠️  postcss.config.js not found${NC}"
cp tsconfig.json "${BACKUP_PATH}/config/" 2>/dev/null || echo -e "${YELLOW}⚠️  tsconfig.json not found${NC}"
cp package.json "${BACKUP_PATH}/config/" 2>/dev/null || echo -e "${YELLOW}⚠️  package.json not found${NC}"
cp pnpm-lock.yaml "${BACKUP_PATH}/config/" 2>/dev/null || echo -e "${YELLOW}⚠️  pnpm-lock.yaml not found${NC}"

# Copy Prisma schema
cp -r prisma "${BACKUP_PATH}/config/" 2>/dev/null || echo -e "${YELLOW}⚠️  prisma directory not found${NC}"

echo -e "${GREEN}✅ Configuration backed up${NC}"

# 4. Create backup metadata
echo -e "${YELLOW}📋 Creating backup metadata...${NC}"

cat > "${BACKUP_PATH}/backup-info.txt" << EOF
TrenderAI Full Backup
====================

Backup Date: $(date)
Backup Timestamp: ${TIMESTAMP}
Backup Type: Full Application Backup

Contents:
- Source code (excluding node_modules, .next, etc.)
- Database dump (if DATABASE_URL available)
- Configuration files
- Prisma schema
- Package dependencies

Backup Size: $(du -sh "${BACKUP_PATH}" | cut -f1)

System Info:
- OS: $(uname -s)
- Architecture: $(uname -m)
- Node Version: $(node --version 2>/dev/null || echo "Not available")
- NPM Version: $(npm --version 2>/dev/null || echo "Not available")
- PNPM Version: $(pnpm --version 2>/dev/null || echo "Not available")

Git Info:
- Branch: $(git branch --show-current 2>/dev/null || echo "Not available")
- Commit: $(git rev-parse HEAD 2>/dev/null || echo "Not available")
- Status: $(git status --porcelain 2>/dev/null | wc -l | xargs echo "Modified files:")

Database Info:
- DATABASE_URL: ${DATABASE_URL:+Set}${DATABASE_URL:-Not set}
- Database Host: ${DB_HOST:-Not available}
- Database Name: ${DB_NAME:-Not available}

EOF

echo -e "${GREEN}✅ Backup metadata created${NC}"

# 5. Create compressed archive
echo -e "${YELLOW}🗜️  Creating compressed archive...${NC}"

cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}" 2>/dev/null || {
    echo -e "${RED}❌ Archive creation failed${NC}"
    exit 1
}

# Remove uncompressed directory
rm -rf "${BACKUP_NAME}"

echo -e "${GREEN}✅ Compressed archive created: ${BACKUP_NAME}.tar.gz${NC}"

# 6. Cleanup old backups (keep last 5)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"

# Keep only the last 5 backups
ls -t trenderai-full-backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f

echo -e "${GREEN}✅ Old backups cleaned up${NC}"

# 7. Final summary
echo ""
echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Backup Summary:${NC}"
echo -e "  📁 Location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo -e "  📏 Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)"
echo -e "  📅 Date: $(date)"
echo ""
echo -e "${BLUE}📋 Backup Contents:${NC}"
echo -e "  ✅ Source code (excluding node_modules, .next, etc.)"
echo -e "  ✅ Configuration files"
echo -e "  ✅ Prisma schema"
echo -e "  ✅ Package dependencies"
if [ -f "${BACKUP_PATH}/database/dump.sql" ]; then
    echo -e "  ✅ Database dump"
else
    echo -e "  ⚠️  Database dump (skipped - DATABASE_URL not available)"
fi
echo ""
echo -e "${YELLOW}💡 To restore from this backup:${NC}"
echo -e "  1. Extract: tar -xzf ${BACKUP_NAME}.tar.gz"
echo -e "  2. Install dependencies: pnpm install"
echo -e "  3. Restore database: psql -d your_db < database/dump.sql"
echo -e "  4. Set up environment variables"
echo -e "  5. Run migrations: pnpm prisma migrate deploy"
echo ""

# Cleanup temporary files
rm -f /tmp/backup-include.txt

echo -e "${GREEN}✨ Backup process completed!${NC}"
