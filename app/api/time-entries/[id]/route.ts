import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const entry = await prisma.timeEntry.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed to update time entry" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.timeEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
  }
}
