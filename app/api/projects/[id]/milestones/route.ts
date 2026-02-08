import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const milestones = await prisma.milestone.findMany({
    where: { projectId: id },
    orderBy: { targetDate: "asc" },
  });
  return NextResponse.json(milestones);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const milestone = await prisma.milestone.create({
      data: {
        projectId: id,
        name: body.name,
        description: body.description ?? "",
        targetDate: body.targetDate,
      },
    });
    return NextResponse.json(milestone, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 400 });
  }
}
