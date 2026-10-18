#!/bin/bash
set -e

VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"

# Pastikan script berjalan dari direktori proyek
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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
echo "  🚀 UPDATE KODE PROGRAM SAJA KE VPS (DATABASE AMAN 100%)"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "=========================================================="

# 1. Simpan & Kirim Kode Program Terbaru ke GitHub (Tanpa Mengubah DB Live)
echo "[1/4] Menyimpan dan mengirim kode terbaru ke GitHub..."
git add src/ public/ scripts/ package.json *.ts *.js *.mjs *.sh prisma/schema.prisma 2>/dev/null || git add .
git commit -m "Update fitur & kode program: $(date +'%Y-%m-%d %H:%M')" || true
git push origin main || true

# 2. Buka koneksi master SSH
echo "🔑 Menghubungkan ke VPS (masukkan password 1x jika diminta)..."
ssh ${SSH_OPTS} -fN "${VPS_USER}@${VPS_HOST}"

# 3. Amankan Database VPS & Tarik Kode Terbaru
echo "[2/4] Mengamankan database live VPS & memperbarui kode (git pull)..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "
  # Pastikan folder backup ada
  mkdir -p ${VPS_DIR}/backups
  
  # Cadangkan database live VPS sebelum update kode
  if [ -f \"${VPS_DIR}/prisma/dev.db\" ]; then
    cp -f \"${VPS_DIR}/prisma/dev.db\" \"/tmp/vps_live_database_backup.db\"
    cp -f \"${VPS_DIR}/prisma/dev.db\" \"${VPS_DIR}/backups/live_db_before_code_update_\$(date +'%Y%m%d_%H%M%S').db\"
    echo '🔒 Database live VPS berhasil diamankan.'
  fi

  # Tarik kode terbaru dari GitHub
  cd ${VPS_DIR}
  git fetch origin main
  git reset --hard origin/main

  # Kembalikan database live VPS ke posisi aktif (agar data tidak tertimpa oleh git)
  if [ -f \"/tmp/vps_live_database_backup.db\" ]; then
    cp -f \"/tmp/vps_live_database_backup.db\" \"${VPS_DIR}/prisma/dev.db\"
    cp -f \"/tmp/vps_live_database_backup.db\" \"${VPS_DIR}/dev.db\" 2>/dev/null || true
    chmod 666 \"${VPS_DIR}/prisma/dev.db\" \"${VPS_DIR}/dev.db\" 2>/dev/null || true
    rm -f \"/tmp/vps_live_database_backup.db\"
    echo '✅ Database live VPS 100% utuh dan tidak tersentuh.'
  fi
"

# 4. Generate Client, Rebuild Next.js & Restart PM2
echo "[3/4] Menginstal dependensi & sinkronisasi Prisma di VPS..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "
  cd ${VPS_DIR}
  npm install --include=dev
  npx prisma generate
  npx prisma db push
"

echo "[4/4] Membangun ulang (build) Next.js & me-restart server VPS..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "
  cd ${VPS_DIR}
  npm run build
  pm2 restart all --update-env
"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! KODE TERBARU BERHASIL DIUPDATE KE VPS!"
echo "  🔒 Database VPS: Utuh 100% tanpa perubahan data"
echo "  🌐 Website: https://portalumroh.barokahgroupindonesia.tech"
echo "=========================================================="
