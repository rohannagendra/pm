import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ tasks: [], projects: [], events: [] });
  }

  const [tasks, projects, events] = await Promise.all([
    prisma.task.findMany({
      where: { title: { contains: q } },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { name: { contains: q } },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.calendarEvent.findMany({
      where: { title: { contains: q } },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    tasks: tasks.map((t) => ({ ...t, tags: JSON.parse(t.tags) })),
    projects,
    events,
  });
}
