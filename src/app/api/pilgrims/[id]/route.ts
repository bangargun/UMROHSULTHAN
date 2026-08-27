import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const pilgrim = await prisma.pilgrim.findUnique({
      where: { id: params.id },
      include: {
        package: true,
        invoices: { orderBy: { createdAt: "desc" } },
        requirements: true,
        handovers: {
          include: {
            items: { include: { equipment: true } },
          },
        },
        letters: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!pilgrim) {
      return NextResponse.json({ error: "Jamaah tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(pilgrim);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pilgrim" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const {
      name,
      nik,
      passportNumber,
      passportExpiry,
      placeOfBirth,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      city,
      province,
      fatherName,
      motherName,
      emergencyContactName,
      emergencyContactPhone,
      mahramName,
      mahramRelation,
      roomType,
      uniformSize,
      bloodType,
      healthNotes,
      visaNumber,
      visaIssueDate,
      visaExpiryDate,
      mofaNumber,
      muassasahName,
      insuranceNumber,
      status,
      packageId,
    } = body;

    const updated = await prisma.pilgrim.update({
      where: { id: params.id },
      data: {
        name,
        nik,
        passportNumber,
        passportExpiry: passportExpiry ? new Date(passportExpiry) : undefined,
        visaNumber,
        visaIssueDate: visaIssueDate ? new Date(visaIssueDate) : undefined,
        visaExpiryDate: visaExpiryDate ? new Date(visaExpiryDate) : undefined,
        mofaNumber,
        muassasahName,
        insuranceNumber,
        placeOfBirth,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        phone,
        email,
        address,
        city,
        province,
        fatherName: fatherName !== undefined ? fatherName : undefined,
        motherName: motherName !== undefined ? motherName : undefined,
        emergencyContactName,
        emergencyContactPhone,
        mahramName,
        mahramRelation,
        roomType,
        uniformSize,
        bloodType,
        healthNotes,
        status,
        packageId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update pilgrim" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const pilgrim = await prisma.pilgrim.findUnique({ where: { id: params.id } });
    if (pilgrim) {
      await prisma.package.update({
        where: { id: pilgrim.packageId },
        data: { bookedCount: { decrement: 1 } },
      });
    }

    await prisma.pilgrim.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete pilgrim" }, { status: 500 });
  }
}
