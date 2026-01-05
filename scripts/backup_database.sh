#!/bin/bash

# Database Backup Script for KUAFCV PostgreSQL
# Bu skript PostgreSQL bazani backup qiladi va eskirgan backuplarni o'chiradi

# Configuration
BACKUP_DIR="/var/backups/kuafcv"
DB_NAME="${POSTGRES_DB:-kuafcv}"
DB_USER="${POSTGRES_USER:-kuafcv_user}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kuafcv_backup_$TIMESTAMP.sql.gz"

# Backup papkasini yaratish
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Backup file: $BACKUP_FILE"

# PostgreSQL backup (gzip bilan siqilgan)
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    -F plain \
    | gzip > "$BACKUP_FILE"

# Backup muvaffaqiyatli yaratilganmi tekshirish
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup successfully created: $BACKUP_FILE ($BACKUP_SIZE)"
    
    # Eskirgan backuplarni o'chirish
    echo "🧹 Cleaning up old backups (older than $BACKUP_RETENTION_DAYS days)..."
    find "$BACKUP_DIR" -name "kuafcv_backup_*.sql.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -delete
    
    REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "kuafcv_backup_*.sql.gz" -type f | wc -l)
    echo "📦 Total backups: $REMAINING_BACKUPS"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Disk space tekshirish
echo "💾 Backup directory disk usage:"
du -sh "$BACKUP_DIR"
