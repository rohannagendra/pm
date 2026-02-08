import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entries = await prisma.timeEntry.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const entry = await prisma.timeEntry.create({
      data: {
        taskId: id,
        userId: body.userId,
        minutes: body.minutes,
        date: body.date,
        note: body.note ?? "",
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 400 });
  }
}
