# TrenderAI Backup System

A comprehensive, cross-platform backup system for the TrenderAI project that creates timestamped archives of your code, environment files, database dumps, and system metadata.

## Features

- **Cross-platform compatibility**: Works on macOS, Linux, and Windows
- **Code archiving**: Creates compressed archives excluding heavy/derived folders
- **Environment capture**: Safely copies `.env` files and configuration
- **Database dumps**: Supports PostgreSQL, MySQL, and SQLite
- **Git metadata**: Captures commit history, branch info, and repository status
- **System information**: Records Node.js, npm, pnpm, and Python versions
- **Automatic cleanup**: Keeps only the 10 most recent backups
- **Colored output**: Clear, informative logging with color-coded messages

## Usage

### Quick Start (Recommended)

```bash
# Using Node.js (works on all platforms)
npm run backup

# Using bash script (macOS/Linux)
npm run backup:bash

# Using batch script (Windows)
npm run backup:win
```

### Manual Execution

```bash
# Node.js version (most reliable)
node scripts/backup.js

# Bash version (macOS/Linux)
./scripts/backup.sh

# Windows batch version
scripts\backup.bat
```

## Output

The backup system creates two timestamped archives in the `./backups` directory:

### 1. Code Archive: `<project>-<timestamp>.code.zip`
Contains all project source code with exclusions:
- ✅ Source code (`src/`, `app/`, `api/`, `workers/`)
- ✅ Configuration files (`package.json`, `tsconfig.json`, etc.)
- ✅ Database schemas (`prisma/`)
- ✅ Documentation and README files
- ❌ `node_modules/` (can be reinstalled)
- ❌ `.next/` (build output)
- ❌ `.git/` (version control)
- ❌ Log files and temporary files

### 2. Metadata Archive: `<project>-<timestamp>.meta.zip`
Contains environment and system information:
- **Environment files**: `.env`, `.env.example`, `.env.backup`, `.env.sqlite`
- **Database dumps**: PostgreSQL, MySQL, or SQLite backups
- **Git information**: Current branch, latest commit, repository status
- **System info**: Node.js, npm, pnpm, Python versions, disk space

## Database Support

### PostgreSQL
- Detects `DATABASE_URL` or `POSTGRES_URL` environment variables
- Uses `pg_dump` to create SQL dumps
- Automatically parses connection strings

### MySQL
- Detects `MYSQL_HOST`, `MYSQL_URL`, or related environment variables
- Uses `mysqldump` to create SQL dumps
- Supports all standard MySQL connection parameters

### SQLite
- Automatically copies `prisma/trender.db` if present
- No additional configuration required

## Environment Variables

The backup system automatically loads environment variables from:
- `.env` file in the project root
- System environment variables
- Database connection strings

## Requirements

### Node.js Version
- **Required**: Node.js 14+ (for the Node.js backup script)
- **Dependencies**: `archiver` package (installed automatically)

### Database Tools (Optional)
- **PostgreSQL**: `pg_dump` command-line tool
- **MySQL**: `mysqldump` command-line tool
- **SQLite**: No additional tools required

### Git (Optional)
- Git information is captured if the project is a git repository
- Works without git, but provides less metadata

## Configuration

### Customizing Exclusions
Edit the `excludePatterns` array in `scripts/backup.js`:

```javascript
const excludePatterns = [
    'node_modules',
    '.next',
    '.git',
    // Add your custom exclusions here
    'custom-folder',
    '*.temp'
];
```

### Backup Retention
The system automatically keeps the 10 most recent backups. To change this:

1. **Node.js version**: Edit the `cleanupOldBackups()` function in `scripts/backup.js`
2. **Bash version**: Edit the `cleanup_old_backups()` function in `scripts/backup.sh`
3. **Windows version**: Edit the cleanup section in `scripts/backup.bat`

### Backup Location
Change the backup directory by modifying the `BACKUP_DIR` constant in any of the scripts.

## Troubleshooting

### Common Issues

**"pg_dump not found"**
- Install PostgreSQL client tools
- On macOS: `brew install postgresql`
- On Ubuntu: `sudo apt-get install postgresql-client`

**"mysqldump not found"**
- Install MySQL client tools
- On macOS: `brew install mysql-client`
- On Ubuntu: `sudo apt-get install mysql-client`

**"Permission denied"**
- Make scripts executable: `chmod +x scripts/backup.sh`
- Run with appropriate permissions

**"Archive creation failed"**
- Check available disk space
- Ensure write permissions to backup directory
- Verify Node.js and archiver package are installed

### Log Levels
The backup system provides colored output:
- 🔵 **INFO**: General information and progress
- 🟢 **SUCCESS**: Successful operations
- 🟡 **WARNING**: Non-critical issues (continues execution)
- 🔴 **ERROR**: Critical failures (stops execution)

## Examples

### Basic Backup
```bash
npm run backup
```

### Backup with Database Dump
```bash
# Ensure your .env file has DATABASE_URL set
npm run backup
```

### Backup on Windows
```bash
npm run backup:win
```

### Backup on macOS/Linux
```bash
npm run backup:bash
```

## Integration

### CI/CD Integration
Add to your deployment pipeline:

```yaml
# GitHub Actions example
- name: Create backup
  run: npm run backup
- name: Upload backup artifacts
  uses: actions/upload-artifact@v3
  with:
    name: project-backup
    path: backups/
```

### Scheduled Backups
Use cron (Linux/macOS) or Task Scheduler (Windows) to run automated backups:

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup
```

## Security Notes

- Environment files are included in metadata archives
- Database dumps may contain sensitive data
- Store backups securely and restrict access
- Consider encrypting backup archives for sensitive projects
- Regularly rotate backup credentials

## Support

For issues or questions about the backup system:
1. Check the troubleshooting section above
2. Review the script logs for specific error messages
3. Ensure all dependencies are properly installed
4. Verify file permissions and disk space
