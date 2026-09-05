#!/bin/bash
set -e

VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"

echo "=========================================================="
echo "  🚀 DEPLOY & SINKRONISASI DATABASE 1 FILE TUNGGAL KE VPS"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "  Database Target: ${VPS_DIR}/prisma/dev.db"
echo "=========================================================="

cd "$(dirname "$0")"

echo "[1/4] Menyimpan dan Mengirim Kode Terbaru ke GitHub..."
git add .
git commit -m "Update standarisasi database tunggal prisma/dev.db $(date +'%Y-%m-%d %H:%M')" || true
git push origin main

echo "[2/4] Meng-upload Database Lokal ke VPS (prisma/dev.db)..."
scp "prisma/dev.db" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/prisma/dev.db"

echo "[3/4] Menghapus File Database Duplikat Lama & Cache WAL di VPS..."
ssh "${VPS_USER}@${VPS_HOST}" "rm -f ${VPS_DIR}/dev.db ${VPS_DIR}/dev.db-wal ${VPS_DIR}/dev.db-shm ${VPS_DIR}/prisma/dev.db-wal ${VPS_DIR}/prisma/dev.db-shm"

echo "[4/4] Menjalankan Update, Rebuild & Restart di VPS (~30 Detik)..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && git pull origin main && npm install --include=dev && npx prisma generate && npx prisma db push && npm run build && pm2 restart all --update-env"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! DATABASE STANDAR 1 FILE SUDAH AKTIF!"
echo "  🌐 Domain: https://portalumroh.barokahgroupindonesia.tech"
echo "=========================================================="
