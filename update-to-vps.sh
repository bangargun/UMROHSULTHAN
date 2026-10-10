#!/bin/bash
set -e

VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"

# Setup SSH Socket Multiplexing agar HANYA MINTA PASSWORD 1 KALI di awal sesi
SSH_SOCKET_DIR="${HOME}/.ssh"
mkdir -p "${SSH_SOCKET_DIR}"
SSH_SOCKET="${SSH_SOCKET_DIR}/cm-vps-${VPS_HOST}"
SSH_OPTS="-o ControlMaster=auto -o ControlPath=${SSH_SOCKET} -o ControlPersist=10m -o ServerAliveInterval=15 -o ServerAliveCountMax=3"

cleanup() {
  # Tutup koneksi SSH master saat script selesai atau dihentikan
  ssh -O exit -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" 2>/dev/null || true
  rm -f "${SSH_SOCKET}" 2>/dev/null || true
  rm -f prisma/dev.db.gz 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "=========================================================="
echo "  🚀 DEPLOY KODE & SINKRONISASI DATABASE LOKAL KE VPS"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "=========================================================="

cd "$(dirname "$0")"

# 1. Backup Database Lokal Otomatis
echo "[1/5] Membuat cadangan (backup) database lokal..."
mkdir -p backups
BACKUP_NAME="backups/dev_backup_$(date +'%Y%m%d_%H%M%S').db"
if [ -f "prisma/dev.db" ]; then
  cp "prisma/dev.db" "$BACKUP_NAME"
  echo "✅ Backup lokal tersimpan di: $BACKUP_NAME"
fi

# 2. Push Kode Terbaru ke GitHub
echo "[2/5] Menyimpan & mengirim kode terbaru ke GitHub..."
git add .
git commit -m "Update sistem dan sinkronisasi database: $(date +'%Y-%m-%d %H:%M')" || true
git push origin main || true

# Buka koneksi master SSH (hanya butuh input password 1x di sini jika belum pakai SSH Key)
echo "🔑 Menghubungkan ke VPS (masukkan password 1x jika diminta)..."
ssh ${SSH_OPTS} -fN "${VPS_USER}@${VPS_HOST}"

# 3. Pull Kode Terbaru di VPS
echo "[3/5] Mengambil kode terbaru di VPS (git pull)..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && git fetch origin main && git reset --hard origin/main"

# 4. Kompres & Upload Database Lokal ke VPS (Super Cepat & Bebas Stalled)
echo "[4/5] Mengompres dan meng-upload database lokal ke VPS..."
gzip -c "prisma/dev.db" > "prisma/dev.db.gz"

# Backup DB di VPS sebelum ditimpa
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "mkdir -p ${VPS_DIR}/backups && cp -f ${VPS_DIR}/prisma/dev.db ${VPS_DIR}/backups/vps_backup_\$(date +'%Y%m%d_%H%M%S').db 2>/dev/null || true"

# Upload file database terkompresi
scp -o ControlPath="${SSH_SOCKET}" "prisma/dev.db.gz" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/prisma/dev.db.gz"

# Ekstrak di VPS
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && gunzip -f prisma/dev.db.gz && cp -f prisma/dev.db dev.db 2>/dev/null || true && chmod 666 prisma/dev.db dev.db 2>/dev/null || true && chmod -R 777 prisma 2>/dev/null || true"
rm -f "prisma/dev.db.gz"


# 5. Sinkronisasi Skema, Rebuild & Restart PM2 di VPS
echo "[5/5] Rebuild Next.js dan restart server di VPS..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "cd ${VPS_DIR} && \
  npm install --include=dev && \
  npx prisma generate && \
  npx prisma db push && \
  npm run build && \
  pm2 restart all --update-env"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! UPDATE KODE & DATABASE KE VPS SUKSES!"
echo "  🌐 Website: https://portalumroh.barokahgroupindonesia.tech"
echo "  📱 Unduh APK: https://portalumroh.barokahgroupindonesia.tech/sulthan-umroh.apk"
echo "=========================================================="
