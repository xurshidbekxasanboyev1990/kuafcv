# Database Backup Script for KUAFCV PostgreSQL (Windows PowerShell)
# Bu skript PostgreSQL bazani backup qiladi va eskirgan backuplarni o'chiradi

# Configuration
$BACKUP_DIR = "C:\backups\kuafcv"
$DB_NAME = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "kuafcv" }
$DB_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "kuafcv_user" }
$DB_HOST = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "localhost" }
$DB_PORT = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5433" }
$BACKUP_RETENTION_DAYS = 7
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\kuafcv_backup_$TIMESTAMP.sql"

# Backup papkasini yaratish
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

Write-Host "🔄 Starting database backup..." -ForegroundColor Cyan
Write-Host "   Database: $DB_NAME" -ForegroundColor Gray
Write-Host "   Host: ${DB_HOST}:${DB_PORT}" -ForegroundColor Gray
Write-Host "   Backup file: $BACKUP_FILE" -ForegroundColor Gray

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $env:POSTGRES_PASSWORD

# PostgreSQL backup
& "pg_dump" `
    -h $DB_HOST `
    -p $DB_PORT `
    -U $DB_USER `
    -d $DB_NAME `
    --no-owner `
    --no-acl `
    -F plain `
    -f $BACKUP_FILE

# Check if backup was successful
if ($LASTEXITCODE -eq 0) {
    $BackupSize = (Get-Item $BACKUP_FILE).Length / 1MB
    Write-Host "✅ Backup successfully created: $BACKUP_FILE ($($BackupSize.ToString('F2')) MB)" -ForegroundColor Green
    
    # Compress backup
    Write-Host "📦 Compressing backup..." -ForegroundColor Cyan
    Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip" -Force
    Remove-Item $BACKUP_FILE
    
    # Eskirgan backuplarni o'chirish
    Write-Host "🧹 Cleaning up old backups (older than $BACKUP_RETENTION_DAYS days)..." -ForegroundColor Cyan
    $CutoffDate = (Get-Date).AddDays(-$BACKUP_RETENTION_DAYS)
    Get-ChildItem -Path $BACKUP_DIR -Filter "kuafcv_backup_*.zip" | 
        Where-Object { $_.LastWriteTime -lt $CutoffDate } | 
        Remove-Item -Force
    
    $RemainingBackups = (Get-ChildItem -Path $BACKUP_DIR -Filter "kuafcv_backup_*.zip").Count
    Write-Host "📦 Total backups: $RemainingBackups" -ForegroundColor Green
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
    exit 1
}

# Disk space tekshirish
Write-Host "💾 Backup directory disk usage:" -ForegroundColor Cyan
$TotalSize = (Get-ChildItem -Path $BACKUP_DIR -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   $($TotalSize.ToString('F2')) MB" -ForegroundColor Gray

# Clear password from environment
Remove-Item Env:\PGPASSWORD
