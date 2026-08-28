# 🚀 PANDUAN LENGKAP DEPLOYMENT SULTHAN HARAMAIN KE VPS HOSTINGER

> **Informasi Server & Domain:**
> * **Domain Utama**: `portalumroh.barokahgroupindonesia.tech`
> * **Subdomain API**: `portalumroh-api.barokahgroupindonesia.tech`
> * **IP VPS Hostinger**: `187.77.122.142`
> * **Repositori GitHub**: `https://github.com/bangargun/UMROHSULTHAN.git`
> * **Node.js**: v20 LTS
> * **Database**: SQLite terintegrasi pada VPS (`file:./prisma/dev.db`)

---

## 📋 Langkah-Langkah Deployment dari Awal (Fresh Setup)

### Langkah 1: Masuk ke VPS Hostinger via SSH
Buka aplikasi **Terminal** di Mac Anda, lalu ketik perintah berikut:
```bash
ssh root@187.77.122.142
```
*(Ketik `yes` jika muncul konfirmasi pertama kali, lalu masukkan password root VPS Hostinger Anda).*

---

### Langkah 2: Install Node.js v20, Git, Nginx & PM2 (Hanya 1 Kali)
Jalankan perintah ini di dalam terminal VPS:
```bash
# 1. Tambahkan repository Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2. Install Node.js, Git, Nginx, Certbot SSL
sudo apt-get update && sudo apt-get install -y nodejs git nginx certbot python3-certbot-nginx

# 3. Install PM2 Process Manager secara global
sudo npm install -g pm2
```

---

### Langkah 3: Clone Repositori dari GitHub
```bash
# Pindah ke folder web server
cd /var/www

# Clone kode aplikasi dari GitHub
git clone https://github.com/bangargun/UMROHSULTHAN.git portalumroh

# Masuk ke folder proyek
cd /var/www/portalumroh
```

---

### Langkah 4: Buat File `.env` di VPS
```bash
cat << 'EOF' > .env
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
NODE_ENV=production
EOF
```

---

### Langkah 5: Jalankan Skrip Deploy Otomatis
```bash
# Beri izin eksekusi skrip
chmod +x deploy.sh

# Eksekusi build, migrasi database, dan start PM2
./deploy.sh
```

---

### Langkah 6: Konfigurasi Nginx & Domain Hostinger
File konfigurasi Nginx sudah disiapkan di dalam repositori (`hostinger-nginx.conf`). Anda cukup mengaktifkannya:
```bash
# Salin konfigurasi Nginx
sudo cp hostinger-nginx.conf /etc/nginx/sites-available/portalumroh

# Aktifkan site di Nginx
sudo ln -s /etc/nginx/sites-available/portalumroh /etc/nginx/sites-enabled/

# Tes konfigurasi Nginx dan reload
sudo nginx -t && sudo systemctl reload nginx
```

---

### Langkah 7: Pasang Sertifikat SSL Gratis (HTTPS / Gembok Hijau)
Jalankan Certbot untuk mengamankan domain:
```bash
sudo certbot --nginx -d portalumroh.barokahgroupindonesia.tech -d portalumroh-api.barokahgroupindonesia.tech
```
*(Ikuti petunjuk di layar: masukkan email Anda dan pilih opsi redirect all traffic to HTTPS).*

Selesai! Aplikasi Anda sekarang dapat diakses secara publik di:  
🌐 **https://portalumroh.barokahgroupindonesia.tech**

---

## 🔄 Cara Melakukan Update Aplikasi di Masa Mendatang

Setiap kali Anda selesai melakukan perubahan kode di Mac lokal dan melakukan `git push`, di server VPS Anda **hanya perlu menjalankan 1 perintah ini**:

```bash
cd /var/www/portalumroh && ./deploy.sh
```

Skrip `deploy.sh` akan secara otomatis:
1. Menarik kode terbaru dari GitHub (`git pull origin main`).
2. Menginstal dependensi baru jika ada (`npm install`).
3. Mensinkronkan skema database (`npx prisma db push`).
4. Mengompilasi build produksi Next.js (`npm run build`).
5. Melakukan restart halus (*zero-downtime reload*) pada PM2 cluster.

---

## 🛠️ Perintah Berguna untuk Manajemen Server

### 1. Memeriksa Status Aplikasi (PM2):
```bash
pm2 status
```

### 2. Melihat Log Realtime:
```bash
pm2 logs sulthan-haramain
```

### 3. Restart Aplikasi:
```bash
pm2 restart sulthan-haramain
```

### 4. Backup Database SQLite:
Untuk membackup database jamaah dan paket di VPS:
```bash
cp /var/www/portalumroh/prisma/dev.db /root/backup_dev_$(date +%F).db
```

---

*Dokumen ini tersimpan di root folder proyek sebagai:*  
[`PANDUAN_DEPLOY_HOSTINGER.md`](./PANDUAN_DEPLOY_HOSTINGER.md)
