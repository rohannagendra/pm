import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: body.read ?? true },
    });
    return NextResponse.json(notification);
  } catch {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
}
