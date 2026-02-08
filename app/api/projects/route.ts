import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const project = await prisma.project.create({
      data: {
        name: body.name,
        color: body.color ?? "#6366f1",
        description: body.description ?? "",
      },
    });
    const user = await getCurrentUser().catch(() => null);
    await prisma.activityLog.create({
      data: {
        userId: user?.id ?? null,
        action: "created",
        entityType: "project",
        entityId: project.id,
        metadata: JSON.stringify({ name: project.name }),
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 400 });
  }
}
