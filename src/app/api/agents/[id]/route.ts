import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, phone, city, referralCode, commissionPerPax, bankName, accountNumber, accountHolder, status, paidCommission } = body;

    const existing = await prisma.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Agen tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        phone: phone !== undefined ? phone.trim() : existing.phone,
        city: city !== undefined ? city : existing.city,
        referralCode: referralCode !== undefined ? referralCode.toUpperCase().trim() : existing.referralCode,
        commissionPerPax: commissionPerPax !== undefined ? parseFloat(commissionPerPax) : existing.commissionPerPax,
        bankName: bankName !== undefined ? bankName : existing.bankName,
        accountNumber: accountNumber !== undefined ? accountNumber : existing.accountNumber,
        accountHolder: accountHolder !== undefined ? accountHolder : existing.accountHolder,
        status: status !== undefined ? status : existing.status,
        paidCommission: paidCommission !== undefined ? parseFloat(paidCommission) : existing.paidCommission,
        pendingCommission:
          paidCommission !== undefined
            ? Math.max(0, existing.totalCommissionEarned - parseFloat(paidCommission))
            : existing.pendingCommission,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.agent.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Agen berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}
