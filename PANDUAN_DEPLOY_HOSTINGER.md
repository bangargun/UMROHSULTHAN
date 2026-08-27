# 🚀 PANDUAN DEPLOYMENT APLIKASI KE HOSTINGER VPS

> **Dokumen Panduan Resmi & Catatan Akses**
> **Domain**: `portalumroh.barokahgroupindonesia.tech`
> **IP VPS Hostinger**: `187.77.122.142`
> **Repositori GitHub**: `https://github.com/bangargun/UMROHSULTHAN.git`

---

## 📌 Langkah-Langkah Deployment (Saat Anda Siap Online):

### 1. Masuk ke VPS Hostinger via SSH
Buka aplikasi **Terminal** di Mac Anda dan ketik:
```bash
ssh root@187.77.122.142
```
*(Masukkan password root VPS Hostinger Anda)*

---

### 2. Install Paket Pendukung (Hanya Sekali Saja)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update && sudo apt-get install -y nodejs git nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

---

### 3. Unduh Aplikasi dari GitHub ke Folder Web Server
```bash
cd /var/www
git clone https://github.com/bangargun/UMROHSULTHAN.git portalumroh
cd portalumroh
```

---

### 4. Jalankan Skrip Deploy Otomatis (Build + Database + PM2)
```bash
chmod +x deploy.sh
./deploy.sh
```

---

### 5. Aktifkan Konfigurasi Domain & Sertifikat SSL Gratis (HTTPS)
```bash
sudo cp hostinger-nginx.conf /etc/nginx/sites-available/portalumroh
sudo ln -s /etc/nginx/sites-available/portalumroh /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Pasang SSL Gratis Resmi Let's Encrypt:
sudo certbot --nginx -d portalumroh.barokahgroupindonesia.tech -d portalumroh-api.barokahgroupindonesia.tech
```

---

## 🔄 Cara Update Aplikasi di Masa Mendatang:
Setiap kali Anda selesai melakukan perubahan di lokal dan mengunggahnya ke GitHub, di server VPS Anda cukup jalankan 1 perintah ini:
```bash
cd /var/www/portalumroh && ./deploy.sh
```

---
*File ini tersimpan di root folder proyek: `PANDUAN_DEPLOY_HOSTINGER.md`*
