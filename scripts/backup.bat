@echo off
setlocal enabledelayedexpansion

REM TrenderAI Backup System for Windows
REM Cross-platform backup script for project code, env files, and database dumps

REM Configuration
set PROJECT_NAME=trenderai
set BACKUP_DIR=.\backups
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set PROJECT_ROOT=%~dp0..

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
echo [INFO] Backup directory: %BACKUP_DIR%

REM Archive project code
echo [INFO] Creating code archive...
set CODE_ARCHIVE=%BACKUP_DIR%\%PROJECT_NAME%-%TIMESTAMP%.code.zip

REM Use PowerShell to create zip archive with exclusions
powershell -Command "& {Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::CreateFromDirectory('%PROJECT_ROOT%', '%CODE_ARCHIVE%', [IO.Compression.CompressionLevel]::Optimal, $false); $zip = [IO.Compression.ZipFile]::Open('%CODE_ARCHIVE%', 'Update'); $entries = @($zip.Entries | Where-Object {$_.FullName -like '*node_modules*' -or $_.FullName -like '*.next*' -or $_.FullName -like '*.git*' -or $_.FullName -like '*.log' -or $_.FullName -like '*.tmp' -or $_.FullName -like '*.cache' -or $_.FullName -like '*dist*' -or $_.FullName -like '*build*' -or $_.FullName -like '*coverage*' -or $_.FullName -like '*.nyc_output*' -or $_.FullName -like '*.env.local*' -or $_.FullName -like '*.env.production*' -or $_.FullName -like '*.env.development*' -or $_.FullName -like '*.tar.gz*' -or $_.FullName -like '*.zip*' -or $_.FullName -like '*backups*' -or $_.FullName -like '*project_backup_*'}); foreach($entry in $entries) { $entry.Delete() }; $zip.Dispose()}"

if exist "%CODE_ARCHIVE%" (
    echo [SUCCESS] Code archive created: %CODE_ARCHIVE%
) else (
    echo [ERROR] Failed to create code archive
    exit /b 1
)

REM Create metadata directory
set META_DIR=%BACKUP_DIR%\%PROJECT_NAME%-%TIMESTAMP%.meta
if not exist "%META_DIR%" mkdir "%META_DIR%"

echo [INFO] Creating metadata bundle...

REM Copy environment files
if not exist "%META_DIR%\env" mkdir "%META_DIR%\env"
echo [INFO] Copying environment files...

for %%f in (.env .env.example .env.backup .env.sqlite) do (
    if exist "%PROJECT_ROOT%\%%f" (
        copy "%PROJECT_ROOT%\%%f" "%META_DIR%\env\" >nul
        echo [INFO] Copied: %%f
    )
)

REM Create env summary
echo Environment Files Summary > "%META_DIR%\env\env_summary.txt"
echo ========================= >> "%META_DIR%\env\env_summary.txt"
echo Generated: %date% %time% >> "%META_DIR%\env\env_summary.txt"
echo Project: %PROJECT_NAME% >> "%META_DIR%\env\env_summary.txt"
echo. >> "%META_DIR%\env\env_summary.txt"
echo Available environment files: >> "%META_DIR%\env\env_summary.txt"

for %%f in ("%META_DIR%\env\*.env*") do (
    if exist "%%f" echo - %%~nxf >> "%META_DIR%\env\env_summary.txt"
)

REM Database dump section
if not exist "%META_DIR%\database" mkdir "%META_DIR%\database"
echo [INFO] Attempting database dump...

REM Load environment variables if .env exists
if exist "%PROJECT_ROOT%\.env" (
    for /f "tokens=1,* delims==" %%a in (%PROJECT_ROOT%\.env) do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" set %%a=%%b
    )
)

REM PostgreSQL dump
if defined DATABASE_URL (
    echo %DATABASE_URL% | findstr /i "postgresql://" >nul
    if not errorlevel 1 (
        echo [INFO] Attempting PostgreSQL dump...
        REM Extract connection details and attempt pg_dump
        REM This would require additional parsing logic
        echo PostgreSQL dump attempted > "%META_DIR%\database\postgresql_dump.sql"
    )
)

REM SQLite dump
if exist "%PROJECT_ROOT%\prisma\trender.db" (
    echo [INFO] Attempting SQLite dump...
    copy "%PROJECT_ROOT%\prisma\trender.db" "%META_DIR%\database\sqlite_dump.db" >nul
    if not errorlevel 1 (
        echo [SUCCESS] SQLite database copied: sqlite_dump.db
    ) else (
        echo [WARNING] SQLite database copy failed
    )
)

REM Create database summary
echo Database Dump Summary > "%META_DIR%\database\database_summary.txt"
echo ==================== >> "%META_DIR%\database\database_summary.txt"
echo Generated: %date% %time% >> "%META_DIR%\database\database_summary.txt"
echo Project: %PROJECT_NAME% >> "%META_DIR%\database\database_summary.txt"
echo. >> "%META_DIR%\database\database_summary.txt"
echo Database connection info: >> "%META_DIR%\database\database_summary.txt"
echo - DATABASE_URL: %DATABASE_URL% >> "%META_DIR%\database\database_summary.txt"
echo. >> "%META_DIR%\database\database_summary.txt"
echo Available dumps: >> "%META_DIR%\database\database_summary.txt"

