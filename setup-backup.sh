#!/bin/bash
# ==============================================================================
#  SETUP JADWAL AUTO-BACKUP DATABASE (PUKUL 02:00 SETIAP HARI)
# ==============================================================================

set -e

BACKUP_SCRIPT="/var/www/portalumroh/scripts/backup.sh"

# Berikan izin eksekusi pada skrip backup
chmod +x "$BACKUP_SCRIPT"

# Buat cron job jika belum ada
CRON_JOB="0 2 * * * /bin/bash /var/www/portalumroh/scripts/backup.sh >/dev/null 2>&1"

# Cek apakah sudah terdaftar di crontab
(crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT") || (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "================================================================="
echo "  ✅ AUTO-BACKUP BERHASIL DIAKTIFKAN!"
echo "  ⏰ Jadwal: Setiap Hari Pukul 02:00 Pagi"
echo "  📂 Lokasi Simpan: /var/www/portalumroh/backups/"
echo "  🗜️ Format: Terkompresi (.db.gz) + Auto Hapus > 30 Hari"
echo "================================================================="

# Jalankan backup perdana sekarang untuk pengetesan
/bin/bash "$BACKUP_SCRIPT"
echo "  🎉 Test backup pertama berhasil dibuat!"
