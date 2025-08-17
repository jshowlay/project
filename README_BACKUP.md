# TrenderAI Backup System

This document describes the backup system for the TrenderAI application.

## Overview

The backup system provides comprehensive backup solutions for both code and database, ensuring your application can be fully restored in case of any issues.

## Backup Scripts

### 1. Simple Code Backup (`scripts/backup-simple.sh`)
- **Purpose**: Creates a complete backup of the application code
- **Size**: ~11MB compressed
- **Contents**: All source code, configuration files, and documentation
- **Excludes**: `node_modules`, `.next`, `.git`, and other build artifacts

### 2. Database Backup (`scripts/backup-database.sh`)
- **Purpose**: Creates a PostgreSQL database dump
- **Requirements**: `DATABASE_URL` environment variable must be set
- **Contents**: All database tables, schema, and data
- **Format**: SQL dump file

### 3. Complete Backup (`scripts/backup-all.sh`)
- **Purpose**: Creates both code and database backups in one command
- **Requirements**: `DATABASE_URL` environment variable for database backup
- **Output**: Separate code and database backup files

## Running Backups

### Code Backup Only
```bash
./scripts/backup-simple.sh
```

### Database Backup Only
```bash
# Set DATABASE_URL first
export DATABASE_URL="your_database_url"
./scripts/backup-database.sh
```

### Complete Backup
```bash
./scripts/backup-all.sh
```

## Backup Location

All backups are stored in the `backups/` directory with the following naming convention:
- Code backups: `trenderai-backup-YYYYMMDD_HHMMSS.tar.gz`
- Database backups: `trenderai-db-backup-YYYYMMDD_HHMMSS.sql`
- Metadata files: `trenderai-backup-YYYYMMDD_HHMMSS-info.txt`

## Backup Contents

### Code Backup Includes:
- ✅ Complete source code (TypeScript, JavaScript, React components)
- ✅ Configuration files (Next.js, Tailwind, TypeScript, etc.)
- ✅ Prisma schema and migrations
- ✅ Package dependencies (`package.json`, `pnpm-lock.yaml`)
- ✅ All integrations (Instagram, NYTimes, Twitter, etc.)
- ✅ Image optimization system
- ✅ Scripts and documentation
- ✅ Environment templates (`.env.example`)

### Code Backup Excludes:
- ❌ `node_modules` (can be reinstalled)
- ❌ `.next` (build artifacts)
- ❌ `.git` (version control)
- ❌ Environment files (`.env.local`, `.env.production`)
- ❌ Build outputs (`dist`, `build`, `coverage`)
- ❌ Cache directories
- ❌ Previous backups

### Database Backup Includes:
- ✅ All database tables and data
- ✅ Schema definitions
- ✅ Indexes and constraints
- ✅ Clean format for easy restoration

## Restoring from Backup

### Code Restoration
```bash
# 1. Extract the backup
tar -xzf trenderai-backup-YYYYMMDD_HHMMSS.tar.gz

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# 4. Run database migrations
pnpm prisma migrate deploy

# 5. Start the server
pnpm dev
```

### Database Restoration
```bash
# 1. Create a new database (if needed)
createdb your_database_name

# 2. Restore from backup
psql -h your_host -p your_port -U your_user -d your_database < trenderai-db-backup-YYYYMMDD_HHMMSS.sql

# Or with password
PGPASSWORD='your_password' psql -h your_host -U your_user -d your_database < trenderai-db-backup-YYYYMMDD_HHMMSS.sql
```

## Backup Management

### Automatic Cleanup
The backup scripts automatically keep only the last 5 backups of each type to prevent disk space issues.

### Manual Cleanup
```bash
# List all backups
ls -la backups/

# Remove old backups manually
rm backups/trenderai-backup-OLD_TIMESTAMP.tar.gz
rm backups/trenderai-db-backup-OLD_TIMESTAMP.sql
```

## Backup Metadata

Each backup includes a metadata file with:
- Backup date and timestamp
- System information
- Git status
- Database information
- Application features
- File sizes
- Restoration instructions

## Security Considerations

- **Environment Variables**: Sensitive environment files (`.env.local`, `.env.production`) are excluded from backups
- **Database Credentials**: Database backups may contain sensitive data - store securely
- **Access Control**: Ensure backup files are stored in a secure location with appropriate access controls

## Troubleshooting

### Common Issues

1. **"DATABASE_URL not set"**
   - Solution: Set the `DATABASE_URL` environment variable before running database backups

2. **"Database backup failed"**
   - Check database connectivity
   - Verify credentials in `DATABASE_URL`
   - Ensure PostgreSQL client tools are installed

3. **"Permission denied"**
   - Make scripts executable: `chmod +x scripts/backup-*.sh`

4. **"Backup too large"**
   - Check if large files are being included unnecessarily
   - Verify exclusions are working properly

### Getting Help

If you encounter issues with the backup system:
1. Check the backup metadata file for system information
2. Verify all required tools are installed (tar, pg_dump, etc.)
3. Test database connectivity separately
4. Review the backup script output for specific error messages

## Best Practices

1. **Regular Backups**: Run backups regularly (daily/weekly)
2. **Test Restoration**: Periodically test backup restoration
3. **Multiple Locations**: Store backups in multiple locations
4. **Version Control**: Use Git for code version control alongside backups
5. **Documentation**: Keep backup metadata for reference

## Integration with CI/CD

The backup scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Create Backup
  run: |
    chmod +x scripts/backup-simple.sh
    ./scripts/backup-simple.sh
```

This ensures your application is backed up automatically as part of your deployment process.
