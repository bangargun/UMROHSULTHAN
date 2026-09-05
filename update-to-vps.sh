#!/bin/bash
set -e

VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"

echo "=========================================================="
echo "  🚀 DEPLOY & SINKRONISASI DATABASE KE VPS HOSTINGER"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "=========================================================="

# 1. Pastikan di folder proyek
cd "$(dirname "$0")"

# 2. Push kode lokal ke GitHub
echo "[1/4] Menyimpan dan Mengirim Kode Terbaru ke GitHub..."
git add .
git commit -m "Update otomatis: fitur diskon, invoice, dan data database $(date +'%Y-%m-%d %H:%M')" || true
git push origin main

# 3. Upload database lokal ke VPS
echo "[2/4] Meng-upload Database Lokal (dev.db) ke VPS..."
scp "prisma/dev.db" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/prisma/dev.db"

# 4. Pull, Rebuild Next.js & Restart PM2 di VPS
echo "[3/4] Menjalankan Update, Rebuild & Restart di VPS (Harap Tunggu ~30 Detik)..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && git pull origin main && npm install --include=dev && npx prisma generate && npx prisma db push && npm run build && (pm2 restart sulthan-umroh-erp --update-env || pm2 restart all || pm2 start ecosystem.config.js)"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! UPDATE KODE & DATABASE KE VPS SELESAI!"
echo "  🌐 Domain: https://portalumroh.barokahgroupindonesia.tech"
echo "=========================================================="
