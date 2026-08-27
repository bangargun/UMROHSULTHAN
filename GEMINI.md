# KEBIJAKAN MUTLAK SISTEM: BEBAS DATA MOCK / PALSU (ZERO-MOCK DATA POLICY)

Aturan ini bersifat WAJIB dan mengikat secara mutlak di seluruh pengerjaan kode, API endpoint, komponen antarmuka (UI), dan skrip database pada proyek ini:

1. **Dilarang Keras Membuat atau Menggunakan Data Mock / Dummy**:
   - Agen TIDAK BOLEH memasukkan data contoh, data rekaan, atau nama fiktif (seperti prospek palsu, jamaah palsu, paket contoh, invoice contoh, nama staf contoh seperti "Siti", hotel/maskapai contoh, rekor FAQ contoh, barang perlengkapan contoh, dsb).
   - Jangan pernah menyematkan data palsu pada state awal form (`useState`), konstanta, atau *fallback string*.

2. **Kondisi Kosong Wajib Dibiarkan Kosong (Clean Empty States)**:
   - Jika tabel database atau array data belum diisi oleh pengguna, biarkan data bernilai kosong (`[]`, `""`, atau `null`).
   - Tampilkan *empty state* yang bersih dan profesional pada UI (misal: *"Belum ada data jamaah. Klik tombol + Tambah untuk menginput data asli"*).

3. **Dilarang Menggunakan Logika Auto-Seeding pada API**:
   - Dilarang keras menulis blok kode `if (records.length === 0) { createDefaultMockItems() }` pada *endpoint* API manapun.
   - Database hanya boleh berisi data yang diinputkan secara sadar oleh pengguna melalui antarmuka atau akun Superadmin asli (**Coach Argun** / `@master`).

4. **Inisialisasi Form Bersih (Clean Form Initializers)**:
   - Seluruh form input (`Tambah / Edit`) wajib memiliki nilai awal *string* kosong `""` atau angka nol murni tanpa isian nama rekaan atau nominal simulasi.

5. **Wajib Memeriksa Aturan Ini Sebelum Setiap Tindakan**:
   - Sebelum mengeksekusi perubahan kode atau menambahkan modul baru, agen wajib memvalidasi bahwa implementasi tersebut 100% bebas dari data palsu.
