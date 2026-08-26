const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Setting up clean Sulthan Haramain Master Data...');

  // 1. Clear transactional data
  await prisma.expense.deleteMany({});
  await prisma.officialLetter.deleteMany({});
  await prisma.handoverItem.deleteMany({});
  await prisma.logisticsHandover.deleteMany({});
  await prisma.pilgrimRequirement.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.pilgrim.deleteMany({});
  await prisma.leadInteraction.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.package.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.requirementTemplate.deleteMany({});
  await prisma.travelSetting.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Travel Settings
  await prisma.travelSetting.create({
    data: {
      id: 'default-settings',
      companyName: 'PT SULTHAN HARAMAIN TOUR & TRAVEL',
      licenseNumber: 'PPIU Kemenag RI No. U.412 Tahun 2022',
      address: 'Sulthan Haramain Tower, Jl. Prof. Dr. Satrio No. 88, Kuningan, Jakarta Selatan 12940',
      phone: '(021) 5290-8888 / 0811-9876-5432',
      email: 'salam@sulthanharamain.com',
      website: 'www.sulthanharamain.com',
      directorName: 'H. Sulthan Syarif, Lc., M.A.',
      directorTitle: 'Direktur Utama',
      bankBSI: '8888-999-123 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL',
      bankBCA: '731-888-9900 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL',
      bankMandiri: '137-00-8888999-1 a.n PT SULTHAN HARAMAIN TOUR & TRAVEL',
    },
  });

  // 3. Requirement Templates Master
  const defaultTemplates = [
    { name: 'Paspor Asli (Masa Berlaku Min. 8 Bulan)', description: 'Paspor 48/24 halaman asli dengan nama minimal 2 atau 3 kata', isMandatory: true, orderIndex: 1 },
    { name: 'Buku Kuning / Sertifikat Vaksin Meningitis', description: 'Buku ICV kuning resmi dari KKP / RS rujukan pemerintah', isMandatory: true, orderIndex: 2 },
    { name: 'Pasfoto 4x6 Latar Belakang Putih (80% Wajah)', description: 'Foto fisik 5 lembar fokus wajah 80% tanpa kacamata & penutup wajah', isMandatory: true, orderIndex: 3 },
    { name: 'Fotokopi KTP & Kartu Keluarga (KK)', description: 'Dokumen kependudukan yang masih berlaku', isMandatory: true, orderIndex: 4 },
    { name: 'Buku Nikah Asli / Akta Lahir (Bagi Mahram)', description: 'Bukti hubungan mahram suami-istri atau orang tua-anak', isMandatory: false, orderIndex: 5 },
    { name: 'Surat Rekomendasi Kemenag / Kantor', description: 'Surat pengantar izin cuti atau pembuatan paspor', isMandatory: false, orderIndex: 6 },
  ];
  for (const t of defaultTemplates) {
    await prisma.requirementTemplate.create({ data: t });
  }

  // 4. Equipment Catalog Master (Stok Awal 0)
  const defaultEquipments = [
    { sku: 'EQ-KOP-24', name: 'Koper Bagasi 24 Inch (Fiber TSA Lock)', category: 'LUGGAGE', unit: 'Pcs', totalStock: 0, availableStock: 0, minStockAlert: 20 },
    { sku: 'EQ-KOP-20', name: 'Koper Kabin 20 Inch', category: 'LUGGAGE', unit: 'Pcs', totalStock: 0, availableStock: 0, minStockAlert: 20 },
    { sku: 'EQ-TAS-PSP', name: 'Tas Paspor & Selempang Dokumen', category: 'ACCESSORY', unit: 'Pcs', totalStock: 0, availableStock: 0, minStockAlert: 30 },
    { sku: 'EQ-KAI-IHR', name: 'Kain Ihram + Sabuk Haji (Pria)', category: 'CLOTHING', unit: 'Set', totalStock: 0, availableStock: 0, minStockAlert: 25 },
    { sku: 'EQ-MUK-BRG', name: 'Mukena Bergo & Jilbab Syar\'i (Wanita)', category: 'CLOTHING', unit: 'Set', totalStock: 0, availableStock: 0, minStockAlert: 25 },
    { sku: 'EQ-KAI-BTK', name: 'Bahan Kain Batik Seragam Resmi', category: 'CLOTHING', unit: 'Potong', totalStock: 0, availableStock: 0, minStockAlert: 30 },
    { sku: 'EQ-BUK-DOA', name: 'Buku Saku Doa & Panduan Manasik', category: 'BOOK', unit: 'Buku', totalStock: 0, availableStock: 0, minStockAlert: 50 },
    { sku: 'EQ-BNT-LHR', name: 'Bantal Leher & Payung Lipat', category: 'ACCESSORY', unit: 'Pcs', totalStock: 0, availableStock: 0, minStockAlert: 20 },
  ];
  for (const eq of defaultEquipments) {
    await prisma.equipment.create({ data: eq });
  }

  console.log('✅ Clean Master Data Ready!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
