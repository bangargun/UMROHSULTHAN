#!/bin/bash
set -e

# Konfigurasi Server VPS Hostinger
VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"
LOCAL_DIR="/Users/argun/DEVELOP APLIKASI/APLIKASI UMROH"
LOCAL_DB="$LOCAL_DIR/prisma/dev.db"

echo "=========================================================="
echo "  SINKRONISASI DATABASE LOKAL KE VPS HOSTINGER"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "  Target: ${VPS_DIR}/prisma/dev.db"
echo "=========================================================="

# 1. Validasi Keberadaan Database Lokal
if [ ! -f "$LOCAL_DB" ]; then
  echo "❌ Error: File database lokal ($LOCAL_DB) tidak ditemukan!"
  exit 1
fi

# 2. Backup Otomatis Database Lokal Sebelum Upload
echo "[1/3] Membuat salinan cadangan (backup) lokal..."
BACKUP_DIR="$LOCAL_DIR/backups"
mkdir -p "$BACKUP_DIR"
cp "$LOCAL_DB" "$BACKUP_DIR/dev_backup_$(date +%Y%m%d_%H%M%S).db"
echo "✅ Backup lokal aman di folder /backups"

# 3. Upload File dev.db ke VPS Hostinger via SCP
echo "[2/3] Meng-upload file database ke VPS..."
scp "$LOCAL_DB" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/prisma/dev.db"
echo "✅ File database berhasil di-upload ke VPS!"

# 4. Restart Aplikasi PM2 di VPS
echo "[3/3] Me-restart PM2 di VPS agar perubahan data langsung aktif..."
ssh "${VPS_USER}@${VPS_HOST}" "pm2 restart portalumroh || pm2 restart ecosystem.config.js || pm2 restart all"
echo "✅ Aplikasi di VPS telah di-restart!"

echo "=========================================================="
echo "  ALHAMDULILLAH! SINKRONISASI DATABASE KE VPS SELESAI!"
echo "  Portal: https://portalumroh.barokahgroupindonesia.tech"
echo "=========================================================="
