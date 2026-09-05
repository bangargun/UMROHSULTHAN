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
      title,
      name,
      fatherName,
      identityType,
      nik,
      passportName,
      passportNumber,
      passportIssuedDate,
      passportIssuedCity,
      passportExpiry,
      placeOfBirth,
      dateOfBirth,
      gender,
      address,
      subDistrict,
      district,
      city,
      province,
      telephone,
      phone,
      email,
      citizenship,
      maritalStatus,
      education,
      job,
      visaProvider,
      visaNumber,
      visaIssueDate,
      visaExpiryDate,
      mofaNumber,
      muassasahName,
      insuranceNumber,
      motherName,
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
    } = body;

    const updated = await prisma.pilgrim.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title : undefined,
        name: name !== undefined ? name : undefined,
        fatherName: fatherName !== undefined ? fatherName : undefined,
        identityType: identityType !== undefined ? identityType : undefined,
        nik: nik !== undefined ? nik : undefined,
        passportName: passportName !== undefined ? passportName : undefined,
        passportNumber: passportNumber !== undefined ? passportNumber : undefined,
        passportIssuedDate: passportIssuedDate ? new Date(passportIssuedDate) : passportIssuedDate === null ? null : undefined,
        passportIssuedCity: passportIssuedCity !== undefined ? passportIssuedCity : undefined,
        passportExpiry: passportExpiry ? new Date(passportExpiry) : passportExpiry === null ? null : undefined,
        placeOfBirth: placeOfBirth !== undefined ? placeOfBirth : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : dateOfBirth === null ? null : undefined,
        gender: gender !== undefined ? gender : undefined,
        address: address !== undefined ? address : undefined,
        subDistrict: subDistrict !== undefined ? subDistrict : undefined,
        district: district !== undefined ? district : undefined,
        city: city !== undefined ? city : undefined,
        province: province !== undefined ? province : undefined,
        telephone: telephone !== undefined ? telephone : undefined,
        phone: phone !== undefined ? phone : undefined,
        email: email !== undefined ? email : undefined,
        citizenship: citizenship !== undefined ? citizenship : undefined,
        maritalStatus: maritalStatus !== undefined ? maritalStatus : undefined,
        education: education !== undefined ? education : undefined,
        job: job !== undefined ? job : undefined,
        visaProvider: visaProvider !== undefined ? visaProvider : undefined,
        visaNumber: visaNumber !== undefined ? visaNumber : undefined,
        visaIssueDate: visaIssueDate ? new Date(visaIssueDate) : visaIssueDate === null ? null : undefined,
        visaExpiryDate: visaExpiryDate ? new Date(visaExpiryDate) : visaExpiryDate === null ? null : undefined,
        mofaNumber: mofaNumber !== undefined ? mofaNumber : undefined,
        muassasahName: muassasahName !== undefined ? muassasahName : undefined,
        insuranceNumber: insuranceNumber !== undefined ? insuranceNumber : undefined,
        motherName: motherName !== undefined ? motherName : undefined,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : undefined,
        emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : undefined,
        mahramName: mahramName !== undefined ? mahramName : undefined,
        mahramRelation: mahramRelation !== undefined ? mahramRelation : undefined,
        roomType: roomType !== undefined ? roomType : undefined,
        uniformSize: uniformSize !== undefined ? uniformSize : undefined,
        bloodType: bloodType !== undefined ? bloodType : undefined,
        healthNotes: healthNotes !== undefined ? healthNotes : undefined,
        ktpFileUrl: body.ktpFileUrl !== undefined ? body.ktpFileUrl : undefined,
        familyCardFileUrl: body.familyCardFileUrl !== undefined ? body.familyCardFileUrl : undefined,
        vaccineCardFileUrl: body.vaccineCardFileUrl !== undefined ? body.vaccineCardFileUrl : undefined,
        passportFileUrl: body.passportFileUrl !== undefined ? body.passportFileUrl : undefined,
        diplomaFileUrl: body.diplomaFileUrl !== undefined ? body.diplomaFileUrl : undefined,
        marriageBookFileUrl: body.marriageBookFileUrl !== undefined ? body.marriageBookFileUrl : undefined,
        portalPassword: body.portalPassword !== undefined ? body.portalPassword : undefined,
        status: status !== undefined ? status : undefined,
        packageId: packageId !== undefined ? packageId : undefined,
      },
      include: {
        package: true,
        user: true,
      },
    });

    // Sync linked User account
    try {
      const targetUsername = (updated.name || "jamaah")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      const finalPass = body.portalPassword || updated.portalPassword || "123456";

      let existingUser = await prisma.user.findUnique({ where: { username: targetUsername } });
      let finalUsername = targetUsername;
      if (existingUser && existingUser.pilgrimId !== updated.id) {
        finalUsername = `${targetUsername}_${updated.nik?.slice(-4) || updated.id.slice(0, 4)}`;
      }

      await prisma.user.upsert({
        where: { username: finalUsername },
        update: {
          name: updated.name,
          phone: updated.phone,
          email: updated.email || null,
          plainPassword: finalPass,
          password: finalPass,
          pilgrimId: updated.id,
        },
        create: {
          name: updated.name,
          username: finalUsername,
          password: finalPass,
          plainPassword: finalPass,
          phone: updated.phone,
          email: updated.email || null,
          role: "PILGRIM",
          isActive: true,
          pilgrimId: updated.id,
        },
      });
    } catch (syncErr) {
      console.warn("User sync warning on pilgrim update:", syncErr);
    }

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
