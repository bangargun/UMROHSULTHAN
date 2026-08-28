#!/bin/bash
set -e

echo "========================================================="
echo "  DEPLOYSULTHAN - HOSTINGER PRODUCTION DEPLOYMENT SCRIPT "
echo "========================================================="

echo "[1/5] Pulling Latest Updates from GitHub..."
git stash || true
git pull origin main

echo "[2/5] Installing Dependencies..."
npm install --include=dev

echo "[3/5] Generating Database Client & Syncing Schema..."
npx prisma generate
npx prisma db push

echo "[4/5] Building Optimized Production Next.js Bundle..."
npm run build

echo "[5/5] Reloading PM2 Cluster..."
pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
pm2 save

echo "========================================================="
echo "  ALHAMDULILLAH! DEPLOYMENT TO HOSTINGER COMPLETED!"
echo "  URL: https://portalumroh.barokahgroupindonesia.tech"
echo "========================================================="
