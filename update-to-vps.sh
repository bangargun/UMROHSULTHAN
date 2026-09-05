#!/bin/bash
set -e

VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"

echo "=========================================================="
echo "  🚀 DEPLOY & SYNC ALL-IN-ONE KE VPS HOSTINGER"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "=========================================================="

echo "[1/4] Menyimpan dan Mengirim Kode Terbaru ke GitHub..."
git add .
git commit -m "Update otomatis: fitur diskon, invoice, dan data database $(date +'%Y-%m-%d %H:%M')" || true
git push origin main

echo "[2/4] Meng-upload Database Lokal (dev.db) ke VPS..."
scp "prisma/dev.db" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/prisma/dev.db"

echo "[3/4] Menjalankan Update & Build di VPS..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && git pull origin main && npm install --include=dev && npx prisma generate && npx prisma db push && npm run build && pm2 reload ecosystem.config.js || pm2 restart all"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! UPDATE KODE & DATABASE KE VPS SUKSES!"
echo "  🌐 Domain: https://portalumroh.barokahgroupindonesia.tech"
echo "=========================================================="
