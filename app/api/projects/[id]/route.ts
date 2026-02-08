import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const project = await prisma.project.update({ where: { id }, data: body });
    const user = await getCurrentUser().catch(() => null);
    await prisma.activityLog.create({
      data: { userId: user?.id ?? null, action: "updated", entityType: "project", entityId: id, metadata: JSON.stringify({ fields: Object.keys(body) }) },
    });
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update project" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { id }, select: { name: true } });
    await prisma.project.delete({ where: { id } });
    const user = await getCurrentUser().catch(() => null);
    await prisma.activityLog.create({
      data: { userId: user?.id ?? null, action: "deleted", entityType: "project", entityId: id, metadata: JSON.stringify({ name: project?.name }) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}
