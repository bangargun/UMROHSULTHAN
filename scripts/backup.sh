#!/bin/bash
# ==============================================================================
#  AUTO-BACKUP DATABASE HARIAN - PT BAROKAH SULTHAN HARAMAIN
#  Jadwal: Berjalan otomatis setiap pukul 02:00 Pagi
# ==============================================================================

PROJECT_DIR="/var/www/portalumroh"
BACKUP_DIR="$PROJECT_DIR/backups"
DB_FILE="$PROJECT_DIR/prisma/dev.db"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")

# Pastikan folder backups tersedia
mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
    # 1. Salin file database SQLite
    BACKUP_TARGET="$BACKUP_DIR/dev_backup_$TIMESTAMP.db"
    cp "$DB_FILE" "$BACKUP_TARGET"
    
    # 2. Kompresi file agar ukuran sangat kecil (hemat memori disk VPS)
    gzip -f "$BACKUP_TARGET"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Auto-backup SUKSES: dev_backup_$TIMESTAMP.db.gz" >> "$BACKUP_DIR/backup.log"
    
    # 3. Otomatis bersihkan backup lama yang sudah lebih dari 30 hari
    find "$BACKUP_DIR" -type f -name "dev_backup_*.db.gz" -mtime +30 -delete
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: File database $DB_FILE tidak ditemukan!" >> "$BACKUP_DIR/backup.log"
fi
