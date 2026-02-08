import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subtasks = await prisma.subtask.findMany({
    where: { taskId: id },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(subtasks);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const maxOrder = await prisma.subtask.findFirst({
      where: { taskId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const subtask = await prisma.subtask.create({
      data: {
        taskId: id,
        title: body.title,
        completed: body.completed ?? false,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json(subtask, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create subtask" }, { status: 400 });
  }
}
