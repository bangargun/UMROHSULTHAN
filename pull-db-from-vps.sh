#!/bin/bash
set -e

VPS_USER="root"
VPS_HOST="187.77.122.142"
VPS_DIR="/var/www/portalumroh"

# Pastikan script berjalan dari direktori tempat script ini berada
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
  rm -f prisma/dev.db.gz 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "=========================================================="
echo "  📥 TARIK DATABASE TERBARU DARI VPS KE LOKAL"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "=========================================================="

# 1. Backup Database Lokal Saat Ini
echo "[1/4] Membuat cadangan (backup) database lokal saat ini..."
mkdir -p backups
BACKUP_NAME="backups/local_before_pull_$(date +'%Y%m%d_%H%M%S').db"
if [ -f "prisma/dev.db" ]; then
  cp "prisma/dev.db" "$BACKUP_NAME"
  echo "✅ Backup database lokal tersimpan di: $BACKUP_NAME"
else
  echo "ℹ️ Belum ada database lokal sebelumnya, melanjutkan..."
fi

# 2. Buka koneksi master SSH
echo "🔑 Menghubungkan ke VPS (masukkan password 1x jika diminta)..."
ssh ${SSH_OPTS} -fN "${VPS_USER}@${VPS_HOST}"

# 3. Kompres & Unduh Database dari VPS
echo "[2/4] Menyiapkan & mengompres database di VPS..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "gzip -c ${VPS_DIR}/prisma/dev.db > /tmp/vps_dev_export.db.gz"

echo "[3/4] Mengunduh database dari VPS ke komputer lokal..."
scp -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}:/tmp/vps_dev_export.db.gz" "prisma/dev.db.gz"
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "rm -f /tmp/vps_dev_export.db.gz"

# 4. Ekstrak & Pasang di Lokal
echo "[4/4] Memasang database terbaru ke sistem lokal..."
gunzip -f "prisma/dev.db.gz"
chmod 666 "prisma/dev.db" 2>/dev/null || true

# Sinkronisasi Prisma Client Lokal
npx prisma generate >/dev/null 2>&1 || true

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! DATABASE DARI VPS BERHASIL DITARIK KE LOKAL!"
echo "  📂 Lokasi DB Lokal: prisma/dev.db"
echo "  💾 Backup Lama: $BACKUP_NAME"
echo "  🌐 Local Server: http://localhost:3005"
echo "=========================================================="
