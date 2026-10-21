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
}
trap cleanup EXIT INT TERM

echo "=========================================================="
echo "  🚀 UPDATE KODE APLIKASI KE VPS (KODE SAJA - TANPA DATABASE)"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "=========================================================="

cd "$(dirname "$0")"

# 1. Commit & Push Hanya Perubahan Kode (Database Lokal Dikecualikan)
echo "[1/3] Menyimpan & mengirim kode terbaru ke GitHub (tanpa database)..."
git add .
git reset prisma/dev.db 2>/dev/null || true

if ! git diff --cached --quiet; then
  git commit -m "Update kode aplikasi (tanpa DB): $(date +'%Y-%m-%d %H:%M')"
  git push origin main
else
  echo "ℹ️ Tidak ada perubahan kode baru yang belum di-commit, push branch main..."
  git push origin main || true
fi

# Buka koneksi master SSH
echo "🔑 Menghubungkan ke VPS (masukkan password 1x jika diminta)..."
ssh ${SSH_OPTS} -fN "${VPS_USER}@${VPS_HOST}"

# 2. Amankan Database VPS & Tarik Kode Terbaru
echo "[2/3] Mengambil kode terbaru di VPS sambil mengamankan database VPS..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "
  set -e
  cd ${VPS_DIR}
  
  # Amankan database VPS yang sedang aktif
  mkdir -p /tmp/vps_db_backup
  if [ -f prisma/dev.db ]; then
    cp -f prisma/dev.db /tmp/vps_db_backup/dev.db
  fi
  if [ -f dev.db ]; then
    cp -f dev.db /tmp/vps_db_backup/dev_root.db
  fi

  # Tarik kode terbaru dari GitHub
  git fetch origin main
  git reset --hard origin/main

  # Kembalikan database VPS asli 100% utuh tanpa tersentuh
  if [ -f /tmp/vps_db_backup/dev.db ]; then
    cp -f /tmp/vps_db_backup/dev.db prisma/dev.db
  fi
  if [ -f /tmp/vps_db_backup/dev_root.db ]; then
    cp -f /tmp/vps_db_backup/dev_root.db dev.db
  fi
  chmod 666 prisma/dev.db dev.db 2>/dev/null || true
  chmod -R 777 prisma 2>/dev/null || true
"

# 3. Rebuild Next.js & Restart PM2 di VPS (Tanpa db push / tanpa modifikasi data)
echo "[3/3] Rebuild Next.js dan restart server di VPS..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "
  set -e
  cd ${VPS_DIR}
  npm install --include=dev
  npx prisma generate
  npm run build
  pm2 restart all --update-env
"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! UPDATE KODE KE VPS BERHASIL!"
echo "  🔒 Database VPS 100% AMAN & TIDAK TERSENTUH / TIDAK BERUBAH"
echo "  🌐 Website: https://portalumroh.barokahgroupindonesia.tech"
echo "=========================================================="
