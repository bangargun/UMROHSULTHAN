const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

async function main() {
  const incomingDbPath = process.argv[2] || path.join(process.cwd(), 'prisma/dev_local_incoming.db');
  
  if (!fs.existsSync(incomingDbPath)) {
    console.log('ℹ️ Tidak ada database incoming yang ditemukan di:', incomingDbPath);
    return;
  }

  console.log('⚡ Memulai Smart Non-Destructive Data Merge...');
  console.log('📂 Database Sumber:', incomingDbPath);

  const prisma = new PrismaClient();

  try {
    // Matikan sementara foreign key check saat transfer batch
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
    
    // Attach database lokal yang baru di-upload
    await prisma.$executeRawUnsafe(`ATTACH DATABASE '${incomingDbPath}' AS incoming;`);

    // Dapatkan semua daftar tabel aplikasi (abaikan tabel internal sqlite / prisma)
    const tables = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';"
    );

    console.log(`📊 Ditemukan ${tables.length} tabel untuk disinkronkan.`);

    let totalInserted = 0;
    for (const row of tables) {
      const tableName = row.name;
      try {
        // INSERT OR IGNORE:
        // Jika Primary Key (ID) sudah ada di VPS -> JANGAN TIMPA (tetap pakai data VPS).
        // Jika Primary Key (ID) belum ada di VPS -> INSERT data baru dari lokal ke VPS.
        const affected = await prisma.$executeRawUnsafe(
          `INSERT OR IGNORE INTO "${tableName}" SELECT * FROM incoming."${tableName}";`
        );
        if (affected > 0) {
          console.log(`  ➕ [${tableName}]: ${affected} data baru berhasil disisipkan`);
          totalInserted += affected;
        }
      } catch (err) {
        // Jika skema tabel belum identik, lewati tanpa menghentikan proses
        console.warn(`  ⚠️ Tabel [${tableName}]: ${err.message}`);
      }
    }

    // Detach database incoming
    await prisma.$executeRawUnsafe('DETACH DATABASE incoming;');
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');

    console.log(`✅ Smart Data Merge Selesai! Total ${totalInserted} record data baru berhasil digabungkan.`);
    console.log('🔒 Seluruh data VPS yang sudah ada 100% AMAN tidak tertimpa.');
  } finally {
    await prisma.$disconnect();
    // Hapus file temporary incoming agar bersih
    try {
      fs.unlinkSync(incomingDbPath);
    } catch (_) {}
  }
}

main().catch((e) => {
  console.error('❌ Gagal melakukan smart data merge:', e);
  process.exit(1);
});
