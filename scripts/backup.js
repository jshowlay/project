#!/usr/bin/env node

/**
 * TrenderAI Backup System
 * Cross-platform backup script for project code, env files, and database dumps
 * Node.js version for maximum compatibility
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const archiver = require('archiver');
const os = require('os');

// Configuration
const PROJECT_NAME = 'trenderai';
const BACKUP_DIR = './backups';
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// Logging functions
function log(level, message) {
    const timestamp = new Date().toISOString();
    const color = colors[level] || colors.reset;
    console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`);
}

function logInfo(message) { log('blue', message); }
function logSuccess(message) { log('green', message); }
function logWarning(message) { log('yellow', message); }
function logError(message) { log('red', message); }

// Utility functions
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

function runCommand(command, options = {}) {
    try {
        return execSync(command, { 
            encoding: 'utf8', 
            cwd: PROJECT_ROOT,
            ...options 
        });
    } catch (error) {
        return null;
    }
}

function createArchive(sourcePath, outputPath, excludePatterns = []) {
    return new Promise((resolve, reject) => {
        // Use tar command for better compatibility
        const excludeArgs = excludePatterns.map(pattern => `--exclude=${pattern}`).join(' ');
        const command = `tar -czf "${outputPath}" ${excludeArgs} -C "${sourcePath}" .`;
        
        try {
            execSync(command, { stdio: 'inherit' });
            resolve(outputPath);
        } catch (error) {
            reject(new Error(`Archive creation failed: ${error.message}`));
        }
    });
}

// Main backup functions
async function createBackupDir() {
    ensureDir(BACKUP_DIR);
    logInfo(`Backup directory: ${BACKUP_DIR}`);
}

async function archiveCode() {
    const timestamp = getTimestamp();
    const codeArchive = path.join(BACKUP_DIR, `${PROJECT_NAME}-${timestamp}.code.tar.gz`);
    
    logInfo('Creating code archive...');
    
    const excludePatterns = [
        'node_modules',
        '.next',
        '.git',
        '.log',
        '.DS_Store',
        '.tmp',
        '.cache',
        'dist',
        'build',
        'coverage',
        '.nyc_output',
        '.env.local',
        '.env.production',
        '.env.development',
        '.tar.gz',
        '.zip',
        'backups',
        'project_backup_'
    ];
    
    try {
        await createArchive(PROJECT_ROOT, codeArchive, excludePatterns);
        logSuccess(`Code archive created: ${path.basename(codeArchive)}`);
        return codeArchive;
    } catch (error) {
        logError(`Failed to create code archive: ${error.message}`);
        throw error;
    }
}

async function createMetadataBundle() {
    const timestamp = getTimestamp();
    const metaDir = path.join(BACKUP_DIR, `${PROJECT_NAME}-${timestamp}.meta`);
    const metaArchive = path.join(BACKUP_DIR, `${PROJECT_NAME}-${timestamp}.meta.tar.gz`);
    
    logInfo('Creating metadata bundle...');
    
    ensureDir(metaDir);
    
    try {
        await copyEnvFiles(metaDir);
        await dumpDatabase(metaDir);
        await captureGitInfo(metaDir);
        await captureSystemInfo(metaDir);
        
        // Create metadata archive
        await createArchive(metaDir, metaArchive);
        
        // Clean up temporary directory
        fs.rmSync(metaDir, { recursive: true, force: true });
        
        logSuccess(`Metadata archive created: ${path.basename(metaArchive)}`);
        return metaArchive;
    } catch (error) {
        logError(`Failed to create metadata bundle: ${error.message}`);
        // Clean up on error
        if (fs.existsSync(metaDir)) {
            fs.rmSync(metaDir, { recursive: true, force: true });
        }
        throw error;
    }
}

async function copyEnvFiles(metaDir) {
    const envDir = path.join(metaDir, 'env');
    ensureDir(envDir);
    
    logInfo('Copying environment files...');
    
    const envFiles = ['.env', '.env.example', '.env.backup', '.env.sqlite'];
    
    for (const envFile of envFiles) {
        const sourcePath = path.join(PROJECT_ROOT, envFile);
        if (fs.existsSync(sourcePath)) {
            const destPath = path.join(envDir, envFile);
            fs.copyFileSync(sourcePath, destPath);
            logInfo(`Copied: ${envFile}`);
        }
    }
    
    // Create env summary
    const summaryPath = path.join(envDir, 'env_summary.txt');
    const summary = [
        'Environment Files Summary',
        '=========================',
        `Generated: ${new Date().toISOString()}`,
        `Project: ${PROJECT_NAME}`,
        '',
        'Available environment files:'
    ];
    
    const files = fs.readdirSync(envDir).filter(file => file.startsWith('.env'));
    files.forEach(file => summary.push(`- ${file}`));
    
    fs.writeFileSync(summaryPath, summary.join('\n'));
}

async function dumpDatabase(metaDir) {
    const dbDir = path.join(metaDir, 'database');
    ensureDir(dbDir);
    
    logInfo('Attempting database dump...');
    
    // Load environment variables
    const envPath = path.join(PROJECT_ROOT, '.env');
    let envVars = {};
    
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && !key.startsWith('#')) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        });
    }
    
    // PostgreSQL dump
    if (envVars.DATABASE_URL && envVars.DATABASE_URL.startsWith('postgresql://')) {
        await dumpPostgreSQL(dbDir, envVars.DATABASE_URL);
    }
    
    // MySQL dump
    if (envVars.MYSQL_HOST || envVars.MYSQL_URL) {
        await dumpMySQL(dbDir, envVars);
    }
    
    // SQLite dump
    const sqlitePath = path.join(PROJECT_ROOT, 'prisma', 'trender.db');
    if (fs.existsSync(sqlitePath)) {
        await dumpSQLite(dbDir, sqlitePath);
    }
    
    // Create database summary
    const summaryPath = path.join(dbDir, 'database_summary.txt');
    const summary = [
        'Database Dump Summary',
        '====================',
        `Generated: ${new Date().toISOString()}`,
        `Project: ${PROJECT_NAME}`,
        '',
        'Database connection info:',
        `- DATABASE_URL: ${envVars.DATABASE_URL || 'not set'}`,
        `- POSTGRES_URL: ${envVars.POSTGRES_URL || 'not set'}`,
        `- MYSQL_HOST: ${envVars.MYSQL_HOST || 'not set'}`,
        `- MYSQL_URL: ${envVars.MYSQL_URL || 'not set'}`,
        '',
        'Available dumps:'
    ];
    
    const files = fs.readdirSync(dbDir).filter(file => 
        file.endsWith('.sql') || file.endsWith('.db')
    );
    files.forEach(file => summary.push(`- ${file}`));
    
    fs.writeFileSync(summaryPath, summary.join('\n'));
}

async function dumpPostgreSQL(dbDir, databaseUrl) {
    logInfo('Attempting PostgreSQL dump...');
    
    try {
        // Parse DATABASE_URL
        const url = new URL(databaseUrl);
        const host = url.hostname;
        const port = url.port || '5432';
        const database = url.pathname.slice(1);
        const username = url.username;
        const password = url.password;
        
        const dumpPath = path.join(dbDir, 'postgresql_dump.sql');
        
        // Set environment variable for password
        const env = { ...process.env, PGPASSWORD: password };
        
        const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password`;
        
        const result = runCommand(command, { env });
        if (result) {
            fs.writeFileSync(dumpPath, result);
            logSuccess('PostgreSQL dump created: postgresql_dump.sql');
        } else {
            logWarning('PostgreSQL dump failed');
        }
    } catch (error) {
        logWarning(`PostgreSQL dump failed: ${error.message}`);
    }
}

async function dumpMySQL(dbDir, envVars) {
    logInfo('Attempting MySQL dump...');
    
    try {
        const host = envVars.MYSQL_HOST || 'localhost';
        const port = envVars.MYSQL_PORT || '3306';
        const user = envVars.MYSQL_USER || 'root';
        const password = envVars.MYSQL_PASSWORD || '';
        const database = envVars.MYSQL_DATABASE || '';
        
        const dumpPath = path.join(dbDir, 'mysql_dump.sql');
        
        // Set environment variable for password
        const env = { ...process.env };
        if (password) {
            env.MYSQL_PWD = password;
        }
        
        const command = `mysqldump -h ${host} -P ${port} -u ${user} ${database}`;
        
        const result = runCommand(command, { env });
        if (result) {
            fs.writeFileSync(dumpPath, result);
            logSuccess('MySQL dump created: mysql_dump.sql');
        } else {
            logWarning('MySQL dump failed');
        }
    } catch (error) {
        logWarning(`MySQL dump failed: ${error.message}`);
    }
}

async function dumpSQLite(dbDir, sqlitePath) {
    logInfo('Attempting SQLite dump...');
    
    try {
        const dumpPath = path.join(dbDir, 'sqlite_dump.db');
        fs.copyFileSync(sqlitePath, dumpPath);
        logSuccess('SQLite database copied: sqlite_dump.db');
    } catch (error) {
        logWarning(`SQLite database copy failed: ${error.message}`);
    }
}

async function captureGitInfo(metaDir) {
    const gitDir = path.join(metaDir, 'git');
    ensureDir(gitDir);
    
    logInfo('Capturing git information...');
    
    const gitRoot = path.join(PROJECT_ROOT, '.git');
    
    if (fs.existsSync(gitRoot)) {
        try {
            // Current branch (compatible with older git versions)
            let branch = runCommand('git branch --show-current');
            if (!branch) {
                branch = runCommand('git rev-parse --abbrev-ref HEAD') || 'unknown';
            }
            fs.writeFileSync(path.join(gitDir, 'current_branch.txt'), branch);
            
            // Latest commit
            const commit = runCommand('git log -1 --pretty=format:"%H%n%an%n%ae%n%ad%n%s"') || 'no commits';
            fs.writeFileSync(path.join(gitDir, 'latest_commit.txt'), commit);
            
            // Git status
            const status = runCommand('git status --porcelain') || 'no status';
            fs.writeFileSync(path.join(gitDir, 'git_status.txt'), status);
            
            // Recent commits
            const recent = runCommand('git log --oneline -10') || 'no recent commits';
            fs.writeFileSync(path.join(gitDir, 'recent_commits.txt'), recent);
            
            // Remotes
            const remotes = runCommand('git remote -v') || 'no remotes';
            fs.writeFileSync(path.join(gitDir, 'remotes.txt'), remotes);
            
            logSuccess('Git information captured');
        } catch (error) {
            logWarning(`Git information capture failed: ${error.message}`);
        }
    } else {
        logWarning('Not a git repository');
        fs.writeFileSync(path.join(gitDir, 'git_info.txt'), 'not a git repository');
    }
}

async function captureSystemInfo(metaDir) {
    const sysDir = path.join(metaDir, 'system');
    ensureDir(sysDir);
    
    logInfo('Capturing system information...');
    
    try {
        // System info
        const systemInfo = `${os.type()} ${os.release()} ${os.arch()}`;
        fs.writeFileSync(path.join(sysDir, 'system_info.txt'), systemInfo);
        
        // Node.js version
        const nodeVersion = process.version;
        fs.writeFileSync(path.join(sysDir, 'node_version.txt'), nodeVersion);
        
        // npm version
        const npmVersion = runCommand('npm --version') || 'npm not found';
        fs.writeFileSync(path.join(sysDir, 'npm_version.txt'), npmVersion);
        
        // pnpm version
        const pnpmVersion = runCommand('pnpm --version') || 'pnpm not found';
        fs.writeFileSync(path.join(sysDir, 'pnpm_version.txt'), pnpmVersion);
        
        // Python version
        const pythonVersion = runCommand('python3 --version') || 
                             runCommand('python --version') || 
                             'python not found';
        fs.writeFileSync(path.join(sysDir, 'python_version.txt'), pythonVersion);
        
        // Disk space (simplified)
        const diskSpace = `Total: ${os.totalmem()} bytes, Free: ${os.freemem()} bytes`;
        fs.writeFileSync(path.join(sysDir, 'disk_space.txt'), diskSpace);
        
        logSuccess('System information captured');
    } catch (error) {
        logWarning(`System information capture failed: ${error.message}`);
    }
}

async function cleanupOldBackups() {
    logInfo('Cleaning up old backups (keeping last 10)...');
    
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith(`${PROJECT_NAME}-`) && file.endsWith('.code.tar.gz'))
            .sort()
            .reverse();
        
        if (files.length > 10) {
            const toDelete = files.slice(10);
            logInfo(`Removing ${toDelete.length} old backup(s)...`);
            
            for (const file of toDelete) {
                const codeFile = path.join(BACKUP_DIR, file);
                const metaFile = path.join(BACKUP_DIR, file.replace('.code.tar.gz', '.meta.tar.gz'));
                
                if (fs.existsSync(codeFile)) fs.unlinkSync(codeFile);
                if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile);
            }
        }
    } catch (error) {
        logWarning(`Cleanup failed: ${error.message}`);
    }
}

// Main function
async function main() {
    try {
        logInfo(`Starting backup for ${PROJECT_NAME}...`);
        logInfo(`Project root: ${PROJECT_ROOT}`);
        
        await createBackupDir();
        
        const codeArchive = await archiveCode();
        const metaArchive = await createMetadataBundle();
        
        await cleanupOldBackups();
        
        // Summary
        logSuccess('Backup completed successfully!');
        logInfo(`Code archive: ${path.basename(codeArchive)}`);
        logInfo(`Metadata archive: ${path.basename(metaArchive)}`);
        
        // Show backup sizes
        const codeStats = fs.statSync(codeArchive);
        const metaStats = fs.statSync(metaArchive);
        
        logInfo('Archive sizes:');
        logInfo(`${path.basename(codeArchive)} - ${(codeStats.size / 1024 / 1024).toFixed(2)} MB`);
        logInfo(`${path.basename(metaArchive)} - ${(metaStats.size / 1024 / 1024).toFixed(2)} MB`);
        
        logInfo(`Backup location: ${BACKUP_DIR}`);
        
    } catch (error) {
        logError(`Backup failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main };
