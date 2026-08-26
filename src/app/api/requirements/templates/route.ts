import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let templates = await prisma.requirementTemplate.findMany({
      orderBy: { orderIndex: "asc" },
    });

    if (templates.length === 0) {
      const defaultTemplates = [
        { name: "Paspor Asli (Masa Berlaku Min. 8 Bulan)", description: "Paspor 48/24 halaman asli dengan nama minimal 2 atau 3 kata", isMandatory: true, orderIndex: 1 },
        { name: "Buku Kuning / Sertifikat Vaksin Meningitis", description: "Buku ICV kuning resmi dari KKP / RS rujukan pemerintah", isMandatory: true, orderIndex: 2 },
        { name: "Pasfoto 4x6 Latar Belakang Putih (80% Wajah)", description: "Foto fisik 5 lembar fokus wajah 80% tanpa kacamata & penutup wajah", isMandatory: true, orderIndex: 3 },
        { name: "Fotokopi KTP & Kartu Keluarga (KK)", description: "Dokumen kependudukan yang masih berlaku", isMandatory: true, orderIndex: 4 },
        { name: "Buku Nikah Asli / Akta Lahir (Bagi Mahram)", description: "Bukti hubungan mahram suami-istri atau orang tua-anak", isMandatory: false, orderIndex: 5 },
        { name: "Surat Rekomendasi Kemenag / Kantor", description: "Surat pengantar izin cuti atau pembuatan paspor", isMandatory: false, orderIndex: 6 },
      ];

      for (const t of defaultTemplates) {
        await prisma.requirementTemplate.create({ data: t });
      }

      templates = await prisma.requirementTemplate.findMany({
        orderBy: { orderIndex: "asc" },
      });
    }

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch requirement templates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, isMandatory } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama syarat wajib diisi" }, { status: 400 });
    }

    const count = await prisma.requirementTemplate.count();
    const template = await prisma.requirementTemplate.create({
      data: {
        name,
        description: description || null,
        isMandatory: isMandatory !== undefined ? isMandatory : true,
        orderIndex: count + 1,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Nama syarat sudah ada di database" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create requirement template" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, isMandatory, orderIndex } = body;

    const updated = await prisma.requirementTemplate.update({
      where: { id },
      data: {
        name,
        description,
        isMandatory,
        orderIndex,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update requirement template" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID template required" }, { status: 400 });
    }

    await prisma.requirementTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete requirement template" }, { status: 500 });
  }
}
