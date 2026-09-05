#!/bin/bash
set -e

VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"

echo "=========================================================="
echo "  🚀 DEPLOY & SINKRONISASI DATABASE + APK KE VPS"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "=========================================================="

cd "$(dirname "$0")"

# 1. Push ke GitHub
echo "[1/5] Mengirim Kode Terbaru ke GitHub..."
git add .
git commit -m "Update otomatis: APK dan database $(date +'%Y-%m-%d %H:%M')" || true
git push origin main || true

# 2. Reset & Pull Kode di VPS
echo "[2/5] Menarik Kode Terbaru di VPS (Clean Git)..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && git fetch origin main && git reset --hard origin/main"

# 3. Upload File Database Lokal ke VPS
echo "[3/5] Meng-upload Database Lokal (dev.db) ke VPS..."
scp "prisma/dev.db" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/prisma/dev.db"

# 4. Upload File APK ke Folder Publik VPS
if [ -f "public/sulthan-umroh.apk" ]; then
  echo "[4/5] Meng-upload File APK ke VPS..."
  ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p ${VPS_DIR}/public/downloads"
  scp "public/sulthan-umroh.apk" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/public/sulthan-umroh.apk"
  scp "public/sulthan-umroh.apk" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/public/downloads/sulthan-umroh.apk"
fi

# 5. Hapus Cache & Rebuild Next.js di VPS
echo "[5/5] Membangun Ulang (Build) & Me-restart Server VPS (~30 Detik)..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && rm -f dev.db dev.db-wal dev.db-shm prisma/dev.db-wal prisma/dev.db-shm && npm install --include=dev && npx prisma generate && npx prisma db push && npm run build && pm2 restart all --update-env"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! UPDATE KODE, DATABASE & APK SELESAI!"
echo "  🌐 Domain: https://portalumroh.barokahgroupindonesia.tech"
echo "  📱 Unduh APK: https://portalumroh.barokahgroupindonesia.tech/sulthan-umroh.apk"
echo "=========================================================="