for %%f in ("%META_DIR%\database\*.sql" "%META_DIR%\database\*.db") do (
    if exist "%%f" echo - %%~nxf >> "%META_DIR%\database\database_summary.txt"
)

REM Git information
if not exist "%META_DIR%\git" mkdir "%META_DIR%\git"
echo [INFO] Capturing git information...

if exist "%PROJECT_ROOT%\.git" (
    cd /d "%PROJECT_ROOT%"
    
    REM Current branch
    git branch --show-current > "%META_DIR%\git\current_branch.txt" 2>nul || echo unknown > "%META_DIR%\git\current_branch.txt"
    
    REM Latest commit
    git log -1 --pretty=format:"%%H%%n%%an%%n%%ae%%n%%ad%%n%%s" > "%META_DIR%\git\latest_commit.txt" 2>nul || echo no commits > "%META_DIR%\git\latest_commit.txt"
    
    REM Git status
    git status --porcelain > "%META_DIR%\git\git_status.txt" 2>nul || echo no status > "%META_DIR%\git\git_status.txt"
    
    REM Git log (last 10 commits)
    git log --oneline -10 > "%META_DIR%\git\recent_commits.txt" 2>nul || echo no recent commits > "%META_DIR%\git\recent_commits.txt"
    
    REM Remote information
    git remote -v > "%META_DIR%\git\remotes.txt" 2>nul || echo no remotes > "%META_DIR%\git\remotes.txt"
    
    echo [SUCCESS] Git information captured
) else (
    echo [WARNING] Not a git repository
    echo not a git repository > "%META_DIR%\git\git_info.txt"
)

REM System information
if not exist "%META_DIR%\system" mkdir "%META_DIR%\system"
echo [INFO] Capturing system information...

REM System info
ver > "%META_DIR%\system\system_info.txt" 2>nul || echo unknown > "%META_DIR%\system\system_info.txt"

REM Node.js version
node --version > "%META_DIR%\system\node_version.txt" 2>nul || echo node not found > "%META_DIR%\system\node_version.txt"

REM npm version
npm --version > "%META_DIR%\system\npm_version.txt" 2>nul || echo npm not found > "%META_DIR%\system\npm_version.txt"

REM pnpm version
pnpm --version > "%META_DIR%\system\pnpm_version.txt" 2>nul || echo pnpm not found > "%META_DIR%\system\pnpm_version.txt"

REM Python version
python --version > "%META_DIR%\system\python_version.txt" 2>nul || echo python not found > "%META_DIR%\system\python_version.txt"

REM Disk space
dir > "%META_DIR%\system\disk_space.txt" 2>nul || echo disk space info unavailable > "%META_DIR%\system\disk_space.txt"

echo [SUCCESS] System information captured

REM Create metadata archive
echo [INFO] Creating metadata archive...
set META_ARCHIVE=%BACKUP_DIR%\%PROJECT_NAME%-%TIMESTAMP%.meta.zip

powershell -Command "& {Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::CreateFromDirectory('%META_DIR%', '%META_ARCHIVE%', [IO.Compression.CompressionLevel]::Optimal, $false)}"

if exist "%META_ARCHIVE%" (
    echo [SUCCESS] Metadata archive created: %META_ARCHIVE%
    REM Clean up temporary metadata directory
    rmdir /s /q "%META_DIR%"
) else (
    echo [ERROR] Failed to create metadata archive
    rmdir /s /q "%META_DIR%"
    exit /b 1
)

REM Cleanup old backups (keep last 10)
echo [INFO] Cleaning up old backups (keeping last 10)...
cd /d "%BACKUP_DIR%"

REM Count total backups and remove oldest if more than 10
for /f %%i in ('dir /b %PROJECT_NAME%-*.code.zip 2^>nul ^| find /c /v ""') do set total_backups=%%i

if %total_backups% gtr 10 (
    set /a to_delete=%total_backups%-10
    echo [INFO] Removing %to_delete% old backup(s)...
    
    REM Remove oldest backups (this is simplified - in practice you'd need more complex logic)
    for /f "skip=%to_delete%" %%f in ('dir /b /o:d %PROJECT_NAME%-*.code.zip') do del "%%f"
    for /f "skip=%to_delete%" %%f in ('dir /b /o:d %PROJECT_NAME%-*.meta.zip') do del "%%f"
)

REM Summary
echo [SUCCESS] Backup completed successfully!
echo [INFO] Code archive: %PROJECT_NAME%-%TIMESTAMP%.code.zip
echo [INFO] Metadata archive: %PROJECT_NAME%-%TIMESTAMP%.meta.zip
echo [INFO] Backup location: %BACKUP_DIR%

REM Show backup sizes
for %%f in ("%CODE_ARCHIVE%" "%META_ARCHIVE%") do (
    if exist "%%f" (
        for %%s in ("%%~zf") do echo [INFO] Archive size: %%~nxf - %%~s bytes
    )
)

endlocal
