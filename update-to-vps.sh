#!/bin/bash
set -e

VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"

echo "=========================================================="
echo "  🚀 DEPLOY KODE & SINKRONISASI DATABASE LOKAL KE VPS"
echo "  Target: ${VPS_USER}@${VPS_HOST}:${VPS_DIR}"
echo "=========================================================="

cd "$(dirname "$0")"

# 1. Backup Database Lokal Otomatis
echo "[1/6] Membuat cadangan (backup) database lokal..."
mkdir -p backups
BACKUP_NAME="backups/dev_backup_$(date +'%Y%m%d_%H%M%S').db"
if [ -f "prisma/dev.db" ]; then
  cp "prisma/dev.db" "$BACKUP_NAME"
  echo "✅ Backup lokal tersimpan di: $BACKUP_NAME"
fi

# 2. Push Kode Terbaru ke GitHub
echo "[2/6] Menyimpan & mengirim kode terbaru ke GitHub..."
git add .
git commit -m "Update sistem dan sinkronisasi database: $(date +'%Y-%m-%d %H:%M')" || true
git push origin main || true

# 3. Pull Kode Terbaru di VPS
echo "[3/6] Mengambil kode terbaru di VPS (git pull)..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && git fetch origin main && git reset --hard origin/main"

# 4. Upload Database Lokal (dev.db) ke VPS
echo "[4/6] Meng-upload database lokal ke VPS..."
# Buat backup database di VPS sebelum ditimpa
ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p ${VPS_DIR}/backups && cp -f ${VPS_DIR}/prisma/dev.db ${VPS_DIR}/backups/vps_backup_\$(date +'%Y%m%d_%H%M%S').db 2>/dev/null || true"
# Upload dev.db ke folder prisma di VPS
scp "prisma/dev.db" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/prisma/dev.db"

# Upload APK jika tersedia
if [ -f "public/sulthan-umroh.apk" ]; then
  echo "📦 Meng-upload file APK..."
  ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p ${VPS_DIR}/public/downloads"
  scp "public/sulthan-umroh.apk" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/public/sulthan-umroh.apk"
  scp "public/sulthan-umroh.apk" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/public/downloads/sulthan-umroh.apk"
fi

# 5. Sinkronisasi Skema, Permissions, dan Rebuild di VPS
echo "[5/6] Menyiapkan database, generate prisma client, dan rebuild Next.js..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && \
  cp -f prisma/dev.db dev.db 2>/dev/null || true && \
  chmod 666 prisma/dev.db dev.db 2>/dev/null || true && \
  chmod -R 777 prisma 2>/dev/null || true && \
  npm install --include=dev && \
  npx prisma generate && \
  npx prisma db push && \
  npm run build"

# 6. Restart Server PM2 di VPS
echo "[6/6] Me-restart PM2 service di VPS..."
ssh "${VPS_USER}@${VPS_HOST}" "pm2 restart all --update-env || pm2 restart portalumroh"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! UPDATE KODE & DATABASE KE VPS SUKSES!"
echo "  🌐 Website: https://portalumroh.barokahgroupindonesia.tech"
echo "  📱 Unduh APK: https://portalumroh.barokahgroupindonesia.tech/sulthan-umroh.apk"
echo "=========================================================="
