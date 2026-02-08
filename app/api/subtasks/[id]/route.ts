import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const subtask = await prisma.subtask.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(subtask);
  } catch {
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.subtask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }
}
