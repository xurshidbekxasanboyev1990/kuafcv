# Database Backup Scripts

Database backup skriptlari PostgreSQL bazani muntazam backup qilish uchun.

## Linux/Docker (`backup_database.sh`)

### Ishlatish:

```bash
# Chmod berish
chmod +x scripts/backup_database.sh

# Manual backup
./scripts/backup_database.sh

# Docker container ichida
docker exec kuafcv-postgres /scripts/backup_database.sh
```

### Cron job sozlash (har kuni 2:00 da):

```bash
0 2 * * * docker exec kuafcv-postgres /scripts/backup_database.sh
```

## Windows (`backup_database.ps1`)

### Ishlatish:

```powershell
# Manual backup
.\scripts\backup_database.ps1

# Environment o'zgaruvchilari bilan
$env:POSTGRES_PASSWORD="yourpassword"
.\scripts\backup_database.ps1
```

### Windows Task Scheduler sozlash:

1. Task Scheduler ochish
2. "Create Basic Task" bosing
3. Name: "KUAFCV Database Backup"
4. Trigger: Daily, 2:00 AM
5. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-File "C:\path\to\kuafcv\scripts\backup_database.ps1"`

## Environment Variables

Quyidagi environment o'zgaruvchilarni sozlang:

- `POSTGRES_DB` - Database nomi (default: kuafcv)
- `POSTGRES_USER` - Database user (default: kuafcv_user)
- `POSTGRES_PASSWORD` - Database paroli (REQUIRED)
- `POSTGRES_HOST` - Database host (default: localhost)
- `POSTGRES_PORT` - Database porti (default: 5433 Windows, 5432 Linux)

## Backup Retention

Default: 7 kun
Eskirgan backuplar avtomatik o'chiriladi.

## Backup Location

- Linux/Docker: `/var/backups/kuafcv/`
- Windows: `C:\backups\kuafcv\`

## Restore qilish

### Linux:

```bash
# Unzip
gunzip kuafcv_backup_20240101_120000.sql.gz

# Restore
psql -h localhost -U kuafcv_user -d kuafcv < kuafcv_backup_20240101_120000.sql
```

### Windows:

```powershell
# Unzip
Expand-Archive kuafcv_backup_20240101_120000.sql.zip

# Restore
psql -h localhost -U kuafcv_user -d kuafcv -f kuafcv_backup_20240101_120000.sql
```
