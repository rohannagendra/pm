import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId: id },
    include: { dependsOn: true },
  });
  return NextResponse.json(
    dependencies.map((d) => ({
      ...d,
      dependsOn: { ...d.dependsOn, tags: JSON.parse(d.dependsOn.tags) },
    }))
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const dep = await prisma.taskDependency.create({
      data: {
        taskId: id,
        dependsOnId: body.dependsOnId,
      },
      include: { dependsOn: true },
    });
    return NextResponse.json(
      { ...dep, dependsOn: { ...dep.dependsOn, tags: JSON.parse(dep.dependsOn.tags) } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create dependency" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const url = new URL(request.url);
    const dependsOnId = url.searchParams.get("dependsOnId");
    if (!dependsOnId) {
      return NextResponse.json({ error: "dependsOnId required" }, { status: 400 });
    }
    await prisma.taskDependency.deleteMany({
      where: { taskId: id, dependsOnId },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete dependency" }, { status: 400 });
  }
}
