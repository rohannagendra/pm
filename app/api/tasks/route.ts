import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    tasks.map((t) => ({ ...t, tags: JSON.parse(t.tags) }))
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
      },
    });
    return NextResponse.json({ ...task, tags: JSON.parse(task.tags) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 400 });
  }
}
