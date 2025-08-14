#!/bin/bash

# TrenderAI Backup System
# Cross-platform backup script for project code, env files, and database dumps

set -euo pipefail

# Configuration
PROJECT_NAME="trenderai"
BACKUP_DIR="./backups"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS and set appropriate commands
detect_platform() {
    case "$(uname -s)" in
        Darwin*)    PLATFORM="macos";;
        Linux*)     PLATFORM="linux";;
        CYGWIN*|MINGW*|MSYS*) PLATFORM="windows";;
        *)          PLATFORM="unknown";;
    esac
    
    log_info "Detected platform: $PLATFORM"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    log_info "Backup directory: $BACKUP_DIR"
}

# Archive project code
archive_code() {
    local code_archive="$BACKUP_DIR/${PROJECT_NAME}-${TIMESTAMP}.code.tar.gz"
    
    log_info "Creating code archive..."
    
    # Exclude patterns for code backup
    local exclude_patterns=(
        "--exclude=node_modules"
        "--exclude=.next"
        "--exclude=.git"
        "--exclude=*.log"
        "--exclude=.DS_Store"
        "--exclude=*.tmp"
        "--exclude=*.cache"
        "--exclude=dist"
        "--exclude=build"
        "--exclude=coverage"
        "--exclude=.nyc_output"
        "--exclude=.env.local"
        "--exclude=.env.production"
        "--exclude=.env.development"
        "--exclude=*.tar.gz"
        "--exclude=*.zip"
        "--exclude=backups"
        "--exclude=project_backup_*"
    )
    
    if tar -czf "$code_archive" "${exclude_patterns[@]}" -C "$PROJECT_ROOT" .; then
        log_success "Code archive created: $code_archive"
        echo "$code_archive"
    else
        log_error "Failed to create code archive"
        return 1
    fi
}

# Create metadata bundle
create_metadata_bundle() {
    local meta_dir="$BACKUP_DIR/${PROJECT_NAME}-${TIMESTAMP}.meta"
    local meta_archive="$BACKUP_DIR/${PROJECT_NAME}-${TIMESTAMP}.meta.tar.gz"
    
    log_info "Creating metadata bundle..."
    
    # Create temporary metadata directory
    mkdir -p "$meta_dir"
    
    # Copy environment files
    copy_env_files "$meta_dir"
    
    # Dump database
    dump_database "$meta_dir"
    
    # Capture git information
    capture_git_info "$meta_dir"
    
    # Capture system information
    capture_system_info "$meta_dir"
    
    # Create metadata archive
    if tar -czf "$meta_archive" -C "$BACKUP_DIR" "$(basename "$meta_dir")"; then
        log_success "Metadata archive created: $meta_archive"
        rm -rf "$meta_dir"
        echo "$meta_archive"
    else
        log_error "Failed to create metadata archive"
        rm -rf "$meta_dir"
        return 1
    fi
}

