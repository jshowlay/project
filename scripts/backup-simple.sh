#!/bin/bash

# TrenderAI Simple Backup Script
# This script creates a comprehensive backup of the entire application using tar

set -e  # Exit on any error

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="trenderai-backup-${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting TrenderAI Backup...${NC}"
echo -e "${BLUE}📅 Timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}📁 Backup Name: ${BACKUP_NAME}.tar.gz${NC}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${GREEN}✅ Backup directory ready${NC}"

# Create the backup archive
echo -e "${YELLOW}📦 Creating backup archive...${NC}"

# Use tar to create a compressed archive, excluding unnecessary files
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
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
    . 2>/dev/null || {
    echo -e "${RED}❌ Backup creation failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Backup archive created${NC}"

# Create backup metadata
echo -e "${YELLOW}📋 Creating backup metadata...${NC}"

cat > "${BACKUP_DIR}/${BACKUP_NAME}-info.txt" << EOF
TrenderAI Backup
===============

Backup Date: $(date)
Backup Timestamp: ${TIMESTAMP}
Backup Type: Full Application Backup
Archive: ${BACKUP_NAME}.tar.gz

Contents:
- Source code (excluding node_modules, .next, etc.)
- Configuration files
- Prisma schema
- Package dependencies
- Scripts and documentation

Backup Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)

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

# Cleanup old backups (keep last 5)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"

# Keep only the last 5 backups
ls -t trenderai-backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
ls -t trenderai-backup-*-info.txt 2>/dev/null | tail -n +6 | xargs -r rm -f

echo -e "${GREEN}✅ Old backups cleaned up${NC}"

# Final summary
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
echo -e "  ✅ Scripts and documentation"
echo -e "  ✅ All integrations (Instagram, NYTimes, Twitter, etc.)"
echo -e "  ✅ Image optimization system"
echo ""
echo -e "${YELLOW}💡 To restore from this backup:${NC}"
echo -e "  1. Extract: tar -xzf ${BACKUP_NAME}.tar.gz"
echo -e "  2. Install dependencies: pnpm install"
echo -e "  3. Set up environment variables"
echo -e "  4. Run migrations: pnpm prisma migrate deploy"
echo -e "  5. Start the server: pnpm dev"
echo ""
echo -e "${GREEN}✨ Backup process completed!${NC}"
