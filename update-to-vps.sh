#!/bin/bash
set -e

VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"

echo "=========================================================="
echo "  🚀 DEPLOY & SINKRONISASI DATABASE 100% PERSIS KE VPS"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "=========================================================="

cd "$(dirname "$0")"

# 1. Push ke GitHub
echo "[1/4] Mengirim Kode Terbaru ke GitHub..."
git add .
git commit -m "Update sinkronisasi total tampilan dan database $(date +'%Y-%m-%d %H:%M')" || true
git push origin main

# 2. Reset & Pull Kode di VPS (Bebas Konflik Git)
echo "[2/4] Menarik Kode Terbaru di VPS (Reset Clean Git)..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && git fetch origin main && git reset --hard origin/main"

# 3. Upload File Database Lokal ke VPS
echo "[3/4] Meng-upload Database Lokal (dev.db) ke VPS..."
scp "prisma/dev.db" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/prisma/dev.db"

# 4. Hapus Cache & Rebuild Next.js di VPS
echo "[4/4] Membangun Ulang (Build) & Me-restart Server VPS (~30 Detik)..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && rm -f dev.db dev.db-wal dev.db-shm prisma/dev.db-wal prisma/dev.db-shm && npm install --include=dev && npx prisma generate && npx prisma db push && npm run build && pm2 restart all --update-env"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! UPDATE & BUILD DI VPS SELESAI 100%!"
echo "  🌐 Domain: https://portalumroh.barokahgroupindonesia.tech"
echo "=========================================================="
