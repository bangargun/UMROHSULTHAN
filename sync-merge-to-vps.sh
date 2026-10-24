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
echo "  🚀 SMART SYNC: KODE & MERGE DATA TANPA MENIMPA DATA VPS"
echo "  Server: ${VPS_USER}@${VPS_HOST}"
echo "=========================================================="

cd "$(dirname "$0")"

# 1. Backup Lokal Otomatis
echo "[1/5] Membuat backup lokal..."
mkdir -p backups
BACKUP_LOCAL="backups/dev_local_$(date +'%Y%m%d_%H%M%S').db"
if [ -f "prisma/dev.db" ]; then
  cp "prisma/dev.db" "$BACKUP_LOCAL"
  echo "✅ Backup lokal tersimpan di: $BACKUP_LOCAL"
fi

# 2. Push Kode Terbaru ke GitHub (Database Lokal Dikecualikan)
echo "[2/5] Menyimpan & mengirim kode terbaru ke GitHub..."
git add .
git reset prisma/dev.db 2>/dev/null || true

if ! git diff --cached --quiet; then
  git commit -m "Update kode & smart merge node runner: $(date +'%Y-%m-%d %H:%M')"
  git push origin main
else
  echo "ℹ️ Tidak ada perubahan kode baru yang belum di-commit, push branch main..."
  git push origin main || true
fi

# Buka koneksi master SSH
echo "🔑 Menghubungkan ke VPS (masukkan password 1x jika diminta)..."
ssh ${SSH_OPTS} -fN "${VPS_USER}@${VPS_HOST}"

# 3. Pull Kode Terbaru di VPS & Backup DB VPS
echo "[3/5] Mengambil kode terbaru & backup database di VPS..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "
  set -e
  cd ${VPS_DIR}
  
  # Pastikan folder backup di VPS siap
  mkdir -p backups
  VPS_BK=\"backups/vps_backup_\$(date +'%Y%m%d_%H%M%S').db\"
  if [ -f prisma/dev.db ]; then
    cp -f prisma/dev.db \"\$VPS_BK\"
    echo \"✅ Backup VPS berhasil dibuat: \$VPS_BK\"
  fi

  # Pull kode terbaru dari GitHub
  git fetch origin main
  git reset --hard origin/main
"

# 4. Upload Database Lokal ke Temporary File di VPS & Lakukan Smart Non-Destructive Merge via Node.js
echo "[4/5] Meng-upload data lokal untuk digabungkan secara aman (tanpa menimpa data VPS)..."
gzip -c "prisma/dev.db" > "prisma/dev.db.gz"
scp -o ControlPath="${SSH_SOCKET}" "prisma/dev.db.gz" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/prisma/dev_local_incoming.db.gz"
rm -f "prisma/dev.db.gz"

ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "
  set -e
  cd ${VPS_DIR}
  
  # Decompress incoming database
  gunzip -f prisma/dev_local_incoming.db.gz

  # Sinkronkan skema jika ada model baru sebelum merge
  npx prisma generate
  npx prisma db push --skip-generate

  echo '⚡ Menggabungkan data lokal baru ke database VPS via Smart Node Merge...'
  node scripts/smart-merge.js \"${VPS_DIR}/prisma/dev_local_incoming.db\"

  chmod 666 prisma/dev.db 2>/dev/null || true
  chmod -R 777 prisma 2>/dev/null || true
"

# 5. Rebuild Next.js & Restart PM2 di VPS
echo "[5/5] Rebuild Next.js & restart server di VPS..."
ssh -o ControlPath="${SSH_SOCKET}" "${VPS_USER}@${VPS_HOST}" "
  set -e
  cd ${VPS_DIR}
  npm install --include=dev
  npm run build
  pm2 restart all --update-env
  
  # Otomatis aktifkan Webhook Telegram Bot
  echo '🤖 Mengaktifkan Webhook Telegram Bot @sulthanharamainbot...'
  curl -s 'https://api.telegram.org/bot8857243171:AAHmGmUDwLmxThPHEwfoJMvowSGjTmSeVng/setWebhook?url=https://portalumroh.barokahgroupindonesia.tech/api/telegram/webhook' || true
  echo ''
"

echo "=========================================================="
echo "  ✅ ALHAMDULILLAH! UPDATE KODE & MERGE DATA SUKSES!"
echo "  🔒 Seluruh data di VPS tidak tertimpa dan data lokal baru telah masuk"
echo "  🌐 Website: https://portalumroh.barokahgroupindonesia.tech"
echo "=========================================================="