# Copy environment files
copy_env_files() {
    local meta_dir="$1"
    local env_dir="$meta_dir/env"
    
    mkdir -p "$env_dir"
    
    log_info "Copying environment files..."
    
    # Copy .env files (excluding sensitive ones)
    for env_file in .env .env.example .env.backup .env.sqlite; do
        if [[ -f "$PROJECT_ROOT/$env_file" ]]; then
            cp "$PROJECT_ROOT/$env_file" "$env_dir/"
            log_info "Copied: $env_file"
        fi
    done
    
    # Create env summary
    cat > "$env_dir/env_summary.txt" << EOF
Environment Files Summary
=========================
Generated: $(date -u)
Project: $PROJECT_NAME

Available environment files:
EOF
    
    for env_file in "$env_dir"/*.env*; do
        if [[ -f "$env_file" ]]; then
            echo "- $(basename "$env_file")" >> "$env_dir/env_summary.txt"
        fi
    done
}

# Dump database based on detected type
dump_database() {
    local meta_dir="$1"
    local db_dir="$meta_dir/database"
    
    mkdir -p "$db_dir"
    
    log_info "Attempting database dump..."
    
    # Try to load environment variables (more robust parsing)
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        while IFS= read -r line; do
            # Skip comments and empty lines
            if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
                # Extract key=value pairs
                if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
                    export "${BASH_REMATCH[1]}"="${BASH_REMATCH[2]}"
                fi
            fi
        done < "$PROJECT_ROOT/.env"
    fi
    
    # PostgreSQL dump
    if [[ -n "${DATABASE_URL:-}" ]] && [[ "$DATABASE_URL" == postgresql://* ]]; then
        dump_postgresql "$db_dir"
    elif [[ -n "${POSTGRES_URL:-}" ]] && [[ "$POSTGRES_URL" == postgresql://* ]]; then
        export DATABASE_URL="$POSTGRES_URL"
        dump_postgresql "$db_dir"
    fi
    
    # MySQL dump
    if [[ -n "${MYSQL_HOST:-}" ]] || [[ -n "${MYSQL_URL:-}" ]]; then
        dump_mysql "$db_dir"
    fi
    
    # SQLite dump
    if [[ -f "$PROJECT_ROOT/prisma/trender.db" ]]; then
        dump_sqlite "$db_dir"
    fi
    
    # Create database summary
    cat > "$db_dir/database_summary.txt" << EOF
Database Dump Summary
====================
Generated: $(date -u)
Project: $PROJECT_NAME

Database connection info:
- DATABASE_URL: ${DATABASE_URL:-"not set"}
- POSTGRES_URL: ${POSTGRES_URL:-"not set"}
- MYSQL_HOST: ${MYSQL_HOST:-"not set"}
- MYSQL_URL: ${MYSQL_URL:-"not set"}

Available dumps:
EOF
    
    for dump_file in "$db_dir"/*.sql "$db_dir"/*.db; do
        if [[ -f "$dump_file" ]]; then
            echo "- $(basename "$dump_file")" >> "$db_dir/database_summary.txt"
        fi
    done
}

# PostgreSQL dump
dump_postgresql() {
    local db_dir="$1"
    
    log_info "Attempting PostgreSQL dump..."
    
    if command -v pg_dump >/dev/null 2>&1; then
        # Extract connection details from DATABASE_URL
        local db_url="${DATABASE_URL}"
        local db_host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        local db_port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        local db_user=$(echo "$db_url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        local db_pass=$(echo "$db_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        
        # Set password environment variable
        export PGPASSWORD="$db_pass"
        
        local dump_file="$db_dir/postgresql_dump.sql"
        
        if pg_dump -h "$db_host" -p "${db_port:-5432}" -U "$db_user" -d "$db_name" --no-password > "$dump_file" 2>/dev/null; then
            log_success "PostgreSQL dump created: $(basename "$dump_file")"
        else
            log_warning "PostgreSQL dump failed"
            rm -f "$dump_file"
        fi
        
        unset PGPASSWORD
    else
        log_warning "pg_dump not found, skipping PostgreSQL dump"
    fi
}

# MySQL dump
dump_mysql() {
    local db_dir="$1"
    
    log_info "Attempting MySQL dump..."
    
    if command -v mysqldump >/dev/null 2>&1; then
        local db_host="${MYSQL_HOST:-localhost}"
        local db_port="${MYSQL_PORT:-3306}"
        local db_user="${MYSQL_USER:-root}"
        local db_pass="${MYSQL_PASSWORD:-}"
        local db_name="${MYSQL_DATABASE:-}"
        
        local dump_file="$db_dir/mysql_dump.sql"
        
        if [[ -n "$db_pass" ]]; then
            export MYSQL_PWD="$db_pass"
        fi
        
        if mysqldump -h "$db_host" -P "$db_port" -u "$db_user" "$db_name" > "$dump_file" 2>/dev/null; then
            log_success "MySQL dump created: $(basename "$dump_file")"
        else
            log_warning "MySQL dump failed"
            rm -f "$dump_file"
        fi
        
        unset MYSQL_PWD
    else
        log_warning "mysqldump not found, skipping MySQL dump"
    fi
}

# SQLite dump
dump_sqlite() {
    local db_dir="$1"
    local sqlite_file="$PROJECT_ROOT/prisma/trender.db"
    
    log_info "Attempting SQLite dump..."
    
    if [[ -f "$sqlite_file" ]]; then
        local dump_file="$db_dir/sqlite_dump.db"
        
        if cp "$sqlite_file" "$dump_file"; then
            log_success "SQLite database copied: $(basename "$dump_file")"
        else
            log_warning "SQLite database copy failed"
        fi
    else
        log_warning "SQLite database not found"
    fi
}

# Capture git information
capture_git_info() {
    local meta_dir="$1"
    local git_dir="$meta_dir/git"
    
    mkdir -p "$git_dir"
    
    log_info "Capturing git information..."
    
    if [[ -d "$PROJECT_ROOT/.git" ]]; then
        cd "$PROJECT_ROOT"
        
        # Current branch (compatible with older git versions)
        if ! git branch --show-current > "$git_dir/current_branch.txt" 2>/dev/null; then
            git rev-parse --abbrev-ref HEAD > "$git_dir/current_branch.txt" 2>/dev/null || echo "unknown" > "$git_dir/current_branch.txt"
        fi
        
        # Latest commit
        git log -1 --pretty=format:"%H%n%an%n%ae%n%ad%n%s" > "$git_dir/latest_commit.txt" 2>/dev/null || echo "no commits" > "$git_dir/latest_commit.txt"
        
        # Git status
        git status --porcelain > "$git_dir/git_status.txt" 2>/dev/null || echo "no status" > "$git_dir/git_status.txt"
        
        # Git log (last 10 commits)
        git log --oneline -10 > "$git_dir/recent_commits.txt" 2>/dev/null || echo "no recent commits" > "$git_dir/recent_commits.txt"
        
        # Remote information
        git remote -v > "$git_dir/remotes.txt" 2>/dev/null || echo "no remotes" > "$git_dir/remotes.txt"
        
        log_success "Git information captured"
    else
        log_warning "Not a git repository"
        echo "not a git repository" > "$git_dir/git_info.txt"
    fi
}

# Capture system information
capture_system_info() {
    local meta_dir="$1"
    local sys_dir="$meta_dir/system"
    
    mkdir -p "$sys_dir"
    
    log_info "Capturing system information..."
    
    # System info
    uname -a > "$sys_dir/system_info.txt" 2>/dev/null || echo "unknown" > "$sys_dir/system_info.txt"
    
    # Node.js version
    node --version > "$sys_dir/node_version.txt" 2>/dev/null || echo "node not found" > "$sys_dir/node_version.txt"
    
    # npm version
    npm --version > "$sys_dir/npm_version.txt" 2>/dev/null || echo "npm not found" > "$sys_dir/npm_version.txt"
    
    # pnpm version
    pnpm --version > "$sys_dir/pnpm_version.txt" 2>/dev/null || echo "pnpm not found" > "$sys_dir/pnpm_version.txt"
    
    # Python version
    python3 --version > "$sys_dir/python_version.txt" 2>/dev/null || python --version > "$sys_dir/python_version.txt" 2>/dev/null || echo "python not found" > "$sys_dir/python_version.txt"
    
    # Disk space
    df -h . > "$sys_dir/disk_space.txt" 2>/dev/null || echo "disk space info unavailable" > "$sys_dir/disk_space.txt"
    
    log_success "System information captured"
}

# Cleanup old backups (keep last 10)
cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 10)..."
    
    # Keep only the 10 most recent backups
    cd "$BACKUP_DIR"
    
    # Count total backups
    local total_backups=$(ls -1 ${PROJECT_NAME}-*.code.tar.gz 2>/dev/null | wc -l)
    
    if [[ $total_backups -gt 10 ]]; then
        local to_delete=$((total_backups - 10))
        log_info "Removing $to_delete old backup(s)..."
        
        # Remove oldest backups
        ls -1t ${PROJECT_NAME}-*.code.tar.gz | tail -n $to_delete | xargs rm -f
        ls -1t ${PROJECT_NAME}-*.meta.tar.gz | tail -n $to_delete | xargs rm -f
    fi
}

# Main backup function
main() {
    log_info "Starting backup for $PROJECT_NAME..."
    log_info "Project root: $PROJECT_ROOT"
    
    detect_platform
    create_backup_dir
    
    # Create backups
    local code_archive=$(archive_code)
    local meta_archive=$(create_metadata_bundle)
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Summary
    log_success "Backup completed successfully!"
    log_info "Code archive: $(basename "$code_archive")"
    log_info "Metadata archive: $(basename "$meta_archive")"
    
    # Show backup sizes
    if command -v du >/dev/null 2>&1; then
        log_info "Archive sizes:"
        du -h "$code_archive" "$meta_archive" 2>/dev/null || true
    fi
    
    log_info "Backup location: $BACKUP_DIR"
}

# Run main function
main "$@"
