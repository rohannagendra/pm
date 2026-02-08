import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const milestone = await prisma.milestone.update({ where: { id }, data: body });
    return NextResponse.json(milestone);
  } catch {
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.milestone.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }
}
