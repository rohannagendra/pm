import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subtasks: { orderBy: { sortOrder: "asc" } },
      dependencies: { include: { dependsOn: true } },
      timeEntries: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      _count: { select: { comments: true } },
    },
  });
  return NextResponse.json(
    tasks.map((t) => ({
      ...t,
      tags: JSON.parse(t.tags),
      commentCount: t._count.comments,
      _count: undefined,
      dependencies: t.dependencies.map((d) => ({
        ...d,
        dependsOn: { ...d.dependsOn, tags: JSON.parse(d.dependsOn.tags) },
      })),
    }))
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? "",
        status: body.status ?? "todo",
        priority: body.priority ?? "medium",
        dueDate: body.dueDate ?? null,
        project: body.project ?? null,
        tags: JSON.stringify(body.tags ?? []),
        recurrence: body.recurrence ?? null,
        estimatedMinutes: body.estimatedMinutes ?? null,
        assigneeId: body.assigneeId ?? null,
      },
      include: {
        subtasks: true,
        dependencies: { include: { dependsOn: true } },
        timeEntries: true,
        attachments: true,
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: { select: { comments: true } },
      },
    });

    // Log activity
    const user = await getCurrentUser().catch(() => null);
    await prisma.activityLog.create({
      data: {
        userId: user?.id ?? null,
        action: "created",
        entityType: "task",
        entityId: task.id,
        metadata: JSON.stringify({ title: task.title }),
      },
    });

    return NextResponse.json(
      { ...task, tags: JSON.parse(task.tags), commentCount: task._count.comments, _count: undefined, dependencies: [] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 400 });
  }
}
