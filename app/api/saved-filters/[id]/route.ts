import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const filter = await prisma.savedFilter.update({
      where: { id },
      data: {
        name: body.name,
        config: body.config ? JSON.stringify(body.config) : undefined,
      },
    });
    return NextResponse.json({ ...filter, config: JSON.parse(filter.config) });
  } catch {
    return NextResponse.json({ error: "Failed to update filter" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.savedFilter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete filter" }, { status: 400 });
  }
}
