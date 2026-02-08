import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ ...task, tags: JSON.parse(task.tags) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data: Record<string, unknown> = { ...body };
    if (body.tags) data.tags = JSON.stringify(body.tags);
    if (body.completedAt) data.completedAt = new Date(body.completedAt);
    const task = await prisma.task.update({ where: { id }, data });

    // Log activity
    const user = await getCurrentUser().catch(() => null);
    await prisma.activityLog.create({
      data: {
        userId: user?.id ?? null,
        action: "updated",
        entityType: "task",
        entityId: id,
        metadata: JSON.stringify({ fields: Object.keys(body) }),
      },
    });

    return NextResponse.json({ ...task, tags: JSON.parse(task.tags) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const task = await prisma.task.findUnique({ where: { id }, select: { title: true } });
    await prisma.task.delete({ where: { id } });

    const user = await getCurrentUser().catch(() => null);
    await prisma.activityLog.create({
      data: {
        userId: user?.id ?? null,
        action: "deleted",
        entityType: "task",
        entityId: id,
        metadata: JSON.stringify({ title: task?.title }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}
